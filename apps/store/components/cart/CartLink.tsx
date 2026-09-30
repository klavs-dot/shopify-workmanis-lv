import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";

/** "1 prece", "2 preces", "21 prece". */
export function itemsLabel(count: number): string {
  return `${count} ${count % 10 === 1 && count % 100 !== 11 ? "prece" : "preces"}`;
}

// Groza ikona galvenē ar preču skaitu. Tīri prezentācijas komponents: skaitu
// nolasa servera komponente <HeaderCart /> (httpOnly cookie → Shopify), un
// gatavo saiti galvenei (klienta komponentei) padod kā prop.
export function CartLink({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      aria-label={
        count > 0 ? `Iepirkumu grozs, ${itemsLabel(count)}` : "Iepirkumu grozs"
      }
      className={cn(
        "ml-auto inline-flex items-center gap-1.5 rounded-md p-2 text-neutral-700 hover:bg-neutral-100 md:ml-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      )}
    >
      <span className={cn("relative", count > 0 && "mr-1")}>
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span
            aria-hidden
            className="tabular absolute -right-2 -top-2 min-w-[1.125rem] rounded-full bg-neutral-900 px-1 text-center text-[10px] font-bold leading-[1.125rem] text-white"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      <span className="hidden text-sm font-medium md:inline">Grozs</span>
    </Link>
  );
}
