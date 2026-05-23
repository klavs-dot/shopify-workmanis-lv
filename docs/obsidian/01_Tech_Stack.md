# 01 — Tech Stack

> Atsevišķs no Workmanis.lv tehnoloģiju steka, lai gan vairākas izvēles sakrīt.

## Pamats

| Slānis              | Izvēle                          | Iemesls |
| ------------------- | ------------------------------- | ------- |
| Frontend framework  | **Next.js 15** (App Router)     | Vercel-native, SSR + RSC, ātrs prototipam |
| Valoda              | **TypeScript** strict           | Tipu drošība lielai datu shēmai |
| Stilizācija         | **Tailwind CSS v4**             | Ātra UI iterācija, mazs CSS bundle |
| Ikonas              | **lucide-react**                | Tree-shakable, vienkārša SVG bibliotēka |
| State / data        | **Firestore** real-time         | Mazas administrēšanas tabulas, viegli indeksējamas |
| Auth                | **Firebase Auth** (email/pass)  | Bez Google login — manuālā lietotāju izveide |
| Storage             | **Firebase Storage**            | Produktu bildes |
| Server actions      | **Next.js API routes** (Node)   | User creation prasa `firebase-admin` SDK |
| Excel parsing       | **xlsx (SheetJS)** CDN tarball  | Industrijas standarts, lasa Jobalots formātu |
| Hosting             | **Vercel**                      | Native Next.js, edge deploy |
| Versiju kontrole    | **GitHub** (publisks repo)      | `klavs-dot/shopify-workmanis-lv` |
| Dokumentācija       | **Obsidian** Markdown vault     | `docs/obsidian/` projekta iekšienē |

## Nelietojam (apzināti)

- **Google Auth / Sign in with Google** — visi lietotāji tiek izveidoti manuāli caur MasterAdmin vai seed.
- **Supabase / Prisma** — visu darbu ietilpina Firestore.
- **NextAuth** — Firebase Auth pietiek tiešam email/parolei.
- **Eksistējošais Workmanis.lv Firebase projekts** — pilnīga izolācija.
- **Eksistējošais Workmanis.lv Vercel projekts** — atsevišķs deploy.
- **Eksistējošais Workmanis.lv GitHub repo** — jauns publisks repo.
- **Eksistējošais Workmanis.lv Obsidian vault** — vault dzīvo iekšā `docs/obsidian/` šajā repo.

## Mapju struktūra

```
shopify.workmanis.lv/
├── src/
│   ├── app/                  # Next.js App Router lapas
│   │   ├── api/admin/users/  # MASTER user creation API
│   │   ├── approval/
│   │   ├── dashboard/
│   │   ├── import/
│   │   ├── login/
│   │   ├── masteradmin/
│   │   ├── pallets/
│   │   └── products/
│   ├── components/           # UI komponentes (AppShell, StatusBadge)
│   └── lib/
│       ├── auth/             # AuthProvider, RequireRole, roles
│       ├── firestore/        # users / pallets / products / audit
│       ├── firebase.ts       # client SDK init
│       ├── firebase-admin.ts # server-only admin SDK init
│       ├── manifest.ts       # Excel parser
│       ├── pricing.ts        # pricing engine
│       └── types.ts          # visi domain tipi
├── scripts/
│   └── seed-master.ts        # pirmā MASTER user setup
├── docs/obsidian/            # šis vault
├── firestore.rules           # Firestore drošības rules
├── firestore.indexes.json    # nepieciešamie kompozītu indeksi
├── storage.rules             # Storage rules
└── firebase.json             # firebase CLI konfigurācija
```

## Versijas

- Node.js ≥ 22 (lokāli izmantots v26)
- Next.js 15.1.x
- React 19
- Firebase JS SDK 11.x
- firebase-admin 13.x
