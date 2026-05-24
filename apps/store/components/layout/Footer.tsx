import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/layout/Logo";

// Minimal footer — jobalots.com stilā. 2 link grupas, copyright apakšā.
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-neutral-200 bg-white text-sm text-neutral-700">
      <Container className="grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Logo href={null} size="sm" />
          <p className="mt-3 text-xs text-neutral-600">
            Outlet, atvērtas preces un palešu atradumi par izdevīgām cenām.
          </p>
        </div>

        <FooterColumn title="Iepirkties">
          <FooterLink href="/products">Visi produkti</FooterLink>
          <FooterLink href="/categories">Kategorijas</FooterLink>
        </FooterColumn>

        <FooterColumn title="Klientiem">
          <FooterLink href="/delivery">Piegāde</FooterLink>
          <FooterLink href="/returns">Atgriešana</FooterLink>
          <FooterLink href="/contacts">Kontakti</FooterLink>
        </FooterColumn>

        <FooterColumn title="Par mums">
          <FooterLink href="/about">Par 14D</FooterLink>
          <FooterLink href="/terms">Noteikumi</FooterLink>
          <FooterLink href="/privacy">Privātums</FooterLink>
        </FooterColumn>
      </Container>

      <div className="border-t border-neutral-200">
        <Container className="py-3 text-center text-[11px] text-neutral-500">
          © {year} 14D
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
