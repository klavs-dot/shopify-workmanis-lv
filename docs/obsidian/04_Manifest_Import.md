# 04 — Manifest Import

> Atsevišķs no Workmanis.lv jebkura importa rīka. Šis lasa Jobalots tipa palešu manifestus.

## Workflow

1. ADMIN vai MASTER atver `/import`.
2. Ievada paletes nosaukumu, avotu (`Jobalots`), izvēlas `.xlsx` failu.
3. `parseManifestWorkbook` ([src/lib/manifest.ts](../../src/lib/manifest.ts)) izlasa darblapu `Worksheet` (vai pirmo pieejamo).
4. Tiek atpazītas kolonnas pēc aliasiem (case-insensitive).
5. Tiek izveidota `pallets/{id}` ar agregātiem.
6. Produktu rindas tiek iesistas `products` ar batched writes (max 400 / batch).
7. Katram produktam uzreiz tiek aprēķināta `suggestedPrice` un `recommendedAction` (skat [[05_Pricing_Engine]]).
8. Tiek pierakstīts `auditLogs` ieraksts ar action `manifest_imported`.
9. UI parāda summary ar Imported / Errors / Total reference.

## Atpazītās kolonnas

`COLUMN_ALIASES` definē visus iespējamos virsrakstu nosaukumus:

| Mūsu lauks         | Tipiskie virsraksti |
| ------------------ | ------------------- |
| `productSku`       | Product SKU, SKU |
| `manifestSku`      | Manifest SKU |
| `title`            | Product Title, Title, Name |
| `description`      | Product Description, Description |
| `asin`             | ASIN |
| `ean`              | EAN |
| `barcode`          | Barcode, UPC, GTIN |
| `brand`            | Brand, Manufacturer |
| `categoryName`     | Category Name, Category |
| `subCategoryName`  | Sub Category Name, Subcategory |
| `itemQty`          | Item Qty, Quantity |
| `stockQty`         | Stock Qty, Stock |
| `referencePrice`   | Reference Price, RRP, Retail Price, MSRP, Price |
| `referenceCurrency`| Reference Price Currency, Currency |

Neatpazītas kolonnas tiek saglabātas zem `raw` attiecīgajā parsed-row objektā (UI gan tās nerāda).

## Manifesta piemērs

`MF-47-ndBAUze(1).xlsx` paraugā:

- Manifest SKU: `RED19276`
- Avots: Jobalots
- Daži produkti: 170cm dog ramp, smoke detector 6-pack, jewellery box, food covers, …

Pārbaudīts, ka parser klasificē:

- Title, ASIN, EAN, Brand, Category, Reference Price korekti.
- Reference cena tiek aplikta ar coefficient → ļauj uzreiz aprēķināt suggestedPrice.

## Drošības robežas

- Failu apstrāde notiek **klienta pusē** (ArrayBuffer → SheetJS). Nekas neaizplūst uz serveri ne CDN, ne API.
- Tikai pēc parsing, klients ar lietotāja kredentiāliem raksta Firestore (saskaņā ar rules MASTER vai ADMIN).

## Iespējamas kļūdas

| Kļūda                             | Cēlonis                               | Risinājums |
| --------------------------------- | ------------------------------------- | ---------- |
| “Failā nav neviena darblapa”       | Bojāts xlsx                            | Pārlādē |
| “Darblapa Worksheet ir tukša”      | Aizsargāts vai cita lapa               | Pārkārto Excel |
| Trūkst Product Title rindā N       | Trūkst datu                            | UI parāda summary “missingData” |
| `referencePrice == 0` daudzās rindās | Nenosakāms cenas formāts             | Pārbaudīt valūtas / decimal separator |

## Nākamie soļi

Skat [[10_TODO]] – piem., duplicate-detection pēc `asin + manifestSku`, ja vajadzēs reimportēt manifestu.
