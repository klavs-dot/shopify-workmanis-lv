import type { Category } from "@/types/category";

// Eight starter categories. Slugs are stable and used in URLs:
// /categories/<slug>, ?cat=<slug> on /products.
export const CATEGORIES: Category[] = [
  {
    slug: "elektronika",
    name: "Elektronika",
    tagline: "Austiņas, mājas tehnika, gadžeti",
    icon: "Smartphone",
  },
  {
    slug: "maja-un-darzs",
    name: "Māja un dārzs",
    tagline: "Mēbeles, dekori, dārza preces",
    icon: "Home",
  },
  {
    slug: "instrumenti",
    name: "Instrumenti",
    tagline: "Rokas un elektriskie darbarīki",
    icon: "Wrench",
  },
  {
    slug: "sports-un-atputa",
    name: "Sports un atpūta",
    tagline: "Aktīvai dzīvei un brīvdienām",
    icon: "Dumbbell",
  },
  {
    slug: "auto-preces",
    name: "Auto preces",
    tagline: "Auto kopšana, aksesuāri",
    icon: "Car",
  },
  {
    slug: "bernu-preces",
    name: "Bērnu preces",
    tagline: "Rotaļlietas, drošība, ikdiena",
    icon: "Baby",
  },
  {
    slug: "sadzives-tehnika",
    name: "Sadzīves tehnika",
    tagline: "Virtuves un mājas iekārtas",
    icon: "Microwave",
  },
  {
    slug: "citi-piedavajumi",
    name: "Citi piedāvājumi",
    tagline: "Viss pārējais — pārsteigumi katru nedēļu",
    icon: "Sparkles",
  },
];

export function findCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
