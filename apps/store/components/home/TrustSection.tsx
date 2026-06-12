import { Container } from "@/components/ui/Container";
import { Truck, ShieldCheck, BadgePercent } from "lucide-react";
import { cn } from "@/lib/utils";

// Single inline strip — kompakts, kā jobalots.com info-bar.
// `compact` drops the border/background for inline reuse (e.g. /products,
// where "14 dienu atteikuma tiesības" answers the main objection for
// returned/outlet goods right where the buying decision happens).
const ITEMS = [
  { icon: BadgePercent, label: "Atlaides līdz 90%" },
  { icon: Truck, label: "Piegāde visā Latvijā" },
  { icon: ShieldCheck, label: "14 dienu atteikuma tiesības" },
];

export function TrustSection({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={cn(
        compact ? "" : "border-y border-neutral-200 bg-neutral-50"
      )}
    >
      <Container
        className={cn(
          "flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-neutral-700 md:text-sm",
          compact ? "justify-start py-2 px-0 sm:px-0 lg:px-0" : "justify-center py-3"
        )}
      >
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
