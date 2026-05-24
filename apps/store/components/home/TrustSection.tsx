import { Container } from "@/components/ui/Container";
import { Truck, ShieldCheck, BadgePercent, Boxes } from "lucide-react";

const ITEMS = [
  {
    icon: Boxes,
    title: "Atlasītas preces",
    desc: "Katra prece tiek pārbaudīta un sašķirota, pirms nonāk veikalā.",
  },
  {
    icon: BadgePercent,
    title: "Skaidra cena",
    desc: "Bez slēptām maksām. Salīdzināmā cena rāda, cik ietaupīsi.",
  },
  {
    icon: Truck,
    title: "Ātra piegāde",
    desc: "Sūtām visā Latvijā. Detalizēta info — Piegādes lapā.",
  },
  {
    icon: ShieldCheck,
    title: "Drošs pirkums",
    desc: "Pirkumam tiek piemēroti normatīvajos aktos paredzētie tiesību akti.",
  },
];

export function TrustSection() {
  return (
    <section className="border-y border-neutral-200 bg-white py-10">
      <Container className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-neutral-900">{title}</div>
              <p className="mt-0.5 text-xs text-neutral-600">{desc}</p>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}
