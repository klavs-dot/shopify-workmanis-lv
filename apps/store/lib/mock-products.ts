// Mock product catalogue for 14d.lv.
//
// Replace with Shopify Storefront API output once `lib/shopify.ts` is live.
// Field names here match the public Product type — they intentionally do NOT
// include any admin-only fields (purchasePrice, manifestSku, AI status, etc.).
//
// Images use picsum.photos for stable placeholders; we'll switch to real
// product photos once admin → Shopify sync lands.

import type { Product, ProductImage } from "@/types/product";

const PLACEHOLDER_SEEDS = [
  "p101",
  "p102",
  "p103",
  "p104",
  "p105",
  "p106",
  "p107",
  "p108",
];

function img(seed: string, alt: string, w = 800, h = 800): ProductImage {
  return {
    url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
    alt,
    width: w,
    height: h,
  };
}

function gallery(seed: string, alt: string): ProductImage[] {
  return [
    img(seed, alt),
    img(`${seed}-a`, `${alt} — kreisā skats`),
    img(`${seed}-b`, `${alt} — labā skats`),
    img(`${seed}-c`, `${alt} — detaļa`),
  ];
}

export const MOCK_PRODUCTS: Product[] = [
  // ELEKTRONIKA
  {
    slug: "bluetooth-austinas-sony-wh-1000xm4",
    id: "mock-1",
    title: "Bluetooth austiņas Sony WH-1000XM4",
    brand: "Sony",
    categorySlug: "elektronika",
    description:
      "Premium klases bezvadu austiņas ar aktīvu trokšņu slāpēšanu, līdz 30 stundu darbībai un atbalstu LDAC kodekam. Lieliski piemērotas darbam, ceļojumiem un ikdienai.",
    shortDescription: "Aktīva trokšņu slāpēšana, 30 h darbības laiks",
    highlights: [
      "Trokšņu slāpēšana ar Dual Noise Sensor tehnoloģiju",
      "Līdz 30 stundām bezvadu klausīšanās",
      "Skārienjūtīga vadība auss kausā",
      "Saderīga ar Sony Headphones Connect lietotni",
    ],
    price: { amount: 219.0, currency: "EUR" },
    compareAtPrice: { amount: 349.0, currency: "EUR" },
    condition: "open_box",
    availability: "in_stock",
    stockQty: 3,
    images: gallery(PLACEHOLDER_SEEDS[0], "Sony WH-1000XM4 austiņas"),
    publishedAt: "2026-05-20",
  },
  {
    slug: "viedais-pulkstenis-fitnes-tracker",
    id: "mock-2",
    title: "Viedais pulkstenis ar fitnesa funkcijām, melns",
    brand: "FitTrack",
    categorySlug: "elektronika",
    description:
      "Krāsains ekrāns, sirds ritma monitors, miega izsekošana un 14 sporta režīmi. Ūdens izturīgs (IP68).",
    shortDescription: "14 sporta režīmi, IP68 ūdens izturība",
    highlights: ["IP68 ūdens izturība", "14 sporta režīmi", "Sirdsdarbības un miega monitorings"],
    price: { amount: 39.99, currency: "EUR" },
    compareAtPrice: { amount: 79.99, currency: "EUR" },
    condition: "new",
    availability: "in_stock",
    stockQty: 12,
    images: gallery(PLACEHOLDER_SEEDS[1], "Viedais pulkstenis"),
    publishedAt: "2026-05-22",
  },

  // MĀJA UN DĀRZS
  {
    slug: "hollywood-grima-spogulis-led",
    id: "mock-3",
    title: "FENCHILIN Hollywood grima spogulis ar LED un Bluetooth, 80×58 cm",
    brand: "FENCHILIN",
    categorySlug: "maja-un-darzs",
    description:
      "Liels Holivudas stila grima spogulis ar 18 regulējamām LED lampām un 10× palielinājuma zonu. Iebūvēts Bluetooth skaļrunis ļauj klausīties mūziku, kamēr grimējies.",
    shortDescription: "18 LED, 10× palielinājums, Bluetooth skaļrunis",
    highlights: [
      "18 dimējamas LED spuldzes",
      "10× palielinājuma sekcija",
      "Iebūvēts Bluetooth skaļrunis",
      "USB lādēšanas ports",
    ],
    price: { amount: 129.0, currency: "EUR" },
    compareAtPrice: { amount: 199.0, currency: "EUR" },
    condition: "open_box",
    availability: "in_stock",
    stockQty: 2,
    images: gallery(PLACEHOLDER_SEEDS[2], "Hollywood grima spogulis"),
    publishedAt: "2026-05-15",
  },
  {
    slug: "darzs-saulez-laterna-komplekts-4",
    id: "mock-4",
    title: "Dārza saules laternu komplekts (4 gab.)",
    brand: "GardenLight",
    categorySlug: "maja-un-darzs",
    description:
      "Komplektā 4 dekoratīvas laternas ar saules baterijām. Iekļauts ēšus stiprinājuma stieņus zemē.",
    shortDescription: "Saules baterijas, automātiski iedegas vakarā",
    highlights: ["4 gab. komplekts", "Saules baterijas — bez vadiem", "Auto on/off pēc gaismas"],
    price: { amount: 24.5, currency: "EUR" },
    condition: "new",
    availability: "in_stock",
    stockQty: 18,
    images: gallery(PLACEHOLDER_SEEDS[3], "Dārza saules laternas"),
    publishedAt: "2026-05-18",
  },

  // INSTRUMENTI
  {
    slug: "akumulatora-skruvgriezis-bosch-12v",
    id: "mock-5",
    title: "Akumulatora skrūvgriezis Bosch 12V ar 2 akumulatoriem",
    brand: "Bosch",
    categorySlug: "instrumenti",
    description:
      "Kompakts un viegls 12V akumulatora skrūvgriezis ar diviem akumulatoriem un lādētāju. Iekļauts uzgalu komplekts un cietais koferis.",
    shortDescription: "12V Li-Ion, 2 akumulatori, koferis",
    highlights: ["2 akumulatori komplektā", "LED gaisma darba zonā", "Cietais koferis"],
    price: { amount: 89.0, currency: "EUR" },
    compareAtPrice: { amount: 139.0, currency: "EUR" },
    condition: "open_box",
    availability: "in_stock",
    stockQty: 5,
    images: gallery(PLACEHOLDER_SEEDS[4], "Bosch akumulatora skrūvgriezis"),
    publishedAt: "2026-05-21",
  },
  {
    slug: "rokas-instrumentu-komplekts-108-gab",
    id: "mock-6",
    title: "Rokas instrumentu komplekts, 108 gab.",
    brand: "WorkPro",
    categorySlug: "instrumenti",
    description:
      "Komplekts katras mājas pamatremontiem: atslēgas, uzgriežņatslēgas, skrūvgrieži, āmurs un mērlente.",
    shortDescription: "Viss nepieciešamais ikdienas remontiem",
    highlights: ["108 gabali", "Organizators ar cietu apvalku", "Hroma-vanadija sakausējums"],
    price: { amount: 54.99, currency: "EUR" },
    condition: "new",
    availability: "in_stock",
    stockQty: 9,
    images: gallery(PLACEHOLDER_SEEDS[5], "Rokas instrumentu komplekts"),
    publishedAt: "2026-05-17",
  },

  // SPORTS UN ATPŪTA
  {
    slug: "elektriska-skrejritenis-pilsetai",
    id: "mock-7",
    title: "Elektriskais skrejritenis 350W, melns",
    brand: "EcoRide",
    categorySlug: "sports-un-atputa",
    description:
      "Pilsētas elektroskrejritenis ar 350W motoru, līdz 25 km/h ātrumu un 30 km nobraukumu uz vienas uzlādes. Salokāms — viegli novietot mājās vai automašīnā.",
    shortDescription: "350W, 25 km/h, līdz 30 km",
    highlights: ["350W motors", "30 km nobraukums", "Salokāms rāmis", "LED priekšlukturis"],
    price: { amount: 349.0, currency: "EUR" },
    compareAtPrice: { amount: 499.0, currency: "EUR" },
    condition: "open_box",
    availability: "in_stock",
    stockQty: 4,
    images: gallery(PLACEHOLDER_SEEDS[6], "Elektriskais skrejritenis"),
    publishedAt: "2026-05-16",
  },
  {
    slug: "joga-paklajs-6mm-bordo",
    id: "mock-8",
    title: "Jogas paklājs 6 mm, neslīdošs",
    brand: "ZenMat",
    categorySlug: "sports-un-atputa",
    description: "Komfortabls 6 mm jogas paklājs ar neslīdošu virsmu un transporta jostu.",
    shortDescription: "6 mm biezs, neslīdošs, ar jostu",
    highlights: ["6 mm biezums", "Neslīdoša virsma", "Iekļauta transporta josta"],
    price: { amount: 16.9, currency: "EUR" },
    condition: "new",
    availability: "in_stock",
    stockQty: 22,
    images: gallery(PLACEHOLDER_SEEDS[7], "Jogas paklājs"),
    publishedAt: "2026-05-23",
  },

  // AUTO PRECES
  {
    slug: "auto-puteklu-suceji-12v",
    id: "mock-9",
    title: "Auto putekļu sūcējs 12V, HEPA filtrs",
    brand: "AutoVac",
    categorySlug: "auto-preces",
    description:
      "Kompakts auto putekļu sūcējs ar HEPA filtru, 5 m vada garumu un komplektā iekļautām uzgāļu sietām.",
    shortDescription: "HEPA filtrs, 5 m vads, komplekts ar uzgaļiem",
    highlights: ["HEPA filtrs", "5 m vads", "Komplekts ar 4 uzgaļiem"],
    price: { amount: 22.5, currency: "EUR" },
    condition: "new",
    availability: "in_stock",
    stockQty: 14,
    images: gallery("p109", "Auto putekļu sūcējs"),
    publishedAt: "2026-05-19",
  },
  {
    slug: "lietusvitatu-komplekts-auto-priekso-pakejos",
    id: "mock-10",
    title: "Lietusvitatu komplekts (priekšējie + pakaļējie)",
    brand: "RainBlade",
    categorySlug: "auto-preces",
    description:
      "Universāli lietussvitatu komplekti vairumam auto modeļu. Komplektā divi izmēri.",
    shortDescription: "Universāli, komplekts ar 2 izmēriem",
    highlights: ["Universāli", "Komplekts ar 2 izmēriem", "Vienkārša uzstādīšana"],
    price: { amount: 12.99, currency: "EUR" },
    condition: "new",
    availability: "in_stock",
    stockQty: 30,
    images: gallery("p110", "Lietusvitatu komplekts"),
    publishedAt: "2026-05-20",
  },

  // BĒRNU PRECES
  {
    slug: "bernu-galda-spele-aiztikt-pirmais",
    id: "mock-11",
    title: "Bērnu galda spēle 'Aiztiec pirmais!'",
    brand: "FamilyPlay",
    categorySlug: "bernu-preces",
    description:
      "Ātrās reakcijas spēle 2–6 spēlētājiem. Piemērota ģimenes vakariem.",
    shortDescription: "2–6 spēlētāji, no 6 gadu vecuma",
    highlights: ["2–6 spēlētāji", "No 6 gadu vecuma", "Spēles ilgums ~15 min"],
    price: { amount: 18.5, currency: "EUR" },
    condition: "new",
    availability: "in_stock",
    stockQty: 11,
    images: gallery("p111", "Bērnu galda spēle"),
    publishedAt: "2026-05-15",
  },
  {
    slug: "lego-tipa-konstruktors-450-gab",
    id: "mock-12",
    title: "Konstruktors 450 gabaliņi (saderīgs ar LEGO®)",
    brand: "BlockKids",
    categorySlug: "bernu-preces",
    description:
      "450 daļu konstruktoru komplekts ar instrukciju 4 dažādiem modeļiem.",
    shortDescription: "450 daļas, 4 modeļi vienā komplektā",
    highlights: ["450 daļas", "4 modeļu instrukcijas", "Saderīgs ar LEGO®"],
    price: { amount: 29.99, currency: "EUR" },
    compareAtPrice: { amount: 44.99, currency: "EUR" },
    condition: "open_box",
    availability: "in_stock",
    stockQty: 7,
    images: gallery("p112", "Konstruktors"),
    publishedAt: "2026-05-22",
  },

  // SADZĪVES TEHNIKA
  {
    slug: "kafijas-aparats-philips-3200-latte-go",
    id: "mock-13",
    title: "Kafijas automāts Philips 3200 LatteGo",
    brand: "Philips",
    categorySlug: "sadzives-tehnika",
    description:
      "Pilnībā automātisks kafijas aparāts ar LatteGo piena sistēmu. Ātri tīrāms, kompakts.",
    shortDescription: "LatteGo sistēma, 5 dzērieni vienā pieskārienā",
    highlights: ["5 dzērienu izvēle", "LatteGo piena sistēma", "Keramikas dzirnaviņas"],
    price: { amount: 449.0, currency: "EUR" },
    compareAtPrice: { amount: 649.0, currency: "EUR" },
    condition: "used",
    availability: "in_stock",
    stockQty: 1,
    images: gallery("p113", "Philips LatteGo kafijas automāts"),
    publishedAt: "2026-05-14",
  },
  {
    slug: "blenderis-1000w-stikla-kauss",
    id: "mock-14",
    title: "Blenderis 1000W ar stikla kausu",
    brand: "MixPro",
    categorySlug: "sadzives-tehnika",
    description:
      "Jaudīgs 1000W blenderis ar 1,5 L stikla kausu un 6 nažiem. Piemērots smoothie, mērcēm un ledus drupināšanai.",
    shortDescription: "1000W, 1,5 L stikla kauss, 6 nāži",
    highlights: ["1000W jauda", "1,5 L stikla kauss", "Ledus drupināšanas režīms"],
    price: { amount: 39.0, currency: "EUR" },
    condition: "new",
    availability: "in_stock",
    stockQty: 8,
    images: gallery("p114", "Blenderis 1000W"),
    publishedAt: "2026-05-19",
  },

  // CITI PIEDĀVĀJUMI
  {
    slug: "putna-bara-kaste-koka",
    id: "mock-15",
    title: "Koka putnu barotava ar jumtu",
    brand: "—",
    categorySlug: "citi-piedavajumi",
    description:
      "Dabīga koka putnu barotava ar jumtiņu un nosakuva pakaramo. Lielisks dāvanu un dārza papildinājums.",
    shortDescription: "Dabīgs koks, ar jumtu un pakaramo",
    highlights: ["Dabīgs koks", "Ar jumtu pret nokrišņiem", "Ar pakaramo"],
    price: { amount: 14.9, currency: "EUR" },
    condition: "new",
    availability: "in_stock",
    stockQty: 16,
    images: gallery("p115", "Koka putnu barotava"),
    publishedAt: "2026-05-21",
  },
  {
    slug: "ielas-radiopulkstenis-vintage",
    id: "mock-16",
    title: "Vintage stila radio modinātājs",
    brand: "RetroSound",
    categorySlug: "citi-piedavajumi",
    description:
      "Stilīgs vintage tipa radio modinātājs ar FM un AM uztvērēju, divām modinātāja laika joslām.",
    shortDescription: "FM/AM, divi modinātāja laiki",
    highlights: ["FM/AM uztvērējs", "Divas modinātāja laika joslas", "Vintage dizains"],
    price: { amount: 32.0, currency: "EUR" },
    condition: "open_box",
    availability: "reserved",
    stockQty: 1,
    images: gallery("p116", "Radio modinātājs"),
    publishedAt: "2026-05-13",
  },
];

// ---- Selection helpers ----

export function findProductBySlug(slug: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.slug === slug);
}

export function findProductsByCategory(slug: string): Product[] {
  return MOCK_PRODUCTS.filter((p) => p.categorySlug === slug);
}

export function findRelatedProducts(product: Product, limit = 4): Product[] {
  return MOCK_PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.slug !== product.slug
  ).slice(0, limit);
}

export function getFeaturedProducts(limit = 8): Product[] {
  // Sort newest first, then bias towards products with a visible discount.
  return [...MOCK_PRODUCTS]
    .sort((a, b) => {
      const aDiscount = a.compareAtPrice ? 1 : 0;
      const bDiscount = b.compareAtPrice ? 1 : 0;
      if (bDiscount !== aDiscount) return bDiscount - aDiscount;
      return b.publishedAt.localeCompare(a.publishedAt);
    })
    .slice(0, limit);
}

export function getLatestProducts(limit = 8): Product[] {
  return [...MOCK_PRODUCTS]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

export function countProductsByCategory(slug: string): number {
  return MOCK_PRODUCTS.filter((p) => p.categorySlug === slug).length;
}
