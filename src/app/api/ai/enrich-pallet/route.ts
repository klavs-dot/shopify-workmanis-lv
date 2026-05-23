import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { enrichProduct } from "@/lib/ai/enrich";
import type { Product, UserRole } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 800; // Vercel Pro Node.js cap

async function assertAdminOrMaster(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!idToken) throw httpError(401, "Trūkst autentifikācijas tokena");

  const { auth, db } = getFirebaseAdmin();
  const decoded = await auth.verifyIdToken(idToken);
  const snap = await db.collection("users").doc(decoded.uid).get();
  if (!snap.exists) throw httpError(403, "Lietotājs nav reģistrēts");
  const role = snap.get("role") as UserRole | undefined;
  if (role !== "MASTER" && role !== "ADMIN") {
    throw httpError(403, "Nepieciešama MASTER vai ADMIN loma");
  }
  return { callerUid: decoded.uid, callerEmail: decoded.email ?? "" };
}

function httpError(status: number, message: string) {
  const e = new Error(message) as Error & { status?: number };
  e.status = status;
  return e;
}

interface PalletEnrichInput {
  palletId?: string;
  /** When true, also re-enrich products that already have enriched data. */
  rerun?: boolean;
  /** Hard cap so a single request doesn't burn through 200 products. */
  limit?: number;
}

interface PerProductResult {
  productId: string;
  ok: boolean;
  error?: string;
  confidenceScore?: number;
  enrichedImagesCount?: number;
}

export async function POST(req: Request) {
  try {
    const { callerUid, callerEmail } = await assertAdminOrMaster(req);

    const body = (await req.json()) as PalletEnrichInput;
    if (!body.palletId) {
      return NextResponse.json({ error: "Trūkst palletId" }, { status: 400 });
    }
    const limit = Math.max(1, Math.min(body.limit ?? 50, 200));

    const { db } = getFirebaseAdmin();
    const palletSnap = await db.collection("pallets").doc(body.palletId).get();
    if (!palletSnap.exists) {
      return NextResponse.json({ error: "Palete nav atrasta" }, { status: 404 });
    }

    // Pull products. If `rerun` is false, we only touch ones that haven't been
    // enriched yet (and haven't been disposed).
    const productsSnap = await db
      .collection("products")
      .where("palletId", "==", body.palletId)
      .get();
    let candidates = productsSnap.docs
      .map(
        (d) =>
          ({ id: d.id, ...(d.data() as Omit<Product, "id">) }) as Product
      )
      .filter((p) => p.listingStatus !== "disposed");
    if (!body.rerun) {
      candidates = candidates.filter(
        (p) => p.aiStatus === "not_started" || p.aiStatus === "failed"
      );
    }
    candidates = candidates.slice(0, limit);

    const results: PerProductResult[] = [];

    for (const product of candidates) {
      const productRef = db.collection("products").doc(product.id);
      try {
        await productRef.update({
          aiStatus: "enrichment_pending",
          updatedAt: FieldValue.serverTimestamp(),
        });

        const { result: enriched, usage } = await enrichProduct({
          productSku: product.productSku ?? "",
          manifestSku: product.manifestSku ?? "",
          title: product.title ?? "",
          description: product.description ?? "",
          asin: product.asin ?? "",
          ean: product.ean ?? "",
          barcode: product.barcode ?? "",
          brand: product.brand ?? "",
          categoryName: product.categoryName ?? "",
          subCategoryName: product.subCategoryName ?? "",
          condition: product.condition,
          manifestImages: product.manifestImages ?? [],
        });

        const mergedImages = Array.from(
          new Set<string>([
            ...(product.manifestImages ?? []),
            ...enriched.enrichedImages,
          ])
        ).slice(0, 12);

        const updateFields: Record<string, unknown> = {
          aiStatus: enriched.confidenceScore >= 0.6 ? "enriched" : "needs_review",
          enrichedTitle: enriched.enrichedTitle,
          descriptionLv: enriched.descriptionLv,
          descriptionEn: enriched.descriptionEn,
          enrichedImages: enriched.enrichedImages,
          images: mergedImages,
          sourceUrls: enriched.sourceUrls,
          confidenceScore: enriched.confidenceScore,
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (!product.categoryName && enriched.suggestedCategory) {
          updateFields.categoryName = enriched.suggestedCategory;
        }
        await productRef.update(updateFields);

        await db.collection("auditLogs").add({
          userId: callerUid,
          userEmail: callerEmail,
          action: "ai_enrichment_completed",
          entityType: "product",
          entityId: product.id,
          before: null,
          after: {
            confidenceScore: enriched.confidenceScore,
            enrichedImagesCount: enriched.enrichedImages.length,
            suggestedCategory: enriched.suggestedCategory,
            notes: enriched.notes ?? null,
            usage,
            via: "enrich-pallet",
          },
          createdAt: FieldValue.serverTimestamp(),
        });

        results.push({
          productId: product.id,
          ok: true,
          confidenceScore: enriched.confidenceScore,
          enrichedImagesCount: enriched.enrichedImages.length,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await productRef.update({
          aiStatus: "failed",
          updatedAt: FieldValue.serverTimestamp(),
        });
        await db.collection("auditLogs").add({
          userId: callerUid,
          userEmail: callerEmail,
          action: "ai_enrichment_completed",
          entityType: "product",
          entityId: product.id,
          before: null,
          after: { error: msg, via: "enrich-pallet" },
          createdAt: FieldValue.serverTimestamp(),
        });
        results.push({ productId: product.id, ok: false, error: msg });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    const status = e.status ?? 500;
    return NextResponse.json(
      { error: e.message || "Neparedzēta kļūda" },
      { status }
    );
  }
}
