import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Privātuma politika",
  description: "14D privātuma politika un personas datu apstrādes principi.",
};

export default function PrivacyPage() {
  return (
    <Container className="py-10 md:py-16">
      <article className="prose prose-neutral max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Privātuma politika
        </h1>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Šī ir privātuma politikas sagataves versija. Galīgais teksts tiks
          publicēts pirms veikala pilnās atvēršanas.
        </div>

        <h2 className="mt-6 text-xl font-bold">Personas dati, ko apstrādājam</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>Vārds, uzvārds — pasūtījuma noformēšanai un piegādei.</li>
          <li>E-pasta adrese — pasūtījumu apstiprinājumiem un saziņai.</li>
          <li>Telefona numurs — piegādes koordinēšanai.</li>
          <li>Piegādes adrese.</li>
          <li>Maksājumu informācija — apstrādā mūsu e-komercijas partneris (Shopify), mēs to neglabājam.</li>
        </ul>

        <h2 className="mt-6 text-xl font-bold">Datu apstrādes mērķis</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Apstrādājam personas datus tikai tādā apjomā, kāds ir nepieciešams
          pasūtījuma izpildei un mūsu juridisko pienākumu ievērošanai.
        </p>

        <h2 className="mt-6 text-xl font-bold">Datu glabāšanas termiņš</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Datus glabājam tik ilgi, cik to prasa normatīvie akti, vai tik ilgi,
          cik tas nepieciešams konkrētā mērķa sasniegšanai.
        </p>

        <h2 className="mt-6 text-xl font-bold">Tavas tiesības</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Tev ir tiesības pieprasīt informāciju par mūsu rīcībā esošajiem
          datiem, prasīt to labošanu vai dzēšanu. Sazinies ar mums:{" "}
          <a href="mailto:info@14d.lv" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
            info@14d.lv
          </a>
          .
        </p>
      </article>
    </Container>
  );
}
