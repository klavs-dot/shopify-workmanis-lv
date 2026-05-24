import type { Category } from "@/types/category";

// Eight starter categories. Slugs are stable and used in URLs:
// /categories/<slug>, ?cat=<slug> on /products.
// Image — placeholder no picsum.photos ar stabilu seed; tiks aizvietots ar
// reālām produktu kolāžām, kad Shopify integrācija saglabās category covers.
export const CATEGORIES: Category[] = [
  {
    slug: "elektronika",
    name: "Elektronika",
    tagline: "Austiņas, mājas tehnika, gadžeti",
    image: "https://picsum.photos/seed/cat-elektronika/600/400",
  },
  {
    slug: "maja-un-darzs",
    name: "Māja un dārzs",
    tagline: "Mēbeles, dekori, dārza preces",
    image: "https://picsum.photos/seed/cat-maja/600/400",
  },
  {
    slug: "instrumenti",
    name: "Instrumenti",
    tagline: "Rokas un elektriskie darbarīki",
    image: "https://picsum.photos/seed/cat-instrumenti/600/400",
  },
  {
    slug: "sports-un-atputa",
    name: "Sports un atpūta",
    tagline: "Aktīvai dzīvei un brīvdienām",
    image: "https://picsum.photos/seed/cat-sports/600/400",
  },
  {
    slug: "auto-preces",
    name: "Auto preces",
    tagline: "Auto kopšana, aksesuāri",
    image: "https://picsum.photos/seed/cat-auto/600/400",
  },
  {
    slug: "bernu-preces",
    name: "Bērnu preces",
    tagline: "Rotaļlietas, drošība, ikdiena",
    image: "https://picsum.photos/seed/cat-berni/600/400",
  },
  {
    slug: "sadzives-tehnika",
    name: "Sadzīves tehnika",
    tagline: "Virtuves un mājas iekārtas",
    image: "https://picsum.photos/seed/cat-tehnika/600/400",
  },
  {
    slug: "citi-piedavajumi",
    name: "Citi piedāvājumi",
    tagline: "Viss pārējais",
    image: "https://picsum.photos/seed/cat-citi/600/400",
  },
];

export function findCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
