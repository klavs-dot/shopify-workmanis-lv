# 00 — Project Overview

> **Šis projekts NAV Workmanis.lv.**
> Tas ir atsevišķs Shopify / palešu noliktavas projekts, kas tikai izmanto subdomēnu `shopify.workmanis.lv`.
> Nedalies ar Workmanis.lv kodu, Firebase projektu, Vercel projektu, GitHub repo vai Obsidian vault.

## Kas tas ir

`shopify.workmanis.lv` ir AI palīdzēts noliktavas un manifestu apstrādes rīks palešu / liquidation / return / outlet biznesam.

Mēs pērkam paletes, kurām ir manifests ar produktu sarakstu. Šī sistēma:

1. **Importē Excel manifestu** (Jobalots tipa formāts).
2. **Izveido paleti** ar agregētiem rādītājiem.
3. **Izveido produktu rindas** Firestore datubāzē.
4. **Aprēķina cenas** ar pricing engine (kondicionēšanas koeficienti + .99 noapaļošana).
5. **Ļauj noliktavas darbiniekam pārbaudīt** preces, atzīmēt missing / damaged / tested, pievienot bildes.
6. **Apstiprina vai noraida** produktus (approval / bundle / outlet).
7. **Vēlāk** — publicēs Shopify veikalā caur Shopify Admin API.

## Kāpēc atsevišķs no Workmanis.lv

- Cits biznesa modelis (palešu pārdošana vs amatnieku platforma).
- Cita datubāzes struktūra (pallets / products / audit log vs darbi / piedāvājumi).
- Cita lietotāju bāze (noliktavas darbinieki + admin vs gala patērētāji).
- Citas drošības un access rules.
- Drošības un izolācijas dēļ — bug šajā projektā nedrīkst aizdot Workmanis.lv klientu datus.

## Vienīgais kopīgais

Tikai DNS — `shopify.workmanis.lv` ir subdomēns, kas norādīs uz šo Vercel projektu. Viss pārējais (Firebase, GitHub, Vercel, Obsidian) ir 100% atsevišķs.

## Saistītās piezīmes

- [[01_Tech_Stack]]
- [[02_Database_Structure]]
- [[03_Authentication_And_Roles]]
- [[04_Manifest_Import]]
- [[05_Pricing_Engine]]
- [[06_AI_Enrichment]]
- [[07_Shopify_Integration_Future]]
- [[08_Deployment_Vercel_Firebase]]
- [[09_Development_Log]]
- [[10_TODO]]
