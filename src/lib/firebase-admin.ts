// Server-side Firebase Admin SDK initialization.
// Used by:
//   - scripts/seed-master.ts (CLI, for first MASTER user)
//   - src/app/api/admin/users/route.ts (web UI user creation by MASTER)
//
// Requires FIREBASE_SERVICE_ACCOUNT_PATH in .env.local pointing at the
// downloaded service-account JSON file. Do NOT commit that JSON.

import fs from "node:fs";
import path from "node:path";

import {
  initializeApp,
  cert,
  getApps,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let cached: { app: App; auth: Auth; db: Firestore } | null = null;

function loadServiceAccount(): ServiceAccount {
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!envPath) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_PATH nav iestatīts. Pievieno .env.local ceļu uz Firebase service-account JSON."
    );
  }
  const resolved = path.resolve(envPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Service-account fails nav atrasts: ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, "utf8");
  return JSON.parse(raw) as ServiceAccount;
}

export function getFirebaseAdmin() {
  if (cached) return cached;
  const existing = getApps();
  const app =
    existing.length > 0
      ? existing[0]!
      : initializeApp({ credential: cert(loadServiceAccount()) });
  cached = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
  return cached;
}
