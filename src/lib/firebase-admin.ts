// Server-side Firebase Admin SDK initialization.
// Used by:
//   - scripts/seed-master.ts (CLI, for first MASTER user)
//   - src/app/api/admin/users/route.ts (web UI user creation by MASTER)
//
// Credential source priority:
//   1. FIREBASE_SERVICE_ACCOUNT_JSON — entire service-account JSON as one env
//      string. Use this on Vercel / any read-only-FS host.
//   2. FIREBASE_SERVICE_ACCOUNT_PATH — absolute path to a JSON file on disk.
//      Use this for local development.
//
// Never commit either value. Both keep the project SEPARATE from
// Workmanis.lv (different Firebase project, different SA).

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
  // 1. JSON-in-env (Vercel-friendly)
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inline && inline.trim().length > 0) {
    try {
      // Some hosts mangle newlines in JSON values. The private_key field is
      // newline-sensitive — be tolerant of escaped \n by unescaping after parse.
      const parsed = JSON.parse(inline) as Record<string, unknown> & {
        private_key?: string;
      };
      if (typeof parsed.private_key === "string") {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed as unknown as ServiceAccount;
    } catch (err) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON nav derīgs JSON: " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  }

  // 2. File path (local dev)
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!envPath) {
    throw new Error(
      "Trūkst Firebase service-account konfigurācijas. Iestati " +
        "FIREBASE_SERVICE_ACCOUNT_JSON (Vercel) vai FIREBASE_SERVICE_ACCOUNT_PATH (local)."
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
