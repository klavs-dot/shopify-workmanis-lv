"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname() ?? "/";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <Container className="flex h-14 items-center gap-3 md:h-16">
        {/* Mobile menu trigger */}
        <button
          type="button"
          aria-label="Atvērt izvēlni"
          onClick={() => setMobileOpen(true)}
          className={cn(
            "rounded-md p-2 text-neutral-700 hover:bg-neutral-100 md:hidden",
            FOCUS_RING
          )}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand */}
        <Logo size="md" />

        {/* Desktop nav with active underline */}
        <nav className="ml-6 hidden gap-6 md:flex" aria-label="Galvenā navigācija">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={cn(
                "relative rounded-sm text-sm font-medium transition-colors",
                FOCUS_RING,
                isActive(l.href)
                  ? "text-neutral-900 after:absolute after:inset-x-0 after:-bottom-[17px] after:h-0.5 after:bg-neutral-900 md:after:-bottom-[21px]"
                  : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Search — muted-input pattern so it reads as a field */}
        <Link
          href="/products"
          className={cn(
            "ml-auto hidden w-52 items-center gap-2 rounded-full bg-neutral-100 px-3.5 py-2 text-xs text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-neutral-700 md:flex lg:w-64",
            FOCUS_RING
          )}
        >
          <Search className="h-3.5 w-3.5" />
          Meklēt preces…
        </Link>

        {/* Cart */}
        <Link
          href="/cart"
          aria-label="Iepirkumu grozs"
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-md p-2 text-neutral-700 hover:bg-neutral-100 md:ml-2",
            FOCUS_RING
          )}
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
            className={cn("rounded-md p-2 hover:bg-neutral-100", FOCUS_RING)}
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
              className={cn(
                "rounded-md px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100",
                FOCUS_RING
              )}
            >
              {l.label}
            </Link>
          ))}
          <div className="my-2 border-t border-neutral-100" />
          <Link
            href="/about"
            onClick={onClose}
            className={cn(
              "rounded-md px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100",
              FOCUS_RING
            )}
          >
            Par 14D
          </Link>
          <Link
            href="/returns"
            onClick={onClose}
            className={cn(
              "rounded-md px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100",
              FOCUS_RING
            )}
          >
            Atgriešana
          </Link>
        </nav>
      </aside>
    </>
  );
}
