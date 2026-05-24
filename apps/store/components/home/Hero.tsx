import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="border-b border-neutral-200 bg-gradient-to-b from-neutral-50 to-white">
      <Container className="grid items-center gap-8 py-12 md:grid-cols-[1.2fr_1fr] md:py-20">
        <div>
          <div className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-orange-700 ring-1 ring-orange-200">
            Jaunas preces katru nedēļu
          </div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-neutral-900 md:text-5xl">
            Gudri atrasti piedāvājumi.
            <br />
            <span className="text-[--color-accent]">Ierobežotā daudzumā.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-neutral-600 md:text-lg">
            Atlasītas noliktavas, outlet un palešu preces vienā vietā. Skaidra
            cena, ātra iegāde — atrodi izdevīgus pirkumus, pirms tie pazūd.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/products" size="lg" variant="primary">
              Skatīt visus produktus
            </LinkButton>
            <LinkButton href="/categories" size="lg" variant="outline">
              Pārlūkot kategorijas
            </LinkButton>
          </div>
        </div>

        {/* Visual block — keeps the hero balanced without needing a marketing
         *  shoot. Replace with a real product collage later. */}
        <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm md:block">
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1 p-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-md bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://picsum.photos/seed/hero-${i}/400/300)`,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-white/95 px-4 py-3 backdrop-blur">
            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-500">
                Nedēļas izlase
              </div>
              <div className="text-sm font-semibold text-neutral-900">
                Vairāk nekā 100 jaunu preču
              </div>
            </div>
            <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Live
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
