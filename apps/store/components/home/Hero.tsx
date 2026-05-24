import Link from "next/link";

import { Container } from "@/components/ui/Container";

// Hero — vienkāršs banner jobalots.com stilā:
// melnais bloks ar īsu virsrakstu, 1 CTA, atlaides info. Bez photo collage,
// bez "katras nedēļas" pill, bez papildu marketing dekorācijām.
export function Hero() {
  return (
    <section className="bg-neutral-900 text-white">
      <Container className="flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between md:py-14">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
            Outlet, atvērtas preces un palešu atradumi
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-300 md:text-base">
            Atlaides līdz <span className="font-semibold text-white">90%</span>{" "}
            no oriģinālās cenas. Ierobežots daudzums — paspēj pirms pazūd.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products"
            className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
          >
            Skatīt produktus
          </Link>
          <Link
            href="/categories"
            className="rounded-md border border-neutral-700 px-5 py-2.5 text-sm font-medium text-white transition hover:border-neutral-500"
          >
            Kategorijas
          </Link>
        </div>
      </Container>
    </section>
  );
}
