import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Par 14D",
  description:
    "14D ir izveidots tiem, kas meklē izdevīgus piedāvājumus — atlasītas noliktavas, outlet un palešu preces vienā vietā.",
};

export default function AboutPage() {
  return (
    <Container className="py-10 md:py-16">
      <article className="prose prose-neutral max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Par 14D
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-800">
          14D ir veikals tiem, kas meklē izdevīgus piedāvājumus, bet nevēlas
          zaudēt laiku ar pārpildītām tirdziņu vietnēm. Mēs piedāvājam atlasītas
          noliktavas, outlet un palešu preces — pārbaudītas, sašķirotas un ar
          skaidru cenu.
        </p>
        <p className="mt-4 text-base leading-relaxed text-neutral-800">
          Mūsu komandai katra prece nonāk caur vairākiem soļiem: kontrole, kvalitātes
          novērtējums, fotogrāfija un detalizēts apraksts. Tikai tad tā parādās
          veikalā. Tāpēc tu vari paļauties, ka redzamais atbilst saņemtajam.
        </p>

        <h2 className="mt-8 text-xl font-bold text-neutral-900">Ko nozīmē preces stāvoklis</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-800">
          <li><strong>Jauns</strong> — prece nav lietota, oriģinālā iepakojumā.</li>
          <li><strong>Atvērts iepakojums</strong> — iepakojums atvērts, prece neskarta vai minimāli lietota.</li>
          <li><strong>Lietots</strong> — prece lietota, bet darbojas pilnvērtīgi.</li>
          <li><strong>Ar defektu</strong> — ir kāds kosmētisks vai funkcionāls trūkums, kas norādīts aprakstā.</li>
          <li><strong>Nav pārbaudīts</strong> — preces darbība nav apstiprināta.</li>
        </ul>

        <h2 className="mt-8 text-xl font-bold text-neutral-900">Kāpēc 14D?</h2>
        <p className="mt-2 text-base leading-relaxed text-neutral-800">
          Mūsu mērķis ir vienkāršs: atrast tev labus piedāvājumus pirms tie pazūd.
          Daudzas preces nāk ierobežotā daudzumā, tāpēc kvalitatīvi piedāvājumi
          pārdodas ātri. Jaunas preces pievienojam regulāri — atgriezies bieži.
        </p>
      </article>
    </Container>
  );
}
