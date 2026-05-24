import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Piegāde",
  description:
    "14D piegādā preces visā Latvijā. Detalizēti piegādes nosacījumi un izmaksas.",
};

export default function DeliveryPage() {
  return (
    <Container className="py-10 md:py-16">
      <article className="prose prose-neutral max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Piegāde
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-700">
          Mēs piegādājam preces visā Latvijā. Konkrētus piegādes nosacījumus
          un izmaksas precizēsim, tiklīdz būs zināmi gala piegādes partneri.
        </p>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Šī lapa pašlaik ir sagatavošanā. Detalizēta informācija par piegādes
          veidiem, termiņiem un izmaksām tiks pievienota tuvākajā laikā.
        </div>

        <h2 className="mt-8 text-xl font-bold text-neutral-900">Plānotie piegādes veidi</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-800">
          <li>Pakomāts — Omniva, DPD, Latvijas Pasts</li>
          <li>Kurjera piegāde — uz norādīto adresi</li>
          <li>Saņemšana noliktavā — pēc vienošanās</li>
        </ul>

        <h2 className="mt-8 text-xl font-bold text-neutral-900">Apstrādes laiks</h2>
        <p className="mt-2 text-base leading-relaxed text-neutral-800">
          Pasūtījumus parasti sagatavosim 1–2 darba dienu laikā. Lielāku vai
          smagāku preču gadījumā par konkrēto laiku informēsim individuāli.
        </p>
      </article>
    </Container>
  );
}
