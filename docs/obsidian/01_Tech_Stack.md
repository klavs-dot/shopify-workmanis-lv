# 01 — Tech Stack

> Atsevišķs no Workmanis.lv tehnoloģiju steka, lai gan vairākas izvēles sakrīt.

## Pamats

| Slānis | Izvēle | Iemesls |
|---|---|---|
| Frontend framework | **Next.js 15** (App Router) | Vercel-native, SSR + RSC, ātrs prototipam |
| Valoda | **TypeScript** strict | Tipu drošība lielai datu shēmai |
| Stilizācija | **Tailwind CSS v4** | Ātra UI iterācija, mazs CSS bundle |
| Ikonas | **lucide-react** | Tree-shakable, vienkārša SVG bibliotēka |
| State / data | **Firestore** real-time | Mazas administrēšanas tabulas, viegli indeksējamas |
| Auth | **Firebase Auth** (email/pass) | Bez Google login — manuāla lietotāju izveide |
| Storage | **Firebase Storage** | Produktu bildes |
| Server actions | **Next.js API routes** (Node) | User creation + AI prasa `firebase-admin` SDK |
| Excel parsing | **xlsx (SheetJS)** CDN tarball | Industrijas standarts, lasa Jobalots formātu |
| HTML parsing | **cheerio** (papildus) | Jobalots HTML; faktiski lielāko daļu darbam ar RSC JSON, bet cheerio pieejams ja vajadzēs |
| **AI** | **@anthropic-ai/sdk** (Claude Sonnet 4.6) | Produktu apraksti, bildes, kategorijas — skat [[06_AI_Enrichment]] |
| Hosting | **Vercel** (Pro plan) | Native Next.js, edge deploy, 300-800s function timeout AI darbam |
| Versiju kontrole | **GitHub** (publisks repo) | `klavs-dot/shopify-workmanis-lv` |
| Dokumentācija | **Obsidian** Markdown vault | `docs/obsidian/` projekta iekšienē |

## Nelietojam (apzināti)

- **Google Auth / Sign in with Google** — visi lietotāji manuāli caur MasterAdmin vai seed.
- **Supabase / Prisma** — visu darbu ietilpina Firestore.
- **NextAuth** — Firebase Auth pietiek email/parolei.
- **Eksistējošais Workmanis.lv Firebase / Vercel / GitHub repo / Obsidian vault** — pilnīga izolācija.

## Mapju struktūra

```
shopify.workmanis.lv/
├── src/
│   ├── app/                          # Next.js App Router lapas
│   │   ├── api/
│   │   │   ├── admin/users/          # MASTER user creation
│   │   │   ├── ai/
│   │   │   │   ├── enrich-product/   # Posms 5 — per-product Claude call
│   │   │   │   └── enrich-pallet/    # Posms 5 — bulk
│   │   │   └── jobalots/lookup/      # Posms 2 — public Jobalots fetcher
│   │   ├── approval/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── manifesti/                # Posms 1 — bijis /import
│   │   ├── masteradmin/
│   │   ├── products/
│   │   ├── skirosana/                # Posms 1 — bijis /pallets
│   │   └── utilizetas/               # Posms 1 — JAUNS, disposed produkti
│   ├── components/
│   │   ├── AppShell.tsx              # Sidebar ar WORKMANIS wordmark
│   │   ├── ProductActionsPanel.tsx   # Posms 4 — apstiprināt, piezīme, sold, dispose, AI
│   │   ├── RobotLogo.tsx             # Branding — animēts SVG robots
│   │   └── StatusBadge.tsx
│   └── lib/
│       ├── ai/
│       │   └── enrich.ts             # Posms 5 — Claude Sonnet 4.6 cauruļvads
│       ├── auth/
│       ├── firestore/
│       ├── firebase.ts
│       ├── firebase-admin.ts
│       ├── jobalots.ts               # Posms 2 — RSC parser
│       ├── manifest.ts               # Posms 1 — paplašināts parser
│       ├── pricing.ts
│       └── types.ts
├── scripts/
│   ├── seed-master.ts                # Pirmais MASTER user
│   ├── seed-emulator.ts              # Demo data emulatorā
│   ├── test-jobalots.ts              # Smoke test Jobalots parser
│   ├── test-parser.ts                # Smoke test Excel parser
│   ├── test-ai-enrich.ts             # Smoke test Claude API
│   └── write-demo-env.ts             # .env.local placeholders emulatoram
├── docs/obsidian/                    # Šis vault
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
└── firebase.json
```

## Sidebar navigācija (Posms 1 pārstrukturēta)

| Maršruts | Lapas nosaukums | Atļautās lomas |
|---|---|---|
| `/dashboard` | Dashboard | Visi auth lietotāji |
| `/manifesti` | **Manifesti** (bijis Import) | MASTER, ADMIN |
| `/logistika` | **Loģistika** (jauns) — ceļā esošās paletes | Visi (saņemt: MASTER/ADMIN/WAREHOUSE) |
| `/skirosana` | **Šķirošana** (bijis Paletes) | Visi |
| `/products` | Produkti | Visi |
| `/approval` | Approval | MASTER, ADMIN, WAREHOUSE |
| `/utilizetas` | **Utilizētās preces** (JAUNS) | Visi |
| `/masteradmin` | (slēpts) | MASTER tikai |

## Versijas

- Node.js ≥ 22 (lokāli izmantots v26)
- Next.js 15.5.18 (security patch — sākotnējais 15.1.3 noraidīts Vercel)
- React 19
- Firebase JS SDK 11.x
- firebase-admin 13.x
- @anthropic-ai/sdk (latest)
- Java 21+ (tikai emulatoriem)
