# 03 — Authentication & Roles

> Firebase Auth ar email/password. Bez Google login, bez sociāla login.
> SEPARATE Firebase projekts no Workmanis.lv.

## Lomas

| Loma         | Aprakts                                                          |
| ------------ | ---------------------------------------------------------------- |
| `MASTER`     | Pilna piekļuve. Vienīgais, kurš redz `/masteradmin`.             |
| `ADMIN`      | Importē manifestus, apstiprina produktus, maina cenas, Shopify. |
| `WAREHOUSE`  | Pārbauda preces, maina warehouse status, augšupielādē bildes.    |
| `VIEWER`     | Tikai skatīšanās.                                                |

Lomas atrunātas:

- TypeScript: [src/lib/types.ts](../../src/lib/types.ts) → `UserRole`
- Atļauju mapping: [src/lib/auth/roles.ts](../../src/lib/auth/roles.ts) → `PERMISSIONS`
- Firestore rules: [firestore.rules](../../firestore.rules)

## Aizsargātie ceļi

| Ceļš              | Atļautās lomas                                  |
| ------------------ | ----------------------------------------------- |
| `/login`           | Publisks                                        |
| `/dashboard`       | MASTER, ADMIN, WAREHOUSE, VIEWER                |
| `/import`          | MASTER, ADMIN                                   |
| `/pallets`         | MASTER, ADMIN, WAREHOUSE, VIEWER                |
| `/pallets/[id]`    | MASTER, ADMIN, WAREHOUSE, VIEWER                |
| `/products`        | MASTER, ADMIN, WAREHOUSE, VIEWER                |
| `/products/[id]`   | MASTER, ADMIN, WAREHOUSE, VIEWER                |
| `/approval`        | MASTER, ADMIN, WAREHOUSE                        |
| `/masteradmin/**`  | **MASTER tikai**                                |

Aizsardzību veic React-side `RequireRole` ([src/lib/auth/RequireRole.tsx](../../src/lib/auth/RequireRole.tsx)) + Firestore rules. Reālais drošības slānis ir Firestore + Storage rules, nevis UI.

## `/masteradmin` slēptais ceļš

- Nav redzams sidebar lietotājiem, kas nav MASTER.
- MASTER lietotājam parādās violeta poga sidebar apakšā.
- URL `/masteradmin` strādā tikai MASTER lomai, citi saņem **Access denied**.

## Pirmā MASTER lietotāja izveide

Visdrošākais MVP variants — **CLI seed skripts** ar Firebase Admin SDK.

### Solis 1. Iegūt service account JSON

1. https://console.firebase.google.com → izvēlies projektu `shopify-workmanis*`.
2. ⚙ → Project settings → Service accounts.
3. Generate new private key → lejupielādē `service-account.json` (NEKĀD GADĪJUMĀ NEKOMITĒT).
4. Saglabā, piemēram, `~/Secure/shopify-workmanis-service-account.json`.

### Solis 2. Aizpildīt `.env.local`

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=shopify-workmanis.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=shopify-workmanis
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=shopify-workmanis.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_SERVICE_ACCOUNT_PATH=/Users/klavs/Secure/shopify-workmanis-service-account.json
MASTER_SEED_EMAIL=klavs@workmanis.lv
MASTER_SEED_PASSWORD=SuperSafePassword123
MASTER_SEED_DISPLAY_NAME=Klavs
```

### Solis 3. Palaist seed

```bash
npm run seed:master
```

Skripts:

1. Izveido vai atjauno Firebase Auth ierakstu ar šo e-pastu.
2. Izveido / atjauno `users/{uid}` dokumentu ar `role=MASTER`, `status=active`.
3. Pieraksta ierakstu `auditLogs`.
4. Drošs atkārtoti palaist.

### Solis 4. Ieiet UI

1. `npm run dev`
2. Atver `http://localhost:3000/login`
3. Ievadi to pašu e-pastu/paroli.
4. Atvēr `http://localhost:3000/masteradmin`.

## Nākamo lietotāju izveide

No `/masteradmin/users/new`. Pieprasījums iet uz `POST /api/admin/users` (Node runtime), kas:

1. Pārbauda Authorization Bearer ID token.
2. Verificē, ka caller `role == MASTER`.
3. Izveido Firebase Auth user.
4. Izveido `users/{uid}` dokumentu.
5. Pieraksta audit log.

Paroli MASTER nodod manuāli (ja vēlies, vēlāk var pievienot password-reset e-pastu).

## Saistītās piezīmes

- [[02_Database_Structure]]
- [[08_Deployment_Vercel_Firebase]]
- [[10_TODO]]
