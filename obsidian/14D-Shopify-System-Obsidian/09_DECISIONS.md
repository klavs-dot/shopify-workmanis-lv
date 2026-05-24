# 09 — Lēmumi (Decisions)

> Arhitektūras un procesa lēmumi ar kontekstu, lai vēlāk varētu saprast "kāpēc tas tā ir".

## 2026-05-24 — 14d.lv būvēsies kā `apps/store`

**Lēmums:** Veidot 14d.lv kā jaunu Next.js aplikāciju `apps/store/` mapē, nevis kā jaunu repo vai jaunu sadaļu admin sistēmā.

**Konteksts:**
- Admin sistēma `shopify.workmanis.lv` jau dzīvo production ar reāliem darbiniekiem un datiem.
- 14d.lv ir pilnīgi atšķirīga lietotāju grupa (publiski apmeklētāji), datu modelis (tikai publiski produkti no Shopify), drošības profils.
- Atsevišķs Vercel projekts dod neatkarīgu deployment + monitoring.

**Alternatīvas:**
- (A) Atsevišķs Git repo — lielāka koplietošanas problēma, divreiz lielāka uzturēšana.
- (B) Sadaļa admin sistēmā — sajauks publiskas un iekšējās UI, droseles risks (admin auth atver publisku lapu).
- (C) **Izvēlēts:** Monorepo ar `apps/admin/` + `apps/store/`. Kopīgi types/utils var izstumt uz `packages/shared/` vēlāk.

**Sekas:**
- Divi `package.json`, divi node_modules, divi build pipeline.
- Vienkāršāk migrēt uz Turborepo nākotnē, ja vajadzēs.
- Admin un store var deploy neatkarīgi (atsevišķi Vercel projekti).

## 2026-05-24 — Admin paliek repo saknē (pagaidām)

**Lēmums:** Admin sistēma NETIEK pārvietota uz `apps/admin/` šajā commitā. Tā paliek repo saknē (`src/`, `app/`, `package.json`).

**Kāpēc:**
- Vercel projekts `shopify-workmanis-lv` šobrīd ir konfigurēts uz repo root direktoriju.
- Admin sistēma ir LIVE production ar reāliem datiem un lietotājiem.
- Pārvietošana prasa koordinētu Vercel project settings maiņu (root directory + ENV vars + domain), kas nedrīkst notikt vienkārši ar git push.

**Plāns:** Pēc tam, kad apps/store ir stabils un ir savs Vercel projekts ar 14d.lv:
1. Izveidot `apps/admin/` mapi un pārvietot src/, app/, scripts/, package.json
2. Atjaunot Vercel project root directory → `apps/admin/`
3. Atjaunot `firebase.json` / `firestore.rules` ceļus, ja vajag
4. Sinhronizēts git push + Vercel redeploy
5. Atjaunot dokumentāciju

**Riski, ja netiek migrēts:**
- Kopēja root `node_modules/`, kas satur gan admin, gan store dependencies — bloat
- Vizuālā konfūzija (root tsconfig.json ir admin; apps/store/ ir savs)

Bet tie ir kosmētiski jautājumi, kas tiek atrisināti migrācijas brīdī.

## 2026-05-24 — Apps/store sākotnēji ar mock data

**Lēmums:** Sākam ar mock datiem `apps/store/lib/mock-products.ts`, nevis uzreiz integrēt Shopify Storefront API.

**Kāpēc:**
- Shopify konts un Storefront access token vēl nav izveidots.
- UI izstrāde nedrīkst gaidīt uz infrastruktūru — labāk lai dizainers var redzēt katalogu uzreiz.
- `lib/shopify.ts` ir API skelets ar pareizām funkciju signatures, kas tikai gaida implementāciju. UI lapas izsauc `fetchProducts()`, kas tagad mock-fallback.

**Risks:** Mock dati var atšķirties no reālā Shopify struktūras.
**Mitigācija:** Mock dati strikti atbilst `Product` tipa shape, kas ir balstīts uz Shopify Storefront API. Pārejas brīdī tikai `fetchProducts()` iekšiene mainās, lapas paliek nemainīgas.

## 2026-05-24 — Krāsa: oranža akcentam, melna/balta bāze

**Lēmums:** Bāzes paleta — neitrāla balta/melna/pelēka. Akcents — oranža (`#ea580c`).

**Kāpēc:**
- Lietotājs lūdza modernu, profesionālu, izteiktu outlet vibe — nevis lēta tirgus dizainu.
- Oranža ir punchy, asociējās ar "deals", bet nav neon. Lieto badge-os, accent pogās.
- Neitrāla bāze padara produktus uzmanības centrā, nevis dizainu.
- Atsevišķi no admin sistēmas (kas lieto violet/slate) — vizuāli skaidri nodalīts.

CSS mainīgais `--color-accent` ļauj viegli mainīt akcentu vēlāk.

## 2026-05-24 — Latviski sākotnēji, daudzvalodība vēlāk

**Lēmums:** UI tikai latviski. Produktu lauki ir struktūra ar LV/EN/RU, bet sākumlapu/menu/footer nemēģinām šobrīd lokalizēt.

**Kāpēc:**
- Sākotnējais tirgus ir Latvija.
- Lokalizācijas infrastruktūra (i18n routing, locale files) ir liels darbs, kas ne vienmēr ir vajadzīgs MVP.
- Produktu sadaļās Shopify pati nodrošina multi-locale tulkojumus.

**Plāns:** Kad būs vajadzība, ieviešam Next.js `app/[lang]/` segmentu vai `next-intl` paku.

## Saistītās piezīmes

- [[00_PROJECT_OVERVIEW]]
- [[02_DOMAINS]]
- [[10_NEXT_STEPS]]
