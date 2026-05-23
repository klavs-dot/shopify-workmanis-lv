/*
 * Seed Firebase EMULATORS with demo users + sample data.
 *
 * Use this for local development only. Emulators must already be running:
 *   npm run emulators        # in one terminal
 *   npm run seed:emulator    # in another terminal
 *
 * Demo accounts created (all share password "Demo1234!"):
 *   master@demo.local     — MASTER
 *   admin@demo.local      — ADMIN
 *   warehouse@demo.local  — WAREHOUSE
 *   viewer@demo.local     — VIEWER
 *
 * Plus one sample pallet "RED19276 — Demo manifest" with a few products.
 *
 * No service-account JSON needed. firebase-admin auto-detects emulators
 * when FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST are set.
 *
 * Project: shopify.workmanis.lv  (SEPARATE from Workmanis.lv).
 */

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.GCLOUD_PROJECT ??= "shopify-workmanis-demo";

import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

type DemoRole = "MASTER" | "ADMIN" | "WAREHOUSE" | "VIEWER";

const DEMO_PASSWORD = "Demo1234!";

const DEMO_USERS: { email: string; displayName: string; role: DemoRole }[] = [
  { email: "master@demo.local", displayName: "Demo Master", role: "MASTER" },
  { email: "admin@demo.local", displayName: "Demo Admin", role: "ADMIN" },
  { email: "warehouse@demo.local", displayName: "Demo Warehouse", role: "WAREHOUSE" },
  { email: "viewer@demo.local", displayName: "Demo Viewer", role: "VIEWER" },
];

interface DemoProduct {
  title: string;
  brand: string;
  category: string;
  asin: string;
  ean: string;
  qty: number;
  refPrice: number;
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    title: "Extra long 170cm dog ramp car foldable",
    brand: "PetRamps",
    category: "Pet Supplies",
    asin: "B0CNCS7NN1",
    ean: "5060000000011",
    qty: 1,
    refPrice: 89.99,
  },
  {
    title: "Stair Railing with Handrail",
    brand: "HomePro",
    category: "Home & Garden",
    asin: "B0F66GD3MH",
    ean: "5060000000028",
    qty: 1,
    refPrice: 129.99,
  },
  {
    title: "Wooden Jewellery Box",
    brand: "OakCraft",
    category: "Home & Garden",
    asin: "B0DWV6PGBJ",
    ean: "5060000000035",
    qty: 2,
    refPrice: 34.5,
  },
  {
    title: "Smoke detector 6-pack",
    brand: "SafeAlert",
    category: "Tools & Home Improvement",
    asin: "B0D3PXFG2J",
    ean: "5060000000042",
    qty: 1,
    refPrice: 49.99,
  },
  {
    title: "Large Foldable Dog Ramp",
    brand: "PetRamps",
    category: "Pet Supplies",
    asin: "B0D000FOLD1",
    ean: "5060000000059",
    qty: 1,
    refPrice: 74.95,
  },
  {
    title: "Baby/Pet Gate Stabiliser",
    brand: "SafeBaby",
    category: "Baby",
    asin: "B0D000GATE1",
    ean: "5060000000066",
    qty: 3,
    refPrice: 14.99,
  },
  {
    title: "Stainless Steel Food Covers (set of 4)",
    brand: "KitchenPlus",
    category: "Kitchen",
    asin: "B0D000COVR1",
    ean: "5060000000073",
    qty: 1,
    refPrice: 24.0,
  },
];

// Inline pricing engine (avoid pulling client code into a CLI script).
const CONDITION_COEFFICIENT = { brand_new: 0.5 } as const;
function roundToDot99(v: number): number {
  if (v < 1) return 0.99;
  const intPart = Math.floor(v);
  const candidate = intPart + 0.99;
  return candidate >= v ? candidate : candidate + 1;
}
function suggested(refPrice: number): number {
  return roundToDot99(refPrice * CONDITION_COEFFICIENT.brand_new);
}
function recommend(price: number): string {
  if (price < 5) return "bundle";
  if (price < 10) return "manual_review";
  return "sell_individually";
}

async function ensureUser(opts: {
  email: string;
  password: string;
  displayName: string;
  role: DemoRole;
}): Promise<string> {
  const auth = getAuth();
  const db = getFirestore();

  let uid: string;
  try {
    const existing = await auth.getUserByEmail(opts.email);
    uid = existing.uid;
    await auth.updateUser(uid, {
      password: opts.password,
      displayName: opts.displayName,
      disabled: false,
    });
  } catch (err) {
    if ((err as { code?: string }).code === "auth/user-not-found") {
      const created = await auth.createUser({
        email: opts.email,
        password: opts.password,
        displayName: opts.displayName,
        emailVerified: true,
      });
      uid = created.uid;
    } else {
      throw err;
    }
  }

  await db.collection("users").doc(uid).set(
    {
      email: opts.email,
      displayName: opts.displayName,
      role: opts.role,
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: null,
      lastLogin: null,
    },
    { merge: true }
  );

  return uid;
}

async function ensureDemoPallet(masterUid: string): Promise<string> {
  const db = getFirestore();
  const pallets = await db
    .collection("pallets")
    .where("manifestSku", "==", "RED19276")
    .limit(1)
    .get();

  const totalRef = DEMO_PRODUCTS.reduce((sum, p) => sum + p.refPrice * p.qty, 0);

  if (!pallets.empty) {
    const id = pallets.docs[0]!.id;
    await db.collection("pallets").doc(id).set(
      {
        totalProducts: DEMO_PRODUCTS.length,
        totalReferencePrice: totalRef,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return id;
  }

  const ref = await db.collection("pallets").add({
    manifestSku: "RED19276",
    name: "RED19276 — Demo manifest",
    source: "Jobalots",
    originalFileName: "MF-47-ndBAUze-demo.xlsx",
    totalProducts: DEMO_PRODUCTS.length,
    totalReferencePrice: totalRef,
    currency: "EUR",
    status: "imported",
    createdBy: masterUid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function ensureDemoProducts(palletId: string): Promise<void> {
  const db = getFirestore();
  for (const p of DEMO_PRODUCTS) {
    const existing = await db
      .collection("products")
      .where("palletId", "==", palletId)
      .where("asin", "==", p.asin)
      .limit(1)
      .get();
    if (!existing.empty) continue;

    const sp = suggested(p.refPrice);
    await db.collection("products").add({
      palletId,
      productSku: p.asin,
      manifestSku: "RED19276",
      title: p.title,
      description: "",
      asin: p.asin,
      ean: p.ean,
      barcode: p.ean,
      brand: p.brand,
      categoryName: p.category,
      subCategoryName: "",
      itemQty: p.qty,
      stockQty: p.qty,
      referencePrice: p.refPrice,
      referenceCurrency: "EUR",
      marketPrice: null,
      suggestedPrice: sp,
      finalPrice: sp,
      condition: "brand_new",
      importStatus: "imported",
      aiStatus: "not_started",
      approvalStatus: "draft",
      warehouseStatus: "not_checked",
      images: [],
      sourceUrls: [],
      confidenceScore: null,
      recommendedAction: recommend(sp),
      shopifyProductId: null,
      shopifyVariantId: null,
      shopifyStatus: "not_synced",
      publishedAt: null,
      syncError: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

async function main() {
  if (getApps().length === 0) {
    initializeApp({ projectId: process.env.GCLOUD_PROJECT });
  }
  console.log("Connecting to emulators:");
  console.log("  Auth      → " + process.env.FIREBASE_AUTH_EMULATOR_HOST);
  console.log("  Firestore → " + process.env.FIRESTORE_EMULATOR_HOST);
  console.log("");

  console.log("Creating demo users…");
  let masterUid = "";
  for (const u of DEMO_USERS) {
    const uid = await ensureUser({ ...u, password: DEMO_PASSWORD });
    if (u.role === "MASTER") masterUid = uid;
    console.log(`  ✓ ${u.email.padEnd(24)} role=${u.role.padEnd(9)} uid=${uid}`);
  }

  console.log("\nCreating demo pallet + products…");
  const palletId = await ensureDemoPallet(masterUid);
  await ensureDemoProducts(palletId);
  console.log(`  ✓ Pallet RED19276 = ${palletId} (${DEMO_PRODUCTS.length} products)`);

  console.log("\n✅ Done.\n");
  console.log("Login at http://localhost:3000/login with any of:");
  for (const u of DEMO_USERS) {
    console.log(`  ${u.email.padEnd(24)} / ${DEMO_PASSWORD}     (${u.role})`);
  }
  console.log("\nMaster-only hidden URL: http://localhost:3000/masteradmin");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err);
  console.error("\nIs the emulator running?  →  npm run emulators");
  process.exit(1);
});
