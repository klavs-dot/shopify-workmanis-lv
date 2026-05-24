import type { Metadata } from "next";
import Link from "next/link";
import {
  Baby,
  Car,
  Dumbbell,
  Home,
  Microwave,
  Smartphone,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Container } from "@/components/ui/Container";
import { CATEGORIES } from "@/lib/categories";
import { countProductsByCategory } from "@/lib/mock-products";

export const metadata: Metadata = {
  title: "Kategorijas",
  description:
    "Pārlūko 14D preces pa kategorijām — elektronika, instrumenti, sadzīves tehnika, sports un daudz kas cits.",
};

const ICON_MAP: Record<string, LucideIcon> = {
  Smartphone,
  Home,
  Wrench,
  Dumbbell,
  Car,
  Baby,
  Microwave,
  Sparkles,
};

export default function CategoriesPage() {
  return (
    <Container className="py-8 md:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Kategorijas
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Atrodi to, ko meklē — vai pārsteidz sevi ar negaidītu atradumu.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => {
          const Icon = c.icon ? ICON_MAP[c.icon] ?? Sparkles : Sparkles;
          const count = countProductsByCategory(c.slug);
          return (
            <Link
              key={c.slug}
              href={`/categories/${c.slug}`}
              className="group flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900 text-white transition group-hover:bg-[--color-accent]">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <div className="text-base font-semibold text-neutral-900">
                    {c.name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {count} {count === 1 ? "prece" : "preces"}
                  </div>
                </div>
              </div>
              {c.tagline && (
                <p className="text-sm text-neutral-600">{c.tagline}</p>
              )}
              <span className="mt-auto text-xs font-medium text-neutral-700 group-hover:text-neutral-900">
                Skatīt kategoriju →
              </span>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
