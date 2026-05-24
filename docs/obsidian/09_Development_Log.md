# 09 — Development Log

> Hronoloģisks ieraksts par lielajām izmaiņām. Updateo pēc katra loģiska posma.

## 2026-05-24 — Robot logo bagātāka animācija (4 → 15+ slāņi)

**Veikts:** RobotLogo SVG pārtaisīts ar 15+ neatkarīgiem motion layeriem (coprime ciklu garumi: 1.3 / 1.7 / 2.1 / 3.7 / 4.3 / 4.5 / 5.2 / 5.9 / 7.3 / 8.1 / 9.7 / 11.3 / 13.1 / 17.9 / 19 s). Jo cikli nesinhronizējas, kustība praktiski nekad neatkārtojas — lietotājs vienmēr redz svaigu kombināciju.

Jauni slāņi (papildus iepriekšējiem 4):
- Korpuss arī side sway (±1.5°)
- Liels lēciens reizi 18 sekundēs ("yay")
- Antena pati sway (atsevišķi no LED pulse)
- Acu zīlītes "look" left/right ar dažādiem cikliem (asimetriska)
- Wink (tikai kreisā acs, rets — 19s)
- Mute reizēm uzsmaida
- Pen tap pauze, kas pārtrauc scribble
- Klipboards viegli sasveras
- ✨ Sparkle pie pildspalvas gala
- Labā kāja reizēm tap

Skat [[12_Branding]] pilno animāciju tabulu.

## 2026-05-24 — Sadaļas "Approval" noņemšana

**Veikts:**

- `/approval` lapa pilnībā izdzēsta — `src/app/approval/page.tsx` removed.
- Sidebar links un `CheckSquare` ikona noņemti no AppShell.
- `ROLE_ROUTES` regex `/^\/approval/` noņemts visām lomām.
- `approveProducts` PERMISSION un Product `approvalStatus` lauks **paliek** — per-produkta "Apstiprināt ievietošanu" poga ProductActionsPanel-ā joprojām strādā Šķirošanā un raksta `approvalStatus = "approved"`. Tikai centralizētais "approval queue" view ir izņemts.
- Docs: 01_Tech_Stack un 03_Authentication_And_Roles ceļu tabulas atjauninātas.

## 2026-05-24 — Produkti veikalā: 3 kategoriju kartītes + bulk darbības

**Veikts:** skat [[14_Products_In_Store]] pilnu aprakstu.

- `/products` sidebar label pārsaukts uz **"Produkti veikalā"**.
- `Product` paplašināts ar 2 jauniem laukiem: `listedAt` un `outletSaleAt`.
- `ProductActionsPanel.markListed()` automātiski uzliek `listedAt = serverTimestamp()`.
- `/products` lapa pilnībā pārrakstīta:
  - **Landing**: 3 kvadrātkartes (aspect-square) ar krāsotām pāreajām un unikāliem animētiem robotiem
    - Selling — emerald, robot ar pirkumu somu un sparkles, vicina rokā
    - Stale week — amber, robot ar pulksteni un sviedru pilienu, kāja tap
    - Stale 2 weeks — red, robot satraukumā ar plati atvērtām X-acīm, lieli ! virs galvas, šūpojas
  - Bucket math client-side no `listedAt ?? createdAt`: <7d / 7-14d / 15d+
  - Bucket detail view (klikšķis kartītē → `?bucket=…`): saraksts ar bulk darbībām (atlaide, vienota cena, pārvietot uz Izpārdošanu)
  - Bulk pielietojams visam bucket vai izvēlētajiem (checkbox)
  - 3 jauni audit actions: `product_bulk_discount_applied`, `product_bulk_price_set`, `product_moved_to_outlet_sale`
- Jauns komponents `src/components/RobotMascots.tsx` — 3 atsevišķi 80×80 SVG robot mascots ar CSS keyframes
- 3 jauni `AuditAction` enum vērtības (skat. 02_Database_Structure)
- Eksistējošajiem produktiem ar `listed_in_store` bet bez `listedAt` — bucket math izmanto `createdAt` kā fallback, datu migrācija nav nepieciešama

## 2026-05-24 — Cover images uz Šķirošanas / Loģistikas / Manifestu kartītēm

**Veikts:**

- `Pallet` paplašināts ar `coverImage: string | null` lauku.
- `createPallet()` izvēlas avotu šādā kārtībā: (1) Jobalots auction cover (no `lookup.coverImage`), (2) pirmā produkta `manifestImages[0]` no Excel, (3) `null` (parāda gradient placeholder).
- `updatePallet()` un Sync no Jobalots arī atjauno `coverImage`.
- `/skirosana` kartītes pārtaisītas — cover image augšā (16:10 aspect ratio), statusa badge + Jobalots link uzklāts kā chip uz attēla. Grid mainīts uz `xl:grid-cols-3` lai dod vairāk vietas attēlam.
- `/logistika` kartēs — 80×80 sīka thumb attēls pa kreisi no info.
- `/manifesti` landing kartēs — tāda pati 16:10 cover augšā kā Šķirošanā.
- Fallback bez attēla: gradient `from-slate-100 to-slate-200` + manifest SKU font-mono tekstā.
- `scripts/backfill-cover-images.ts` — vienreizīgs skripts existing paletei: iterē pa visām paletēm ar `jobalotsUrl` bet bez `coverImage`, re-fetchu Jobalots un saglabā. Palaists ar `WRITE=1 npx tsx scripts/backfill-cover-images.ts`.
- Palaists tikko — 1 esošā palete (YELLOW30026) saņēma savu cover.

## 2026-05-24 — Sorting claims + pulsējoša "vēl nav pabeigts" indikācija

**Veikts:** skat [[13_Sorting_Claims]] pilnu aprakstu.

- `Pallet` paplašināts ar 4 jauniem laukiem: `sortingClaimedBy`, `sortingClaimedByEmail`, `sortingClaimedByName`, `sortingClaimedAt`
- Helper-i `claimPalletForSorting()` un `releasePalletSortingClaim()` Firestore lib-ā
- Jauni audit actions: `pallet_sorting_claimed`, `pallet_sorting_released`
- `/skirosana` kartītes pārtaisītas:
  - **"🙋 Paņemt uz šķirošanu"** poga (violet-600) — pieejama, ja nav claim
  - Pēc claim: zaļa "Šķiro: Tu" (claimerim) vai zila "Šķiro: [vārds]" (citiem)
  - **Pulsē sarkana** (`pulse-red-ring` CSS keyframe) kad `unsortedCount > 0`
  - Klikšķis kartītē → atver detalizēti, BET tikai claimerim vai MASTER. Citiem rāda 🔒 "Atvērt var tikai atbildīgais"
  - "Atlaist" poga claimerim; MASTER var atlaist citu claim (override)
- `/skirosana/[id]` detalizētā lapā jauns guard — direct URL hits no non-claimera rāda amber "Šo manifestu šķiro [vārds]" panelis ar saiti atpakaļ
- CSS: `.pulse-red-ring` keyframe ar 2s ciklu, ease-in-out, motion-safe
- Avatāra circle ar lietotāja iniciāļiem violet-600 fonā

## 2026-05-24 — Loģistikas posms starp Manifesti un Šķirošanu

**Veikts:**

- Jauns `PalletStatus` enum vērtība: `in_transit` (pirms `imported`).
- `createPallet()` default mainīts no `imported` → `in_transit`. Visas jaunās paletes sāk Loģistikā.
- Jauns helper `markPalletReceived(palletId)` → status `imported` + audit `pallet_received`.
- Jauns sidebar links **Loģistika** ar truck ikonu, novietots starp Manifesti un Šķirošanu.
- `/logistika` lapa rāda tikai `status === "in_transit"` paletes ar amber karti, "🚚 Ceļā, gaidām piegādi!" badge un zaļo pogu **"✓ Saņemts! Nosūtīt uz Šķirošanu!"** (atļauts MASTER/ADMIN/WAREHOUSE — jauns permission `receivePallets`).
- `/skirosana` filtrē ārā `in_transit` paletes (rāda tikai pēc saņemšanas).
- `/manifesti` import-success kartiņa parāda amber baneri ar saiti uz Loģistiku + 2 pogas: zaļā "Skatīt Loģistikā →" un sekundārā "Atvērt detalizēti (pirms saņemšanas)".
- Manifesti landing cards `in_transit` paletēm — amber border + "🚚 Ceļā" badge + click ved uz Loģistiku, ne Šķirošanu.
- StatusBadge papildināts ar `in_transit` (amber) un atjaunots `imported` label = "Saņemts noliktavā".

**Esošās paletes (importētas pirms šī commit) paliek ar `imported` statusu — nav vajadzīga datu migrācija**, jo tās jau tika apstrādātas.

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
