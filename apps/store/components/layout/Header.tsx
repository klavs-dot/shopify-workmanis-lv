"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search, ShoppingCart, X } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/products", label: "Produkti" },
  { href: "/categories", label: "Kategorijas" },
  { href: "/delivery", label: "Piegāde" },
  { href: "/contacts", label: "Kontakti" },
] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <Container className="flex h-14 items-center gap-3 md:h-16">
        {/* Mobile menu trigger */}
        <button
          type="button"
          aria-label="Atvērt izvēlni"
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand */}
        <Logo size="md" />

        {/* Desktop nav */}
        <nav className="ml-6 hidden gap-6 md:flex" aria-label="Galvenā navigācija">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-neutral-700 transition hover:text-neutral-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Search hint (visual only — real search lives on /products) */}
        <Link
          href="/products"
          className="ml-auto hidden items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 md:flex"
        >
          <Search className="h-3.5 w-3.5" />
          Meklēt preces…
        </Link>

        {/* Cart */}
        <Link
          href="/cart"
          aria-label="Iepirkumu grozs"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md p-2 text-neutral-700 hover:bg-neutral-100 md:ml-2"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="hidden text-sm font-medium md:inline">Grozs</span>
        </Link>
      </Container>

      {/* Mobile drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}

function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <Logo size="sm" />
          <button
            type="button"
            aria-label="Aizvērt"
            onClick={onClose}
            className="rounded-md p-2 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col p-2" aria-label="Mobile navigācija">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
            >
              {l.label}
            </Link>
          ))}
          <div className="my-2 border-t border-neutral-100" />
          <Link
            href="/about"
            onClick={onClose}
            className="rounded-md px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Par 14D
          </Link>
          <Link
            href="/returns"
            onClick={onClose}
            className="rounded-md px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Atgriešana
          </Link>
        </nav>
      </aside>
    </>
  );
}
