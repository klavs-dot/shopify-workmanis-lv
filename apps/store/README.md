# 14d.lv — public storefront (`apps/store`)

Publiskais e-veikals 14D zīmolam. Atsevišķa aplikācija no admin sistēmas (`apps/admin` — šobrīd dzīvo repo saknē, sk. root README).

> **Skaidri:** šeit nedrīkst būt nekas admin-only. Importi manifesti, AI draft dati, iekšējās cenas, darbinieku paneļi paliek `apps/admin`. Robežu nodrošina Shopify Storefront API — publiskais veikals lasa tikai publicētus produktus.

## Stack

- **Next.js 15** App Router + React 19
- **TypeScript** strict
- **Tailwind v4** (CSS-first, pa root `globals.css`)
- **lucide-react** ikonas
- **Shopify Storefront API** (GraphQL, `lib/shopify/`) + Storefront cart → hosted checkout

## Struktūra

```
apps/store/
├── app/                      Next.js App Router
│   ├── layout.tsx            Root layout ar SEO + Header/Footer
│   ├── page.tsx              Sākumlapa
│   ├── products/
│   │   ├── page.tsx          Katalogs (server; filtri/sort/lapošana URL parametros)
│   │   └── [slug]/page.tsx   Produkta detaļu lapa
│   ├── categories/
│   │   ├── page.tsx          Visu kategoriju režģis
│   │   └── [slug]/page.tsx   Kategorijas lapa
│   ├── cart/                 Grozs (page.tsx) + groza server actions (actions.ts)
│   ├── api/revalidate/       Shopify webhook → kataloga keša pārbūve
│   ├── not-found.tsx, error.tsx, global-error.tsx
│   └── about/ delivery/ contacts/ terms/ privacy/ returns/
│
├── components/
│   ├── layout/   Header, Footer, mobile drawer
│   ├── cart/     HeaderCart (skaits galvenē), AddToCartButton, CartLineControls, CheckoutButton
│   ├── home/     Hero, CategorySection, FeaturedProducts, TrustSection, HowItWorks
│   ├── product/  ProductCard, ProductGrid, ProductGallery, ProductFilters, CatalogPagination
│   └── ui/       Button, Badge, Container
│
├── lib/
│   ├── shopify/              Storefront API datu slānis (server-only, sk. zemāk)
│   ├── catalog-query.ts      /products URL parametri (q, cat, condition, min, max, sort, page)
│   ├── mock-products.ts      Mock katalogs (16 produkti) — rezerve bez Shopify
│   ├── categories.ts         Kategoriju definīcijas
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

## Datu avots: Shopify vai mock

Viss katalogs iet caur `lib/shopify` (`import { getProducts, … } from "@/lib/shopify"`).
Lapas un komponentes nekad neimportē `mock-products.ts` vai `shopifyFetch` tieši.

| `SHOPIFY_STORE_DOMAIN` | Režīms | Avots |
|---|---|---|
| tukšs | `mock` | `lib/mock-products.ts` + `lib/categories.ts`; pasūtīšana izslēgta |
| `mock.shop` | `mock-shop` | https://mock.shop/api — Shopify publiskais testa API (bez tokena, CAD) |
| `xxxx.myshopify.com` | `live` | īstais veikals; vajag `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` |

Izstrādei ar Storefront API: `.env.local` ieliec `SHOPIFY_STORE_DOMAIN=mock.shop`.

**Kešošana:** kataloga pieprasījumi — Next data cache (`unstable_cache` ap
kartētajiem rezultātiem, `lib/shopify/client.ts` → `cachedCatalogRead`) ar
`revalidate: 60` un tagiem `shopify` + `products`/`collections`. Kešojas tikai
veiksmīgi rezultāti: Shopify kļūda (arī HTTP 200 ar `errors`, piem. THROTTLED)
netiek saglabāta, un neizdevusies fona atjaunošana atstāj iepriekšējo ierakstu.
Groza pieprasījumi netiek kešoti. Shopify webhooks uz `POST /api/revalidate`
(paraksts `X-Shopify-Hmac-Sha256` ar `SHOPIFY_WEBHOOK_SECRET`) pārbūvē katalogu
uzreiz.

Ja `SHOPIFY_STORE_DOMAIN` ir īsts veikals, bet nav tokena, lapa **nepārslēdzas**
uz mock datiem — katalogs rāda "Katalogu šobrīd neizdevās ielādēt", serveris
logā kļūdu.

**Kartēšana Shopify → `types/product.ts`** (`lib/shopify/mappers.ts`):

- `slug` = `handle`; `variantId` = pirmā pieejamā varianta GID
- stāvoklis — metafield `custom.condition` → tags `condition:<vērtība>` → `used`
- klienta piezīme — metafield `custom.customer_note` (teksts, ne HTML)
- kategorija — pirmā kolekcija, kuras handle = kategorijas slug → tags `cat:<slug>` → `citi-piedavajumi`
- cena / `compareAtPrice` — varianta `price` / `compareAtPrice` (tikai ja lielāka)
- `availableForSale=false` → "Pārdots" (sarakstos netiek rādīts, tiešajā URL — jā)
- `quantityAvailable` → atlikuma žetoni; ja Shopify to nerāda, žetonu nav
- apraksts — `descriptionHtml` pārvērsts tekstā (nekad `dangerouslySetInnerHTML`)

Metafields `custom.condition` un `custom.customer_note` Shopify adminā jāatver
Storefront API piekļuvei (Settings → Custom data → Products).

## Grozs un apmaksa

Grozs dzīvo Shopify (Storefront Cart API); pārlūks glabā tikai groza id
httpOnly cookie `14d_cart` (30 dienas, `sameSite=lax`, produkcijā `secure`).
Apmaksa un piegādes izvēle notiek Shopify checkout (`cart.checkoutUrl`).

- `lib/shopify/cart.ts` — `createCart`, `addCartLines`, `updateCartLines`,
  `removeCartLines`, `getCartById` (bez keša; īstajā veikalā ar
  `Shopify-Storefront-Buyer-IP`)
- `lib/shopify/cart-session.ts` — cookie + `getCart()` (pašreizējā pircēja grozs,
  viens Shopify pieprasījums uz lapas ielādi)
- `app/cart/actions.ts` — server actions: `addToCart`, `updateCartLine`
  (0 = noņemt), `checkout` (pārlasa grozu → redirect uz checkout), `forgetStaleCart`
- Viena prece grozā 1 gab., ja vien Shopify `quantityAvailable` nav > 1;
  pārdotas preces grozā nenonāk. Serveris to pārbauda katrā darbībā.
- Ja cookie norāda uz Shopify vairs nezināmu grozu (termiņš beidzies,
  pasūtījums noformēts), galvene to klusi izmet.
- Mock režīmā (bez `SHOPIFY_STORE_DOMAIN`) poga "Pievienot grozam" ir atslēgta,
  `/cart` saka, ka pasūtīšana būs drīzumā; cookie netiek lasīts.

**Renderēšana:** galvenes groza skaits nāk no cookie, tāpēc ar Shopify
konfigurāciju visas lapas renderējas katram pieprasījumam (ƒ), arī saturs kā
/about vai /terms. Tas ir apzināts kompromiss par servera renderētu groza skaitu.
Katalogs joprojām nāk no Next data cache (60 s), tāpēc Shopify katalogam netiek
prasīts katru reizi; papildu Shopify pieprasījums ir tikai groza nolasīšana
apmeklētājiem ar grozu (galvene to ielādē Suspense robežā, lapa neaizkavējas).
Lapu `revalidate` un `generateStaticParams` tad neko neprerenderē; tie darbojas
tikai mock režīmā, kur lapas paliek statiskas. Ja statiskas/ISR lapas kļūst
svarīgas, groza skaitu jāielādē atsevišķi (route handler + klienta komponente). Mainot `SHOPIFY_STORE_DOMAIN`, jāveic
jauns build (Vercel: pēc env izmaiņas — Redeploy).

**Checkout domēns:** headless veikalā Shopify primārais domēns nedrīkst būt
`14d.lv` (tas ir šis Next.js veikals) — citādi `checkoutUrl` vedīs atpakaļ uz
šo lietotni. Checkout domēnam izmanto `*.myshopify.com` vai apakšdomēnu,
piem., `checkout.14d.lv`, kas Shopify adminā pievienots kā domēns.

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
