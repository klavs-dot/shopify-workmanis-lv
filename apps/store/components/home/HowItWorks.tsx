import { Container } from "@/components/ui/Container";

const STEPS = [
  {
    n: "1",
    title: "Pārlūko",
    desc: "Jaunas preces katru nedēļu. Pārskati piedāvājumus pa kategorijām vai meklē tieši to, ko vēlies.",
  },
  {
    n: "2",
    title: "Izvēlies",
    desc: "Katras preces lapā redzi tās stāvokli, pieejamību un skaidru cenu — bez slēptām maksām.",
  },
  {
    n: "3",
    title: "Iegādājies",
    desc: "Pievieno grozam un pabeidz pirkumu drošā Shopify checkout vidē. Tālāk — ātra piegāde.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-neutral-900 py-12 text-white md:py-16">
      <Container>
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Kā tas strādā
          </h2>
          <p className="mt-2 text-sm text-neutral-300 md:text-base">
            Vienkārša, caurspīdīga pieredze no pārlūkošanas līdz piegādei.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-5"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[--color-accent] text-sm font-bold text-white">
                {s.n}
              </div>
              <div className="mt-3 text-base font-semibold">{s.title}</div>
              <p className="mt-1 text-sm text-neutral-300">{s.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
