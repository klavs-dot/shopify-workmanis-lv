import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Atgriešana",
  description:
    "14D preču atgriešanas nosacījumi saskaņā ar Patērētāju tiesību aizsardzības likumu.",
};

export default function ReturnsPage() {
  return (
    <Container className="py-10 md:py-16">
      <article className="prose prose-neutral max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Atgriešana
        </h1>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Šī ir atgriešanas nosacījumu sagataves versija. Galīgais teksts tiks
          publicēts pirms veikala pilnās atvēršanas.
        </div>

        <h2 className="mt-6 text-xl font-bold">14 dienu atteikuma tiesības</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Patērētājam ir tiesības atteikties no preces 14 dienu laikā no preces
          saņemšanas brīža, saskaņā ar Patērētāju tiesību aizsardzības likumu.
        </p>

        <h2 className="mt-6 text-xl font-bold">Kā atgriezt preci</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-neutral-700">
          <li>
            Sazinies ar mums, rakstot uz{" "}
            <a href="mailto:info@14d.lv" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
              info@14d.lv
            </a>{" "}
            ar pasūtījuma numuru.
          </li>
          <li>Mēs nosūtīsim atteikuma veidlapu un atgriešanas norādījumus.</li>
          <li>Iesūti preci atpakaļ oriģinālajā iepakojumā (ja iespējams).</li>
          <li>
            Pēc preces saņemšanas un pārbaudes atgriezīsim samaksu 14 dienu
            laikā uz to pašu maksājuma instrumentu, ar ko veikta samaksa.
          </li>
        </ol>

        <h2 className="mt-6 text-xl font-bold">Atgriešanas izņēmumi</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Atteikuma tiesības neattiecas uz precēm, kuras pēc piegādes to īpašību
          dēļ ir neatgriezeniski sajauktas vai nav atdalāmas. Konkrēti gadījumi
          tiks norādīti preces aprakstā.
        </p>
      </article>
    </Container>
  );
}
