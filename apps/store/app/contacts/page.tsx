import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Kontakti",
  description: "Sazinies ar 14D — atbalsts, jautājumi, sadarbība.",
};

export default function ContactsPage() {
  return (
    <Container className="py-10 md:py-16">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Kontakti
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Atbildes uz jautājumiem, atbalsts ar pasūtījumiem un sadarbības piedāvājumi.
        </p>
      </header>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr]">
        {/* Contact info */}
        <div className="space-y-4 text-sm">
          <ContactRow
            icon={<Mail className="h-4 w-4" />}
            label="E-pasts"
            value={
              <a
                href="mailto:info@14d.lv"
                className="font-medium text-neutral-900 underline-offset-2 hover:underline"
              >
                info@14d.lv
              </a>
            }
          />
          <ContactRow
            icon={<Phone className="h-4 w-4" />}
            label="Telefons"
            value={<span className="text-neutral-500">— precizēsim drīzumā —</span>}
          />
          <ContactRow
            icon={<MapPin className="h-4 w-4" />}
            label="Adrese"
            value={<span className="text-neutral-500">— precizēsim drīzumā —</span>}
          />
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Karte un fiziskās noliktavas adrese tiks pievienota, kad būs apstiprināta.
          </div>
        </div>

        <ContactForm />
      </div>
    </Container>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
        {icon}
      </span>
      <div>
        <div className="text-xs uppercase tracking-wider text-neutral-500">
          {label}
        </div>
        <div className="mt-0.5">{value}</div>
      </div>
    </div>
  );
}
