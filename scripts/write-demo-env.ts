/*
 * Write a .env.local with emulator-friendly placeholders so the Firebase
 * client SDK initializes successfully and connects to local emulators.
 *
 * Does not overwrite an existing .env.local — exits with a hint instead.
 *
 *   npm run demo:env
 */

import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) {
  console.log(`.env.local already exists at ${envPath}`);
  console.log("Refusing to overwrite. Delete it first if you want demo defaults.");
  process.exit(0);
}

const body = `# Demo / emulator defaults — do NOT use in production.
# Project: shopify.workmanis.lv  (SEPARATE from Workmanis.lv)

# Any non-empty values work for emulators; the SDK uses these only to
# build internal request URLs before delegating to the emulator host.
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=shopify-workmanis-demo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=shopify-workmanis-demo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=shopify-workmanis-demo.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:demo

# THIS is what actually wires the SDK to localhost emulators.
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=1
`;

fs.writeFileSync(envPath, body, "utf8");
console.log(`✓ Wrote ${envPath}`);
console.log("\nNext steps:");
console.log("  1. npm run emulators        # in one terminal");
console.log("  2. npm run seed:emulator    # in another terminal (after emulators start)");
console.log("  3. npm run dev              # in a third terminal");
console.log("  4. open http://localhost:3000/login");
console.log("");
console.log("Demo accounts (password Demo1234! for all):");
console.log("  master@demo.local     — MASTER (sees /masteradmin)");
console.log("  admin@demo.local      — ADMIN  (import, approve)");
console.log("  warehouse@demo.local  — WAREHOUSE");
console.log("  viewer@demo.local     — VIEWER (read-only)");
