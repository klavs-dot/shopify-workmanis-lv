import { Container } from "@/components/ui/Container";
import { Truck, ShieldCheck, BadgePercent } from "lucide-react";

// Single inline strip — kompakts, kā jobalots.com footer info-bar
const ITEMS = [
  { icon: BadgePercent, label: "Atlaides līdz 90%" },
  { icon: Truck, label: "Piegāde visā Latvijā" },
  { icon: ShieldCheck, label: "14 dienu atteikuma tiesības" },
];

export function TrustSection() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50">
      <Container className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-3 text-xs text-neutral-700 md:text-sm">
        {ITEMS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-neutral-500" />
            <span>{label}</span>
          </div>
        ))}
      </Container>
    </section>
  );
}
