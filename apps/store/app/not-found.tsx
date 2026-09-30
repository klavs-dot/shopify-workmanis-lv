import type { Metadata } from "next";
import { SearchX } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Lapa nav atrasta",
  robots: { index: false, follow: false },
};

// 404 — nezināms URL, neeksistējoša prece vai kategorija. Pārdotās preces
// šeit nenonāk: to lapa paliek pieejama ar statusu "Pārdots".
export default function NotFound() {
  return (
    <Container className="py-10 md:py-16">
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
        <SearchX className="h-10 w-10 text-neutral-400" />
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            404
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-neutral-900 md:text-2xl">
            Lapa nav atrasta
          </h1>
          <p className="mt-1 max-w-sm text-sm text-neutral-600">
            Iespējams, saite ir novecojusi vai prece vairs nav katalogā.
            Apskati jaunākos piedāvājumus — tie mainās katru dienu.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <LinkButton href="/products" variant="primary">
            Skatīt produktus
          </LinkButton>
          <LinkButton href="/" variant="outline">
            Uz sākumlapu
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
