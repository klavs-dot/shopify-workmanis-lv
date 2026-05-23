# 09 — Development Log

> Hronoloģisks ieraksts par lielajām izmaiņām. Updateo pēc katra loģiska posma.

## 2026-05-23 — MVP bāze izveidota

**Veikts:**

- Inicializēts Next.js 15 projekts ar TypeScript, Tailwind v4, App Router (manuāli, ne caur `create-next-app`, lai izvairītos no .claude konflikta).
- Instalēti dependencies: `firebase`, `firebase-admin`, `xlsx`, `lucide-react`, `dotenv`, `tsx`.
- Izveidoti core lib failos:
  - `src/lib/types.ts` — visi domain tipi (UserRole, Pallet, Product, AuditLog, …)
  - `src/lib/firebase.ts` — Firebase client SDK ar graceful “not configured” režīmu
  - `src/lib/firebase-admin.ts` — Firebase Admin SDK (server-only)
  - `src/lib/auth/AuthProvider.tsx` + `RequireRole.tsx`
  - `src/lib/auth/roles.ts` — atļaujas un labels
  - `src/lib/pricing.ts` — pricing engine ar `.99` noapaļošanu un recommendedAction
  - `src/lib/manifest.ts` — xlsx parser ar column aliasiem
  - `src/lib/firestore/{users,pallets,products,audit}.ts` — CRUD wrapperi
- Lapas:
  - `/login`, `/dashboard`
  - `/masteradmin` (slēpts), `/masteradmin/users`, `/masteradmin/users/new`, `/masteradmin/audit`, `/masteradmin/settings`
  - `/import`, `/pallets`, `/pallets/[id]`, `/products`, `/products/[id]`, `/approval`
- API:
  - `POST /api/admin/users` — MASTER izveido user (verificē Bearer token + role)
  - `PATCH /api/admin/users` — maina role / status / displayName
- Komponentes:
  - `AppShell` ar sidebar, mobile top nav, role badge, slēptu MasterAdmin pogu MASTER lomai
  - `StatusBadge` — visas statusa krāsas
- Drošība:
  - `firestore.rules` ar lomu loģiku
  - `storage.rules` produktu bildēm
  - `firestore.indexes.json` ar trīs kompozīt-indeksiem
  - `firebase.json` ar emulator portiem
- Seed skripts: `scripts/seed-master.ts` (`npm run seed:master`)
- README.md ar pilnu setup
- Obsidian dokumentācija `docs/obsidian/` (00–10)
- TypeScript strict check tīrs (`npm run typecheck`)
- Production build sekmīgs — 16 maršruti (`npm run build`)

**Veikts (otrais piegājiens — git + cloud):**

- Git init uz `main` zarā, 7 loģiski commits, push uz GitHub
- Publisks GitHub repo: https://github.com/klavs-dot/shopify-workmanis-lv
- Vercel projekta `shopify-workmanis-lv` izveide (atsevišķi no eksistējošā `workmanis` projekta!)
- Vercel auto-savienojums ar GitHub repo (push uz `main` triggerēs deploy)
- Bump Next.js → 15.5.18 (15.1.3 noraidīts kā vulnerable)
- Pirmais production deploy READY: https://shopify-workmanis-lv.vercel.app
- HTTP 200 verificēts uz `/login` (rāda "Firebase not configured" baneri, kā gaidīts)

**Atliek (skat [[10_TODO]]):**

- Reāla Firebase projekta izveide un `.env.local` + Vercel ENV aizpilde
- Production-safe service-account ielāde Vercelā (`FIREBASE_SERVICE_ACCOUNT_JSON`)
- `shopify.workmanis.lv` domēna pievienošana Vercelā
- Pilna AI un Shopify integrācija
- Image upload UI (Storage rules jau sagatavoti)
- Unit testi pricing engine un manifest parserim
