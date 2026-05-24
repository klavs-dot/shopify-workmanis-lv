import Link from "next/link";

import { Container } from "@/components/ui/Container";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-neutral-50 text-sm text-neutral-700">
      <Container className="grid grid-cols-1 gap-8 py-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900 text-xs font-extrabold text-white">
              14
            </span>
            <span className="text-base font-extrabold tracking-tight text-neutral-900">
              14D
            </span>
          </div>
          <p className="mt-3 text-xs text-neutral-600">
            Noliktavas, outlet un palešu preces vienā vietā. Jaunas preces
            regulāri un ierobežotā daudzumā.
          </p>
        </div>

        <FooterColumn title="Iepirkties">
          <FooterLink href="/products">Visi produkti</FooterLink>
          <FooterLink href="/categories">Kategorijas</FooterLink>
          <FooterLink href="/cart">Grozs</FooterLink>
        </FooterColumn>

        <FooterColumn title="Klientiem">
          <FooterLink href="/delivery">Piegāde</FooterLink>
          <FooterLink href="/returns">Atgriešana</FooterLink>
          <FooterLink href="/contacts">Kontakti</FooterLink>
        </FooterColumn>

        <FooterColumn title="Par mums">
          <FooterLink href="/about">Par 14D</FooterLink>
          <FooterLink href="/terms">Lietošanas noteikumi</FooterLink>
          <FooterLink href="/privacy">Privātuma politika</FooterLink>
        </FooterColumn>
      </Container>

      <div className="border-t border-neutral-200 bg-white">
        <Container className="flex flex-col items-start justify-between gap-2 py-4 text-xs text-neutral-500 md:flex-row md:items-center">
          <div>© {year} 14D. Visas tiesības aizsargātas.</div>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-neutral-700">
              Noteikumi
            </Link>
            <Link href="/privacy" className="hover:text-neutral-700">
              Privātums
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </div>
      <nav className="mt-3 flex flex-col gap-2">{children}</nav>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-neutral-700 transition hover:text-neutral-900"
    >
      {children}
    </Link>
  );
}
