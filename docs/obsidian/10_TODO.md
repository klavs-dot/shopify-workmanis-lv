# 10 — TODO

> Aktīvais darbu saraksts. Atjauno pēc katra loģiska posma.

## Augsta prioritāte (lai dabūtu produktīvo režīmā)

- [ ] Izveidot Firebase projektu `shopify-workmanis` (vai pieejamu variantu) — [[08_Deployment_Vercel_Firebase]]
- [ ] Ieslēgt Email/Password auth provider
- [ ] Izveidot Firestore (Native, `europe-west`)
- [ ] Izveidot Storage bucket
- [ ] Pievienot Web app un kopēt config uz `.env.local`
- [ ] Iegūt service-account JSON un saglabāt ārpus repo
- [ ] `npm run seed:master` lai izveidotu pirmo MASTER lietotāju
- [ ] `firebase deploy --only firestore:rules,firestore:indexes,storage`
- [x] ~~`vercel link` jaunam projektam `shopify-workmanis-lv`~~ ✅ izdarīts
- [x] ~~`vercel --prod` pirmais deploy~~ ✅ izdarīts — https://shopify-workmanis-lv.vercel.app
- [ ] `vercel env add` visiem `NEXT_PUBLIC_FIREBASE_*` un service-account-related, tad redeploy
- [ ] Pievienot `shopify.workmanis.lv` DNS uz Vercel

## Vidēja prioritāte

- [ ] Pārveidot `lib/firebase-admin.ts` lai tas atbalstītu `FIREBASE_SERVICE_ACCOUNT_JSON` (string) Vercel produkcijai
- [ ] Pievienot image upload UI produktu lapā (Storage rules jau gatavi)
- [ ] Bāzes unit testi `lib/pricing.ts` un `lib/manifest.ts`
- [ ] Duplicate detection pie importa (`asin + manifestSku`)
- [ ] Bulk approve / bulk reject UI
- [ ] Pallets statusa pārvietošana pēc apstiprināšanas (`in_approval → ready_for_shopify`)
- [ ] Eksports CSV ar approved produktiem
- [ ] Password reset e-pasta plūsma
- [ ] Drošāks audit log lasīšanas indekss

## Zema prioritāte / nākotnē

- [ ] AI enrichment integrācija — [[06_AI_Enrichment_Future]]
- [ ] Shopify Admin API publicēšana — [[07_Shopify_Integration_Future]]
- [ ] Tumšais režīms
- [ ] Tulkojumi (lv ↔ en) UI
- [ ] Notification e-pasti
- [ ] Loma `OUTSIDE_PHOTOGRAPHER` (limited storage upload)

## Tehniskie čeki, ko pielietot regulāri

- `npm run typecheck`
- `npm run build`
- `npm run lint`
- Manuāls verify [[04_Manifest_Import]] ar reālu manifestu
- Pārbaude, ka audit log raksta visas darbības
