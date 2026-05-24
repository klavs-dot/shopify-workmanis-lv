import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Lietošanas noteikumi",
  description: "14D vietnes un pakalpojumu lietošanas noteikumi.",
};

export default function TermsPage() {
  return (
    <Container className="py-10 md:py-16">
      <article className="prose prose-neutral max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Lietošanas noteikumi
        </h1>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Šī ir noteikumu sagataves versija. Galīgais tiesiskais teksts tiks
          publicēts pirms veikala pilnās atvēršanas.
        </div>
        <h2 className="mt-6 text-xl font-bold">1. Vispārīgi</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Šie noteikumi attiecas uz visiem 14D vietnes apmeklētājiem un
          klientiem. Lietojot vietni, lietotājs apstiprina, ka piekrīt šiem
          noteikumiem.
        </p>
        <h2 className="mt-6 text-xl font-bold">2. Preces un cenas</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Visas cenas ir norādītas eiro (EUR) ar pievienotās vērtības nodokli.
          Preces tiek piedāvātas ierobežotā daudzumā — pieejamība var mainīties
          jebkurā brīdī.
        </p>
        <h2 className="mt-6 text-xl font-bold">3. Pasūtījumi un samaksa</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Pasūtījumu apstrādi un samaksas iekasēšanu nodrošina mūsu e-komercijas
          partneris (Shopify). Detalizēta informācija — checkout posmā.
        </p>
        <h2 className="mt-6 text-xl font-bold">4. Atgriešana</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Preču atgriešana notiek saskaņā ar Latvijas Republikas Patērētāju
          tiesību aizsardzības likumu. Skatīt sadaļu{" "}
          <a href="/returns" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
            Atgriešana
          </a>
          .
        </p>
      </article>
    </Container>
  );
}
