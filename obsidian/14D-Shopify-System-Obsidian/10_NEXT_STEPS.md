# 10 — Nākamie soļi

> Konkrēti TODO ar prioritāti, lai 14D Shopify sistēma būtu pilnvērtīga.

## 🔥 Augstākā prioritāte — 14d.lv MVP

- [ ] **Shopify Partner konts + Storefront API token** — bez šī viss tālāk uz pauzes
- [ ] **Aizvietot mock data ar Storefront API** (apps/store/lib/shopify.ts)
- [ ] **Cart state ar LocalStorage persistence** — pievienot React context
- [ ] **Shopify cartCreate mutation + checkoutUrl redirect**
- [ ] **Reālas produktu bildes** (no Shopify CDN, nevis picsum)
- [ ] **Reālas kategoriju bildes** — šobrīd picsum.photos placeholderi
- [ ] **DNS — 14d.lv → Vercel** + Shopify Admin permitted domain
- [ ] **SEO sitemap.xml + robots.txt**
- [ ] **OG image** — atsevišķs `/og.png` māksla, lai social shares izskatās labi
- [ ] **Reāls hero video** — šobrīd ir 1 video, varbūt rotēt 2-3 dažādus

## ✅ Pabeigts (2026-05-24/25)

### apps/store skeleton
- [x] Next.js 15 + Tailwind v4 setup (`apps/store/`)
- [x] Types, mock-products (16), kategorijas (8)
- [x] Layout: Header, Footer, mobile drawer
- [x] Sākumlapa, /products katalogs, /products/[slug], /categories + /[slug], /cart placeholder
- [x] Statiskās lapas: /about, /delivery, /contacts, /terms, /privacy, /returns
- [x] SEO metadata + OpenGraph
- [x] Shopify Storefront API placeholder klients

### Dizains uzlabojumi
- [x] Jobalots-stila vienkāršs dizains (vairs nav marketing fluff)
- [x] Mock atlaides 50-90% range
- [x] Sarkanais −X% badge + dzeltenais "Apskati piezīmes!" badge
- [x] customerNote lauks Product tipā + dzeltens warning panel produkta lapā
- [x] Hero video bg + Messenger chat ar 3 Q&A pāriem
- [x] Typing indicator 1s + word-by-word reveal (80ms/word)
- [x] Pop skaņa ar Web Audio API
- [x] Jauns 14D.lv logo ar peeking kasti (4.5s cikls)

## 🟠 Augsta prioritāte — Admin → Shopify push

- [ ] **`apps/admin POST /api/shopify/push-product`** — Admin API integrācija
- [ ] **Bulk publish UI** Šķirotavā (atļauj atlasīt N produktus un publicēt)
- [ ] **Shopify OAuth + token vault** (Master saglabā credentials encrypted)
- [ ] **Webhook receiver `orders/create`** — atjauno produktu `listingStatus = sold`
- [ ] **Webhook receiver `orders/paid`** — apstiprina maksājumu
- [ ] **Inventory sync** — kad krājums Shopify mainās, atjauno admin

## 🟡 Vidēja prioritāte — apps/store kvalitāte

- [ ] **Reāla meklēšana** (Shopify predictive search vai Algolia)
- [ ] **Pagination** /products lapā (kad ir > 100 produktu)
- [ ] **URL search params** — filtri pārvar reload (`?cat=elektronika&max=100`)
- [ ] **Saraksta/režģa skats** /products (toggle)
- [ ] **Variantu atbalsts** produkta lapā (izmērs, krāsa)
- [ ] **Newsletter signup** (Mailchimp vai self-hosted)
- [ ] **Cookie banner** + GDPR (kad ir reālā analītika)

## 🟢 Vidēja prioritāte — admin uzlabojumi

- [ ] **Migrēt admin uz `apps/admin/`** (skat [[09_DECISIONS]] migrācijas plānu)
- [ ] **Backfill veciem produktiem** — enrichedTitle LV (šobrīd EN) un descriptionRu (šobrīd null)
- [ ] **Bonusu likmes konfigurācija** Iestatījumos (10% hardcoded)
- [ ] **Re-assign palete** UI Loģistikā vai Šķirotavā

## 🔵 Zema prioritāte — nākotne

- [ ] **Multi-language storefront** (LV / EN / RU / LT / EE)
- [ ] **Shopify Markets** multi-currency (kad būs nepieciešams)
- [ ] **Wishlist** (saglabāt produktus saglabājumus)
- [ ] **Klientu konti** (history, addresses, reorder)
- [ ] **PWA + offline support**
- [ ] **Performance budget** Lighthouse 95+ visās lapās
- [ ] **A/B testing** sākumlapas hero versijām (kad būs Google Analytics)

## 🧹 Iekšējie sakopšanas darbi

- [ ] **Turborepo setup** (kad būs pirmais koplietojamais pakete `packages/shared/`)
- [ ] **Apvienot tipus** starp admin un store (Product struktūra ir līdzīga)
- [ ] **ESLint kārtula** — `apps/store` nedrīkst importēt no `apps/admin`
- [ ] **Pre-commit hook** typecheck + lint

## Saistītās piezīmes

- [[00_PROJECT_OVERVIEW]]
- [[05_PRODUCT_WORKFLOW]]
- [[06_SHOPIFY_INTEGRATION]]
- [[09_DECISIONS]]
