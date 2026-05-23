# 11 — Emulator Demo (Local)

> **Tikai lokālā izstrādei.** Šī setup NEDARBOJAS https://shopify-workmanis-lv.vercel.app — tas vienmēr prasa reālu Firebase projektu. Emulatori dod tūlītēju "demo" pieredzi bez Firebase konsoles.

## Priekšnoteikumi

- **Java 21+** (firebase-tools 15+ to prasa)
  ```bash
  brew install openjdk@21
  ```
- `firebase-tools` jau ir devDependency.

## 3 termināļi paralēli

### 1. Emulatori

```bash
npm run emulators
```

Klausās uz:

- Auth      `127.0.0.1:9099`
- Firestore `127.0.0.1:8080`
- Storage   `127.0.0.1:9199`
- UI        `http://127.0.0.1:4000`

### 2. Seed demo data (vienreiz pēc katra `npm run emulators` restarta)

```bash
npm run seed:emulator
```

Izveido 4 demo lietotājus + 1 paleti ar 7 produktiem.

### 3. Next.js dev

```bash
npm run dev
```

Atveras `http://localhost:3000`.

> Pirmajā reizē palaisi `npm run demo:env` lai uzliktu `.env.local` ar emulator placeholderiem.

## Demo lietotāji

Visiem parole `Demo1234!`:

| E-pasts                  | Loma       | Ko var darīt |
| ------------------------ | ---------- | ------------ |
| `master@demo.local`      | MASTER     | Viss, ieskaitot `/masteradmin` |
| `admin@demo.local`       | ADMIN      | Import, approve, change prices |
| `warehouse@demo.local`   | WAREHOUSE  | Warehouse status, images |
| `viewer@demo.local`      | VIEWER     | Tikai lasīt |

`/masteradmin` ir pieejams **tikai** `master@demo.local` — citas lomas saņem Access denied.

## Demo dati

Importēta viena palete `RED19276 — Demo manifest` (avots Jobalots, EUR) ar 7 produktiem (dog ramp, smoke detector, jewellery box, …) — atspoguļo manifesta paraugu, ko Tu iedevi sākotnēji.

## Emulator UI

Atver http://127.0.0.1:4000/ — redzi auth users, Firestore dokumentus, Storage saturu, audit logus. Praktiski Firebase console, tikai lokāli.

## Datu izzušana

Emulatori pēc noklusējuma **negiabā datus starp restartiem**. Pēc katra `npm run emulators` restarta seedo no jauna:

```bash
npm run seed:emulator
```

(Ja vēlies persistenci, palaiž `firebase emulators:start --import=.firebase-emulator-data --export-on-exit` — `.firebase-emulator-data/` ir `.gitignore`-d.)

## Production gaita

Kad būsi gatavs reālajam Firebase projektam, izdzēs `.env.local` un izveido jaunu pēc [[08_Deployment_Vercel_Firebase]]. Tas pats `seed:master` skripts izveidos reālo MASTER lietotāju.

## Saistītās piezīmes

- [[03_Authentication_And_Roles]]
- [[08_Deployment_Vercel_Firebase]]
- [[10_TODO]]
