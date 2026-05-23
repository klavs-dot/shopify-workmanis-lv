# shopify.workmanis.lv

> **Šis NAV Workmanis.lv projekts.**
> Šī ir atsevišķa palešu / liquidation / outlet noliktavas un Shopify sagatavošanas sistēma.
> Tā tikai izmanto subdomēnu `shopify.workmanis.lv` un nedalās ar Workmanis.lv:
>
> - Firebase projektu
> - GitHub repo
> - Vercel projektu
> - Obsidian dokumentāciju
> - Datu bāzi
> - Lietotāju bāzi
> - Vidi (.env)

## Kas šajā projektā ir

Next.js + Firebase aplikācija palešu biznesam:

- **Import** — Excel manifesta augšupielāde (Jobalots tipa formāts).
- **Pallets** — paletes ar agregātiem.
- **Products** — pilna produktu datubāze ar 8 statusu domēniem.
- **Pricing engine** — kondicionēšanas koeficienti + `.99` noapaļošana.
- **Approval** — apstiprināšanas rinda ar Approve / Bundle / Outlet / Reject / Needs Photo / Missing.
- **MasterAdmin** — slēptais panelis lietotāju pārvaldībai un audit log skatam.
- **Role-based access** — MASTER / ADMIN / WAREHOUSE / VIEWER.
- **Audit log** — visas svarīgākās darbības tiek pierakstītas.
- **Sagatavotības** AI enrichment un Shopify Admin API integrācijai (datu lauki gatavi, integrācija sekos).

## Tech stack

- Next.js 15 (App Router) + TypeScript strict
- Tailwind CSS v4
- Firebase Auth (email/password) + Firestore + Storage
- `firebase-admin` API maršrutiem un seed skriptam
- SheetJS (`xlsx`) Excel manifesta lasīšanai
- `lucide-react` ikonām

## Lokālā palaišana

### A. Ātrais demo režīms (Firebase emulatori — bez konsoles)

Prasība: Java 21+ (`brew install openjdk@21`).

```bash
npm install
npm run demo:env                  # uzraksta .env.local ar emulator placeholderiem
npm run emulators                 # 1. terminālī
npm run seed:emulator             # 2. terminālī (kad emulators ir ready)
npm run dev                       # 3. terminālī
```

Atver `http://localhost:3000/login` un ielogojies:

| E-pasts                  | Parole       | Loma       |
| ------------------------ | ------------ | ---------- |
| `master@demo.local`      | `Demo1234!`  | MASTER (redz `/masteradmin`) |
| `admin@demo.local`       | `Demo1234!`  | ADMIN |
| `warehouse@demo.local`   | `Demo1234!`  | WAREHOUSE |
| `viewer@demo.local`      | `Demo1234!`  | VIEWER |

Detaļas: [docs/obsidian/11_Emulator_Demo.md](docs/obsidian/11_Emulator_Demo.md).

### B. Reāls Firebase projekts

```bash
npm install
cp .env.example .env.local        # aizpildi Firebase vērtības no Console
npm run dev                       # http://localhost:3000
```

Palīgkomandas:

```bash
npm run typecheck                 # TypeScript strict
npm run build                     # production build
npm run start                     # production server
npm run lint                      # ESLint
npm run seed:master               # pirmā MASTER lietotāja izveide
```

## ENV mainīgie

Pilns saraksts ir [.env.example](.env.example). Klienta puses (publiski) Firebase config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Servera puses (tikai seed un API):

```
FIREBASE_SERVICE_ACCOUNT_PATH=/absolūtais/ceļš/service-account.json
MASTER_SEED_EMAIL=
MASTER_SEED_PASSWORD=
MASTER_SEED_DISPLAY_NAME=
```

## Pirmā MASTER lietotāja izveide

1. Console.firebase.google.com → Project Settings → Service accounts → **Generate new private key**.
2. Saglabā JSON failu **ārpus repo**.
3. Aizpildi `.env.local`:
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=/Users/<tu>/Secure/shopify-workmanis-service-account.json
   MASTER_SEED_EMAIL=tu@workmanis.lv
   MASTER_SEED_PASSWORD=<vismaz 8 simboli>
   MASTER_SEED_DISPLAY_NAME=Tavs vārds
   ```
4. `npm run seed:master`
5. Atver `http://localhost:3000/login` un ielogojies.
6. Atver `http://localhost:3000/masteradmin` — citi lietotāji šo URL neredz sidebar.

## Manifesta importēšana

1. Ielogojies kā MASTER vai ADMIN.
2. Atver `/import`.
3. Ievadi paletes nosaukumu, izvēlies `.xlsx` failu (piem. `MF-47-ndBAUze.xlsx`).
4. Klikšķini **Importēt**.
5. Sistēma izveidos paleti, ievietos visus produktus, pierakstīs audit log un parādīs summary.

Tehniskas detaļas: [docs/obsidian/04_Manifest_Import.md](docs/obsidian/04_Manifest_Import.md).

## Drošība

- Firestore rules ar lomu loģiku: [firestore.rules](firestore.rules)
- Storage rules: [storage.rules](storage.rules)
- Reālais drošības slānis ir Firestore + Storage rules; UI gating ir tikai ērtībai.
- Service-account JSON un `.env.local` ir `.gitignore`d.

## Deployment

Skat [docs/obsidian/08_Deployment_Vercel_Firebase.md](docs/obsidian/08_Deployment_Vercel_Firebase.md).

## Obsidian dokumentācija

Atrodas [docs/obsidian/](docs/obsidian/). Atver šo mapi kā Obsidian vault.

## TODO

Skat [docs/obsidian/10_TODO.md](docs/obsidian/10_TODO.md).
