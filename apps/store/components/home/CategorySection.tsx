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

export function CategorySection() {
  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              Kategorijas
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Atrodi to, ko meklē — vai pārsteidz sevi ar negaidītu atradumu.
            </p>
          </div>
          <Link
            href="/categories"
            className="text-sm font-medium text-neutral-700 underline-offset-2 hover:text-neutral-900 hover:underline"
          >
            Visas kategorijas →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const Icon = c.icon ? ICON_MAP[c.icon] ?? Sparkles : Sparkles;
            const count = countProductsByCategory(c.slug);
            return (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white transition group-hover:bg-[--color-accent]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-neutral-900">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {count} {count === 1 ? "prece" : "preces"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
