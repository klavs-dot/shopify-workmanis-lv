import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { enrichProduct } from "@/lib/ai/enrich";
import type { Product, UserRole } from "@/lib/types";

export const runtime = "nodejs";
// Web search + fetch can take 30–60s per product. Vercel Pro allows up to 800s
// for Node runtime (300s on the Hobby plan). We cap at 300 for safety.
export const maxDuration = 300;

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

export async function POST(req: Request) {
  try {
    const { callerUid, callerEmail } = await assertAdminOrMaster(req);

    const body = (await req.json()) as { productId?: string };
    if (!body.productId) {
      return NextResponse.json({ error: "Trūkst productId" }, { status: 400 });
    }

    const { db } = getFirebaseAdmin();
    const productRef = db.collection("products").doc(body.productId);
    const productSnap = await productRef.get();
    if (!productSnap.exists) {
      return NextResponse.json({ error: "Produkts nav atrasts" }, { status: 404 });
    }
    const product = productSnap.data() as Omit<Product, "id">;

    // Optimistically mark as in-progress so concurrent triggers are visible.
    await productRef.update({
      aiStatus: "enrichment_pending",
      updatedAt: FieldValue.serverTimestamp(),
    });
    await db.collection("auditLogs").add({
      userId: callerUid,
      userEmail: callerEmail,
      action: "ai_enrichment_started",
      entityType: "product",
      entityId: body.productId,
      before: null,
      after: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    try {
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

      // Combine original Jobalots images first, then enriched ones, deduped,
      // capped at 12 for performance.
      const mergedImages = Array.from(
        new Set<string>([
          ...(product.manifestImages ?? []),
          ...enriched.enrichedImages,
        ])
      ).slice(0, 12);

      const updateFields: Record<string, unknown> = {
        aiStatus: enriched.confidenceScore >= 0.6 ? "enriched" : "needs_review",
        enrichedTitle: enriched.enrichedTitle,
        enrichedTitleEn: enriched.enrichedTitleEn,
        enrichedTitleRu: enriched.enrichedTitleRu,
        descriptionLv: enriched.descriptionLv,
        descriptionEn: enriched.descriptionEn,
        descriptionRu: enriched.descriptionRu,
        enrichedImages: enriched.enrichedImages,
        images: mergedImages,
        sourceUrls: enriched.sourceUrls,
        confidenceScore: enriched.confidenceScore,
        updatedAt: FieldValue.serverTimestamp(),
      };
      // Only overwrite the category if Jobalots didn't supply one.
      if (!product.categoryName && enriched.suggestedCategory) {
        updateFields.categoryName = enriched.suggestedCategory;
      }

      await productRef.update(updateFields);

      await db.collection("auditLogs").add({
        userId: callerUid,
        userEmail: callerEmail,
        action: "ai_enrichment_completed",
        entityType: "product",
        entityId: body.productId,
        before: null,
        after: {
          confidenceScore: enriched.confidenceScore,
          enrichedTitle: enriched.enrichedTitle,
          enrichedImagesCount: enriched.enrichedImages.length,
          sourceUrlsCount: enriched.sourceUrls.length,
          suggestedCategory: enriched.suggestedCategory,
          notes: enriched.notes ?? null,
          usage,
        },
        createdAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ ok: true, enriched, usage });
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
        entityId: body.productId,
        before: null,
        after: { error: msg },
        createdAt: FieldValue.serverTimestamp(),
      });
      throw err;
    }
  } catch (err) {
    const e = err as Error & { status?: number };
    const status = e.status ?? 500;
    return NextResponse.json(
      { error: e.message || "Neparedzēta kļūda" },
      { status }
    );
  }
}
