# 00 — Project Overview

> 14D Shopify System ir kopējs projekts ar **divām atsevišķām aplikācijām**, kas dzīvo vienā repo, bet ir stingri nodalītas.

## Divas aplikācijas

```
shopify.workmanis.lv/                    <-- repo nosaukums
│
├── apps/
│   ├── admin/   (vēlāk — sk. zemāk)     <-- shopify.workmanis.lv
│   └── store/   ✅ aktīva                <-- 14d.lv
│
├── (admin sistēma šobrīd dzīvo repo saknē, sk. "Migrācija")
│
├── docs/
│   └── obsidian/                         <-- admin sistēmas vault
└── obsidian/
    └── 14D-Shopify-System-Obsidian/      <-- ŠIS vault (visa 14D sistēma)
```

| | **Admin** | **Store** |
|---|---|---|
| Domēns | shopify.workmanis.lv | 14d.lv |
| Mape | repo root (TODO: migrēt → apps/admin/) | apps/store/ |
| Mērķis | Darbinieku/admin sistēma | Publiskais klientu e-veikals |
| Lietotāji | MASTER, ADMIN, WAREHOUSE, VIEWER | Anonīmi apmeklētāji + reģistrēti pircēji |
| Backend | Firestore + Anthropic API + Shopify Admin API | Shopify Storefront API |
| Status | LIVE production | Skeleton (2026-05-24) |

## Ko katra aplikācija dara

### apps/admin (shopify.workmanis.lv) — iekšējā sistēma

- Darbinieku login (Firebase Auth)
- Master admin
- Lietotāju lomas
- Manifestu imports (Excel + Jobalots URL)
- Amazon palešu produktu apstrāde
- AI produktu ģenerēšana (Claude Opus 4.7, LV/EN/RU)
- Produktu review
- Cenu ievade
- Bilžu pievienošana
- Noliktavas atrašanās vietas
- Shopify sinhronizācija (push)
- Aktivitāšu logs
- Admin settings (AI budžets, Shopify connection)

**Nav** publiskais veikals. Neviens klients to neredz.

### apps/store (14d.lv) — publiskais veikals

- Sākumlapa ar Hero, kategorijām, featured produktiem
- Produktu katalogs ar filtriem, meklēšanu, sortēšanu
- Produkta detaļu lapa ar galeriju
- Kategoriju saraksts un kategorijas lapa
- Grozs un Shopify checkout (placeholder, līdz integrācijai)
- Statiskas lapas: Par mums, Piegāde, Kontakti, Noteikumi, Privātums, Atgriešana
- SEO meta + OpenGraph
- Mobile-first, ātrs, profesionāls

**Nav** admin sadaļa. Šeit nedrīkst būt manifestu imports, AI draft dati, iekšējās cenas vai darbinieku paneļi.

## Datu plūsma starp aplikācijām

```
Manifests Excel/Jobalots
        │
        ▼
   apps/admin importē  ──▶  AI bagātina (Opus 4.7)
                                    │
                                    ▼
                          Darbinieks pārskata + apstiprina
                                    │
                                    ▼
                          Push uz Shopify (Admin API)
                                    │
                                    ▼
                          Shopify produkts (publicēts)
                                    │
                                    ▼
                          apps/store lasa caur Storefront API
                                    │
                                    ▼
                          Klients pērk 14d.lv
                                    │
                                    ▼
                          Shopify webhook → apps/admin
                          (atzīmē produktu kā pārdotu)
```

## Tehnoloģiju stack

Abām aplikācijām kopīgs:
- Next.js 15 App Router
- TypeScript strict
- Tailwind v4
- React 19
- Vercel deployment
- GitHub publisks repo

Admin papildus:
- Firebase Auth + Firestore + Storage
- Anthropic SDK (Claude Opus 4.7)
- xlsx, cheerio
- firebase-admin

Store papildus:
- Shopify Storefront API (drīzumā)
- lucide-react ikonas

## Migrācija uz pilnu monorepo

Šobrīd admin sistēma fiziski dzīvo repo saknē (`src/`, `app/`, `package.json`), nevis `apps/admin/`. Šī ir tikai pagaidu inkrementāla pieeja:

1. **Tagad (2026-05-24):** `apps/store/` izveidots ar atsevišķu setup. Admin paliek root, lai production Vercel deploy turpina strādāt.
2. **Nākotnē (drīzumā):** Izveidot atsevišķu `apps/store/` Vercel projektu 14d.lv domēnam.
3. **Vēlāk:** Migrēt admin uz `apps/admin/`. Tas prasa koordinētu Vercel project root direktorijas maiņu + atjaunot `firestore.rules`/`firebase.json` ceļus.

Skat lēmumus: [[09_DECISIONS]].

## Saistītās piezīmes

- [[02_DOMAINS]]
- [[05_PRODUCT_WORKFLOW]]
- [[06_SHOPIFY_INTEGRATION]]
- [[09_DECISIONS]]
- [[10_NEXT_STEPS]]
