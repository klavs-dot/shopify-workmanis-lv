# 14d.lv — public storefront (`apps/store`)

Publiskais e-veikals 14D zīmolam. Atsevišķa aplikācija no admin sistēmas (`apps/admin` — šobrīd dzīvo repo saknē, sk. root README).

> **Skaidri:** šeit nedrīkst būt nekas admin-only. Importi manifesti, AI draft dati, iekšējās cenas, darbinieku paneļi paliek `apps/admin`. Robežu nodrošina Shopify Storefront API — publiskais veikals lasa tikai publicētus produktus.

## Stack

- **Next.js 15** App Router + React 19
- **TypeScript** strict
- **Tailwind v4** (CSS-first, pa root `globals.css`)
- **lucide-react** ikonas
- Plānots: **Shopify Storefront API** + Storefront cart → hosted checkout

## Struktūra

```
apps/store/
├── app/                      Next.js App Router
│   ├── layout.tsx            Root layout ar SEO + Header/Footer
│   ├── page.tsx              Sākumlapa
│   ├── products/
│   │   ├── page.tsx          Katalogs ar filtru sidebar + sort
│   │   └── [slug]/page.tsx   Produkta detaļu lapa
│   ├── categories/
│   │   ├── page.tsx          Visu kategoriju režģis
│   │   └── [slug]/page.tsx   Kategorijas lapa
│   ├── cart/page.tsx         Grozs (placeholder)
│   └── about/ delivery/ contacts/ terms/ privacy/ returns/
│
├── components/
│   ├── layout/   Header, Footer, mobile drawer
│   ├── home/     Hero, CategorySection, FeaturedProducts, TrustSection, HowItWorks
│   ├── product/  ProductCard, ProductGrid, ProductGallery, ProductFilters
│   └── ui/       Button, Badge, Container
│
├── lib/
│   ├── mock-products.ts      Mock katalogs (16 produkti, 8 kategorijas)
│   ├── categories.ts         Kategoriju definīcijas
│   ├── shopify.ts            Storefront API klients (PLACEHOLDER)
│   ├── format-money.ts       EUR formatēšana + discount %
│   └── utils.ts              cn() className helper
│
├── types/
│   ├── product.ts            Product, Money, ProductImage, condition/availability
│   ├── category.ts
│   └── cart.ts
│
└── public/                   Statiski faili (logo, ikonas, utt.)
```

## Lokāli palaist

```bash
cd apps/store
npm install
cp .env.example .env.local   # neobligāti, kamēr nav Shopify
npm run dev
```

Atveras uz `http://localhost:3001`. Šis ports ir izvēlēts, lai vienlaikus var
palaist arī admin (kas izmanto 3000).

## Build / typecheck

```bash
npm run typecheck
npm run build
npm start
```

## Mock dati

Kamēr nav Shopify Storefront API integrācijas, viss katalogs nāk no
[`lib/mock-products.ts`](./lib/mock-products.ts) un [`lib/categories.ts`](./lib/categories.ts).

Lai pievienotu jaunu produktu: ievieto papildu objektu `MOCK_PRODUCTS` masīvā.
Slugs ir stabils un kalpo kā URL.

## Shopify integrācija — TODO

[`lib/shopify.ts`](./lib/shopify.ts) jau ir API skelets ar `fetchProducts`,
`fetchProductBySlug`, `createCheckout`, `storefrontFetch`. Funkcijas
automātiski atgriežas pie mock datiem, ja env vars nav uzstādīti.

Pirms iebūvē reālu Shopify:

1. Iegūsti Shopify Partner Storefront access token.
2. Aizpildi `.env.local` ar `NEXT_PUBLIC_STORE_DOMAIN` un `SHOPIFY_STOREFRONT_ACCESS_TOKEN`.
3. Implementē GraphQL queries iekš `shopify.ts` (TODO komentāri jau ir failā).
4. Aizvieto `mock-products.ts` izsaukumus ar `fetchProducts()` lapās, kas to lieto.

Pilnāks plāns: `obsidian/14D-Shopify-System-Obsidian/06_SHOPIFY_INTEGRATION.md`.

## Drošība

- Nekādi reāli API keys koda iekšā vai git vēsturē
- `NEXT_PUBLIC_*` env vars ir publiski klienta JS — neliek tur Admin API tokens
- Veikals **drīkst importēt tikai** no `apps/store/`. Neimportē neko no admin sistēmas
- Veikals **rāda tikai** publicētus produktus (Shopify produktu `availableForSale: true` filtrs)
- Cenas, kuras lietotājs redz, ir tirgojamās — iekšējās iepirkuma cenas paliek `apps/admin`

## Deployment

Šobrīd nav Vercel projekta. Plānots:

1. Jauns Vercel projekts ar root direktoriju `apps/store/`
2. ENV vars Vercel project settings sadaļā
3. DNS: `14d.lv` un `www.14d.lv` → Vercel
4. Shopify Admin: pievienot `14d.lv` kā permitted domain

## Saistība ar admin

| | Admin (`shopify.workmanis.lv`) | Store (`14d.lv`) |
|---|---|---|
| **Mape** | repo root (vēlāk `apps/admin/`) | `apps/store/` |
| **Lietotāji** | tikai darbinieki (Firebase Auth) | publiski apmeklētāji |
| **Produktu avots** | Firestore + manifesti | Shopify Storefront API |
| **Cenas** | iekšējās + publicējamās | tikai publicējamās |
| **Backend** | Firestore + Anthropic API + Shopify Admin API | Shopify Storefront API |

Datu plūsma: Admin imports manifestu → AI bagātina → darbinieks apstiprina →
produkts tiek publicēts uz Shopify → 14d.lv rāda Shopify produktu.
