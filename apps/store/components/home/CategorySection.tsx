import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { CATEGORIES } from "@/lib/categories";
import { countProductsByCategory } from "@/lib/mock-products";

// Image-based category tiles. Compact, dense — kā jobalots.com kategoriju
// karuselis. 4 kolonnas desktop, 2 mobilajā.
export function CategorySection() {
  return (
    <section className="py-8 md:py-10">
      <Container>
        <div className="flex items-end justify-between gap-2 border-b border-neutral-200 pb-3">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900 md:text-xl">
            Kategorijas
          </h2>
          <Link
            href="/categories"
            className="text-xs font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline md:text-sm"
          >
            Visas →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const count = countProductsByCategory(c.slug);
            return (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="group relative block aspect-[3/2] overflow-hidden rounded-md bg-neutral-100"
              >
                {c.image && (
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                )}
                {/* Dark gradient + text overlay — kategorija vienmēr lasāma neatkarīgi no bildes */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
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
