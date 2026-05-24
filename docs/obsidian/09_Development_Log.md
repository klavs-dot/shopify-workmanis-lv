# 09 — Development Log

> Hronoloģisks ieraksts par lielajām izmaiņām. Updateo pēc katra loģiska posma.

## 2026-05-24 — Branding: WORKMANIS wordmark + animēts robots

**Veikts:**

- Jauns komponents `src/components/RobotLogo.tsx` — pure inline SVG ar 4 CSS animāciju slāņiem:
  - Korpuss šūpojas (3s)
  - Antenas LED pulsē + glow halo (1.5s)
  - Acis mirkšķina (5s)
  - Rakstīšanas roka skribelē virs manifesta (1.4s)
  - `prefers-reduced-motion` respektēts
- Krāsu shēma: violet-500/600/700 gradients + amber LED + cream papīrs (atšķiras no Workmanis.lv zilā robota)
- Robots ievietots: sidebar header (h-28), mobile top nav (h-12), login karte (h-48)
- Wordmark mainīts uz **WORKMANIS** (extrabold, tight tracking) + subtitle **Shopify Pallet Operations**
- Browser tab title: "WORKMANIS — Shopify Pallet Operations"
- Datu modelis un repo struktūra nemainās; tikai brand veidols.

Commits: `5c4f0ea` (robots), `196d301` (2× lielāks), `736f407` (WORKMANIS wordmark).

## 2026-05-24 — Posms 5: AI bagātinājums ar Claude Sonnet 4.6

**Veikts:**

- `@anthropic-ai/sdk` instalēts (dev + runtime).
- `src/lib/ai/enrich.ts` — Claude Sonnet 4.6 cauruļvads:
  - `web_search_20260209` + `web_fetch_20260209` server-side tools (dynamic filtering)
  - System prompt ~1500 tokens, wrapped in `cache_control: ephemeral`
  - `output_config.format` JSON schema (8 lauki — enrichedTitle, descriptionLv/En, suggestedCategory, enrichedImages, sourceUrls, confidenceScore, notes)
  - `pause_turn` resume loop (max 4 iterations)
  - Defensive parse + post-validation
- `POST /api/ai/enrich-product { productId }` — auth check (MASTER/ADMIN), Firebase Admin Firestore read, runs enrichProduct, writes back enriched fields, audit log on start/complete/error. `maxDuration: 300`.
- `POST /api/ai/enrich-pallet { palletId, rerun?, limit? }` — bulk version, sequential per produkts, max 200 per call. `maxDuration: 800`.
- `ProductActionsPanel` paplašināts ar AI sekciju — status pille, "Sākt AI bagātinājumu" poga (violet-600), preview ar enrichedTitle + descriptionLv/En + enrichedImages + sourceUrls + confidence%.
- Šķirošanas header → 2 jaunas pogas: "✨ Bagātināt nebagātinātos" + "Pārbagātināt visus".
- `.env.example` papildināts ar `ANTHROPIC_API_KEY`.
- `firebase-admin.ts` jau atbalsta gan `FIREBASE_SERVICE_ACCOUNT_PATH` (lokāli), gan `FIREBASE_SERVICE_ACCOUNT_JSON` (Vercel).
- Smoke test pret reālu Claude API (`scripts/test-ai-enrich.ts`) ar FENCHILIN spoguli: 184s, confidence 0.87, 5 Amazon/manufacturer bildes atrastas, fluent LV apraksts ar diakritikām.
- Caching jau pirmajā reizē — 457k cache read tokens reused.
- Vidējās izmaksas pirmajos testos: ~$0.40 per produkts (heavy web search workload).

Commit: `ebca0f3`, `f3600b7` (dotenv `override: true` shell-env-shadow fix).

## 2026-05-23 — Posms 3+4: Per-product action panel + realised P&L

**Veikts:**

- `src/components/ProductActionsPanel.tsx` — viens reusable panelis ar visu, kas vajadzīgs vienam produktam:
  - **Cena + atlaide** — slider 0-99%, quick chips (-50%, -75%, -90%), live discount preview ar `referencePrice × (1 − d/100)` ar `.99` noapaļošanu.
  - **Customer note** — textarea, live sarkanais baneris preview ("Piezīme!! …"), kas vēlāk parādīsies veikalā.
  - **Apstiprināt ievietošanu** — saglabā listingStatus + approvalStatus + discount + note + finalPrice.
  - **Marķēt veikalā** — listingStatus = listed_in_store.
  - **Marķēt pārdotu** — sold price input, saglabā soldPrice + soldAt (serverTimestamp).
  - **Utilizēt** — reason textarea, listingStatus = disposed; ieraksts parādās `/utilizetas`.
- Visi action-i logā audit log ar before/after snapshot.
- `/skirosana/[id]` rindas tagad click-to-expand (▶ / ▼) → panelis inline. Refresh re-fetcho produktus pēc katras darbības.
- "Piezīme" pille rindas līnijā, kad customerNote ir setots; "(−N%)" pie listing status.
- Manifesti kartītes → realised P&L pille (`soldRevenue − purchasePrice`) zaļš/sarkans ar recovery% tooltip.

Commit: `92b0bc5`.

## 2026-05-23 — Posms 2: Jobalots publiska URL fetcher

**Veikts:**

- `src/lib/jobalots.ts` — parser publiskajai auction lapai. Jobalots ir Next.js app ar TanStack-Query dehydrated state iekš `self.__next_f.push([..., "..."])` chunks. Recombine + locate `"result":{...}` JSON object ar brace-balancing, izvelk: title, RRP, current bid (= purchasePrice), reserve, location, weight, condition (no nested `manifest.manifest_condition[].manifest_condition_type.translations[]`), cover image, vendor, winner. **Bez CSS-selektoru fragility.**
- `cheerio` instalēts (lai gan pamatā lietojam JSON parsi, ne HTML traversi).
- `GET /api/jobalots/lookup?url=...` — Node runtime, no-cache, strip-rawed JSON response.
- `/manifesti` lapā: debounced auto-lookup, kad lietotājs ielīmē Jobalots URL. Emerald preview kartiņa ar cover image, latest bid, RRP, reserve, location, weight, condition, "Win" pille. Auto-fill purchase price + pallet name.
- `/skirosana/[id]` header — "↻ Sync no Jobalots" poga (managePallets permission), re-fetcho metadata + audit log entry.
- Test script `scripts/test-jobalots.ts` — pieņem live URL vai `FROM_FILE=` lokālā HTML.

Commit: `8126dae`.

## 2026-05-23 — Posms 1: Rename + jaunais Excel parser + restruktūra

**Veikts:**

Pārdēvējumi:
- `/import` → `/manifesti` (Manifesti — upload + cards landing)
- `/pallets` → `/skirosana` (Šķirošana — nesašķiroti-pirmie cards)

Jaunais maršruts `/utilizetas` (Utilizētās preces — disposed produkti).

Sidebar: Manifesti, Šķirošana, Produkti, Approval, Utilizētās preces.

Excel parser atbalsta bagātāku Jobalots schemu:
- `Image 1..Image 6` → `ParsedManifestRow.manifestImages[]`
- `Condition` → mapets caur `normalizeCondition()` uz `ProductCondition`
- `Grade` — preserved as string
- `Unit Weight (kg)`
- `Unit RRP` + `Total RRP` (alias for old "Reference Price")
- `Quantity` (alias for old "Item Qty")

Pallet schema gains: `jobalotsUrl`, `purchasePrice`, `reservePrice`, `location`, `weightKg`, `palletCondition`.

Product schema gains: `weightKg`, `grade`, `listingDiscountPercent` (default 50), `customerNote`, `listingStatus` (`not_listed` | `listing_approved` | `listed_in_store` | `sold` | `out_of_stock` | `disposed`), `disposalReason`, `manifestImages[]`, `enrichedImages[]`, `enrichedTitle`, `descriptionLv`, `descriptionEn`, `soldPrice`, `soldAt`.

`/manifesti` landing rāda manifest kartes ar: iegādes summa, total RRP, predicted profit (50%), sold count + revenue, un 4 filter pille (Veikalā / Nav veikalā / Pārdotās / Utilizētās) ar deep-link uz `/skirosana/[id]?listing=…`.

`/skirosana/[id]` ir listing-status cilnes ar live counts + search filtri; thumbnails rāda pirmo manifest bildi katrā rindā.

`scripts/test-parser.ts` — CLI smoke-test apstiprina abas vecās (RED19276) un jaunās (YELLOW30026) Jobalots manifest formas.

Commit: `fd3655b`.

## 2026-05-23 — MVP bāze + reālais Firebase + Vercel deploy

**Veikts:**

- Inicializēts Next.js 15 projekts ar TypeScript, Tailwind v4, App Router.
- Instalēti dependencies: `firebase`, `firebase-admin`, `xlsx`, `lucide-react`, `dotenv`, `tsx`, `firebase-tools`.
- Core lib failos: `types.ts`, `firebase.ts`, `firebase-admin.ts`, `auth/AuthProvider.tsx`, `auth/RequireRole.tsx`, `auth/roles.ts`, `pricing.ts`, `manifest.ts`, `firestore/{users,pallets,products,audit}.ts`.
- Lapas: `/login`, `/dashboard`, `/masteradmin` (slēpts), `/masteradmin/users`, `/masteradmin/users/new`, `/masteradmin/audit`, `/masteradmin/settings`, `/import` (vēlāk `/manifesti`), `/pallets` (vēlāk `/skirosana`), `/products`, `/products/[id]`, `/approval`.
- API: `POST/PATCH /api/admin/users` ar Bearer token + role check.
- Komponentes: `AppShell` ar sidebar + role badge + slēpts MasterAdmin link, `StatusBadge`.
- Drošība: `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json`.
- Seed skripts: `scripts/seed-master.ts`.
- Obsidian dokumentācija (00–11).
- Firebase emulatori — `scripts/seed-emulator.ts` + Java 21 setup; 4 demo lietotāji.
- Reālais Firebase projekts `shopify-workmanis` izveidots, Email/Password auth + Firestore + Storage iespējoti, rules + indexes deploy-oti.
- Vercel projekts `shopify-workmanis-lv` izveidots, ENV iestatīta production (NEXT_PUBLIC_FIREBASE_*, FIREBASE_SERVICE_ACCOUNT_JSON), production deploy READY.
- Pirmais MASTER lietotājs seedēts caur `npm run seed:master`.
- Authorized domain `shopify-workmanis-lv.vercel.app` pievienots Firebase Auth settings.
- GitHub repo `klavs-dot/shopify-workmanis-lv` (publisks), `main` zars sasniegts.

Commits šai stadijai: `b6758d9` … `8894bf3`.
