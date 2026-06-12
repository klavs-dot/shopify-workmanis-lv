import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CATEGORIES } from "@/lib/categories";
import { countProductsByCategory } from "@/lib/mock-products";

// Image-based category tiles. Compact, dense — kā jobalots.com kategoriju
// karuselis. 4 kolonnas desktop, 2 mobilajā.
export function CategorySection() {
  return (
    <section className="py-8 md:py-12">
      <Container>
        <SectionHeader title="Kategorijas" href="/categories" linkLabel="Visas" />

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const count = countProductsByCategory(c.slug);
            return (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="group relative block aspect-[3/2] overflow-hidden rounded-md bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                {c.image && (
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                )}
                {/* Smooth bottom-up gradient — explicit via stop avoids the
                 *  harsh band between dark and clear. */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 via-40% to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="text-sm font-semibold text-white md:text-base">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-white/85">
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
