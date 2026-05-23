# 08 — Deployment: Vercel + Firebase

> Pilnīgi jauns Vercel projekts un pilnīgi jauns Firebase projekts.
> NEKĀD GADĪJUMĀ nepievienot šos eksistējošajiem Workmanis.lv projektiem.

## Lokālā palaišana

```bash
npm install        # vai pnpm install
cp .env.example .env.local
# Aizpildi Firebase config + (pēc izvēles) seed lauki
npm run dev        # http://localhost:3000
```

`npm run build` izpilda production build, `npm run start` palaiž to.
`npm run typecheck` palaiž TypeScript strict check.

## Firebase projekts

1. https://console.firebase.google.com → **Add project** → nosaukums `shopify-workmanis` (vai pieejama variācija).
2. Atspējo Google Analytics, ja nevēlies (var iespējot vēlāk).
3. **Build → Authentication** → Get started → **Sign-in providers** → ieslēdz **Email/Password**.
4. **Build → Firestore** → Create database → Native mode → izvēlies tuvāko reģionu (`europe-west`).
5. **Build → Storage** → Get started → defaults (var pārvietot uz to pašu reģionu).
6. **Project settings → General → Your apps → Web** → registrē app → kopē config uz `.env.local`.
7. **Project settings → Service accounts → Generate new private key** → JSON failu saglabā droši ārpus repo. Norādi ceļu `FIREBASE_SERVICE_ACCOUNT_PATH`.

### Deploy rules

```bash
npm install -g firebase-tools      # ja vēl nav
firebase login                     # pārlūks
firebase use --add                 # izvēlies projektu, saglabā kā default
firebase deploy --only firestore:rules,firestore:indexes,storage
```

`firestore.rules`, `firestore.indexes.json`, `storage.rules` jau ir sagatavoti un commit-uzlikti repo.

## Vercel projekts

### Caur CLI (rekomendēts MVP)

```bash
vercel login
vercel link                        # izveidot jaunu projektu: shopify-workmanis-lv
# Iestati ENV (production + preview):
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
# Server-side admin SDK (Production / Preview tikai!):
vercel env add FIREBASE_SERVICE_ACCOUNT_PATH   # vai izmanto FIREBASE_SERVICE_ACCOUNT_JSON variantu, skat zemāk

vercel --prod
```

### Production runtime padoms

Vercel filesystem ir read-only — nevar norādīt `FIREBASE_SERVICE_ACCOUNT_PATH` uz lokālu failu. Production environment vietā saglabā JSON saturu kā vienu ENV mainīgo `FIREBASE_SERVICE_ACCOUNT_JSON` un attiecīgi pārlabo `src/lib/firebase-admin.ts` (TODO — skat [[10_TODO]]).

### Domēns vēlāk

`shopify.workmanis.lv` → Project Settings → Domains → Add → ieraksti `shopify.workmanis.lv`. Pievieno DNS CNAME `cname.vercel-dns.com`. Tas notiks kā atsevišķs solis pēc MVP.

## GitHub

Publisks repo: `github.com/klavs-dot/shopify-workmanis-lv`. Vercel un Firebase Hosting Channels (ja izmantosim) seko `main`.

## Saistītās piezīmes

- [[03_Authentication_And_Roles]] — seed komandas
- [[10_TODO]]
