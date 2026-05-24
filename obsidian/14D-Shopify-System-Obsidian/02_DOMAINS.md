# 02 — Domēni

> Divi atsevišķi domēni, divas atsevišķas aplikācijas, viens kopējs repo.

## shopify.workmanis.lv

**Tips:** internal admin tool (darbinieku sistēma)

**Mape:** šobrīd repo root (`src/`, `app/`); nākotnē `apps/admin/`

**Deployment:**
- Vercel projekts: `shopify-workmanis-lv`
- DNS: `shopify-workmanis-lv.vercel.app` + plānots `shopify.workmanis.lv` custom domain
- Production branch: `main`

**Drīkst rādīt:**
- Visu admin UI (login, dashboards, manifesti, AI dati, audit log)
- Iekšējās cenas (purchasePrice, finalPrice draft)
- Visu Firestore datu plūsmu
- Lietotāju vadību

**Nedrīkst rādīt:**
- Publiskās e-veikala lapas (sākumlapa, produktu katalogs no klienta skata)
- Anonīmiem apmeklētājiem nekas — viss aiz auth + role gates

## 14d.lv

**Tips:** public customer-facing storefront

**Mape:** `apps/store/`

**Deployment:**
- Vercel projekts: vēl nav izveidots (TODO)
- DNS: `14d.lv` + `www.14d.lv` → Vercel (vēl nav konfigurēts)
- Production branch: `main` (root direktorija Vercelī = `apps/store/`)

**Drīkst rādīt:**
- Produktus, kuri ir publicēti caur Shopify (`availableForSale: true`)
- Publicējamos cenu datus (gala cena + salīdzināmā cena)
- Pārdošanas marketingu (akcijas, bestselleri, kategorijas)
- Statiskās lapas (Par mums, Piegāde, Kontakti, Noteikumi, Privātums, Atgriešana)
- Grozs un Shopify checkout (kad būs integrācija)

**Nedrīkst rādīt:**
- Importētus / draft / AI Generated / Needs Review / Rejected / Archived produktus
- Iekšējās piezīmes vai darbinieku komentārus
- Iepirkuma cenu vai jebkādas iekšējās izmaksas
- Manifestu faila datus vai jēlos AI tulkojumus
- Nekādu Firebase Auth datu, Firestore admin collection saturu
- Darbinieku saraksts, statistika, audit log

## Tehniskā robežu kontrole

| Slānis | Kā tiek nodrošināts |
|---|---|
| **Kods** | `apps/store/` nedrīkst importēt no `apps/admin/` (vai šobrīd no `src/`). ESLint kārtulu vēlāk var pievienot, ja vajag. |
| **API** | Store lieto tikai Shopify Storefront API (publisks read-only). Admin API tokens nekad nav `apps/store/` env. |
| **Shopify** | Tikai produktiem ar `availableForSale: true` parādās klientiem. Admin push kontrolē šo flag. |
| **Firestore** | `apps/store/` neimportē `firebase-admin` vai client SDK. Visi dati nāk no Shopify. |
| **ENV** | `apps/store/.env.local` satur tikai `NEXT_PUBLIC_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`. `SHOPIFY_ADMIN_API_TOKEN` paliek admin. |

## Subdomain alternatīvas (nākotnei)

Ja vēlāk vajadzēs, store var papildināt ar:
- `lt.14d.lv` — lietuviešu lokalizācija
- `ee.14d.lv` — igauņu lokalizācija
- `staging.14d.lv` — staging Vercel preview

Admin ir tikai vienā vietā (`shopify.workmanis.lv`), bez lokalizācijām — UI ir latviski.

## Saistītās piezīmes

- [[00_PROJECT_OVERVIEW]]
- [[05_PRODUCT_WORKFLOW]]
- [[09_DECISIONS]]
