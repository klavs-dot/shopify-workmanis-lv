/*
 * Seed the first MASTER user.
 *
 * Usage:
 *   1. Fill .env.local with:
 *      FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/service-account.json
 *      MASTER_SEED_EMAIL=you@workmanis.lv
 *      MASTER_SEED_PASSWORD=<at-least-8-chars>
 *      MASTER_SEED_DISPLAY_NAME=Klavs
 *   2. npm run seed:master
 *
 * Safe to re-run: if a user with that email already exists in Firebase Auth,
 * it will only ensure the Firestore /users doc has role=MASTER.
 *
 * Project: shopify.workmanis.lv  (SEPARATE Firebase project from Workmanis.lv)
 */

import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import {
  initializeApp,
  cert,
  getApps,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const envFile = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) dotenv.config({ path: envFile });
else dotenv.config();

function must(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const saPath = must("FIREBASE_SERVICE_ACCOUNT_PATH");
  const email = must("MASTER_SEED_EMAIL");
  const password = must("MASTER_SEED_PASSWORD");
  const displayName = process.env.MASTER_SEED_DISPLAY_NAME || email;

  const resolved = path.resolve(saPath);
  if (!fs.existsSync(resolved)) {
    console.error(`Service-account file not found: ${resolved}`);
    process.exit(1);
  }
  const sa = JSON.parse(fs.readFileSync(resolved, "utf8")) as ServiceAccount;

  if (getApps().length === 0) {
    initializeApp({ credential: cert(sa) });
  }
  const auth = getAuth();
  const db = getFirestore();

  console.log(`Seeding MASTER for ${email} ...`);

  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`User already exists in Firebase Auth: ${uid}`);
    // Best-effort password sync (in case caller forgot it).
    await auth.updateUser(uid, { password, displayName, disabled: false });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "auth/user-not-found") {
      const created = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });
      uid = created.uid;
      console.log(`Created Firebase Auth user: ${uid}`);
    } else {
      throw err;
    }
  }

  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  if (snap.exists) {
    await userRef.update({
      role: "MASTER",
      status: "active",
      displayName,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log("Updated /users doc — role=MASTER, status=active.");
  } else {
    await userRef.set({
      email,
      displayName,
      role: "MASTER",
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: null,
      lastLogin: null,
    });
    console.log("Created /users doc — role=MASTER.");
  }

  await db.collection("auditLogs").add({
    userId: uid,
    userEmail: email,
    action: "user_created",
    entityType: "user",
    entityId: uid,
    before: null,
    after: { role: "MASTER", via: "seed-master" },
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log("\n✅ Done. Login at /login with:");
  console.log(`   Email: ${email}`);
  console.log("   Password: (the one you set in MASTER_SEED_PASSWORD)\n");
  console.log("Then open /masteradmin (URL is hidden — there is no link in the sidebar for non-MASTER users).");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
