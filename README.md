# 14D Shopify System

> **Šis NAV Workmanis.lv projekts.**
> Šī ir 14D ekosistēma — palešu / liquidation / outlet noliktavas apstrādes sistēma + publiskais e-veikals. Tā tikai izmanto subdomēnu `shopify.workmanis.lv` un nedalās ar Workmanis.lv ne Firebase, ne repo, ne Vercel projektu.

## Divas aplikācijas, viens repo

```
shopify.workmanis.lv/   ← repo nosaukums (vēsturisks)
│
├── (admin sistēma šobrīd dzīvo šeit, repo saknē)
│   src/, app/, package.json, firestore.rules ...
│   = shopify.workmanis.lv (production)
│
├── apps/
│   └── store/                ← jauns!
│       = 14d.lv publiskais e-veikals
│
├── docs/obsidian/                       ← admin dokumentācija (16+ failu)
└── obsidian/
    └── 14D-Shopify-System-Obsidian/     ← visa ekosistēma (high-level)
```

| | **Admin** | **Store** |
|---|---|---|
| Domēns | `shopify.workmanis.lv` | `14d.lv` |
| Mape | repo root (vēlāk → `apps/admin/`) | `apps/store/` |
| Mērķis | Darbinieku/admin sistēma | Publiskais klientu e-veikals |
| Lietotāji | MASTER, ADMIN, WAREHOUSE, VIEWER | Anonīmi apmeklētāji |
| Backend | Firestore + Anthropic API + Shopify Admin API | Shopify Storefront API |
| Status | LIVE production | Skeleton (2026-05-24) |

> **Skaidri:** Admin un Store nedrīkst sajaukt. Admin sistēma satur iekšējās cenas, AI draft datus, darbinieku paneļus — tas viss paliek `apps/admin`. Store rāda tikai publicētus Shopify produktus.

Pilns konteksts: [`obsidian/14D-Shopify-System-Obsidian/`](obsidian/14D-Shopify-System-Obsidian/).

## Stack

Abām aplikācijām kopīgs:
- Next.js 15 (App Router) + React 19
- TypeScript strict
- Tailwind v4
- Vercel deployment

Admin papildus:
- Firebase Auth + Firestore + Storage
- Anthropic SDK (Claude Opus 4.7) — produktu bagātinājums
- SheetJS (`xlsx`) — Excel manifestu lasīšana
- `lucide-react` ikonām

Store papildus:
- Shopify Storefront API (drīzumā)
- `lucide-react` ikonām

## Palaišana

### Admin (shopify.workmanis.lv) — repo saknē

```bash
npm install
cp .env.example .env.local         # aizpildi Firebase vērtības
npm run dev                        # http://localhost:3000
```

Komandas:
```bash
npm run typecheck
npm run build
npm run lint
npm run seed:master                # pirmā MASTER lietotāja izveide
npm run emulators                  # Firebase emulatori
npm run seed:emulator              # demo dati emulatorā
npm run demo:env                   # ātrais emulator setup
```

### Store (14d.lv) — `apps/store/`

```bash
cd apps/store
npm install
cp .env.example .env.local         # Shopify vērtības (opcionāli — strādā ar mock datiem)
npm run dev                        # http://localhost:3001
```

Komandas (no `apps/store/`):
```bash
npm run typecheck
npm run build
npm run start
```

> Atsevišķi porti (3000 admin, 3001 store) — var palaist abus paralēli.

## ENV mainīgie

### Admin (root `.env.local`)

Pilns saraksts: [.env.example](.env.example).

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_SERVICE_ACCOUNT_PATH=/abs/path/to/service-account.json
MASTER_SEED_EMAIL=
MASTER_SEED_PASSWORD=
MASTER_SEED_DISPLAY_NAME=

ANTHROPIC_API_KEY=                 # Claude Opus 4.7
AI_CONCURRENCY=5                   # paralelizācija
```

### Store (`apps/store/.env.local`)

Pilns saraksts: [`apps/store/.env.example`](apps/store/.env.example).

```
NEXT_PUBLIC_SITE_URL=https://14d.lv
NEXT_PUBLIC_STORE_DOMAIN=          # mystore.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
SHOPIFY_API_VERSION=2025-04
```

## Drošība

- Firestore rules ar lomu loģiku: [firestore.rules](firestore.rules)
- Storage rules: [storage.rules](storage.rules)
- Service-account JSON un `.env.local` ir `.gitignore`d
- **Store** neimportē neko no admin sistēmas (Firestore, manifesti, AI dati)
- Store ENV satur tikai publiskos Storefront tokens, **NEKAD** Admin API token

## Deployment

| | Admin | Store |
|---|---|---|
| Vercel projekts | `shopify-workmanis-lv` (LIVE) | TODO — atsevišķs jauns projekts |
| Root directory | repo root | `apps/store/` |
| Domain | `shopify.workmanis.lv` (TODO DNS) | `14d.lv` (TODO DNS) |

Admin deployment: [docs/obsidian/08_Deployment_Vercel_Firebase.md](docs/obsidian/08_Deployment_Vercel_Firebase.md)

Store: skat [`obsidian/14D-Shopify-System-Obsidian/02_DOMAINS.md`](obsidian/14D-Shopify-System-Obsidian/02_DOMAINS.md).

## Dokumentācija

| | Atrašanās | Saturs |
|---|---|---|
| **Admin detalizēti** | [docs/obsidian/](docs/obsidian/) | 20+ failu: AI, claims, manifests, dashboard, audit |
| **Sistēmas pārskats** | [obsidian/14D-Shopify-System-Obsidian/](obsidian/14D-Shopify-System-Obsidian/) | Augstā līmeņa skats uz visu ekosistēmu |

## TODO

- Admin: [docs/obsidian/10_TODO.md](docs/obsidian/10_TODO.md)
- Sistēmas: [obsidian/14D-Shopify-System-Obsidian/10_NEXT_STEPS.md](obsidian/14D-Shopify-System-Obsidian/10_NEXT_STEPS.md)

## Pirmā MASTER lietotāja izveide

1. Console.firebase.google.com → Project Settings → Service accounts → **Generate new private key**.
2. Saglabā JSON failu **ārpus repo**.
3. Aizpildi `.env.local` (admin) ar `FIREBASE_SERVICE_ACCOUNT_PATH` u.c.
4. `npm run seed:master`
5. Atver `http://localhost:3000/login`.
