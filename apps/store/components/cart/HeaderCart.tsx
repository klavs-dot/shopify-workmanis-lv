import { Suspense } from "react";

import { CartLink } from "@/components/cart/CartLink";
import { ForgetStaleCart } from "@/components/cart/ForgetStaleCart";
import { getCart, isShopifyConfigured } from "@/lib/shopify";

// Galvenes groza saite ar skaitu (servera komponente, padota <Header cart>).
// Skaits nāk no Shopify groza, tāpēc tas ielādējas Suspense robežā — pārējā
// galvene un lapa neaizkavējas. Bez Shopify (mock režīms) cookie netiek lasīts,
// un lapas paliek statiskas.
export function HeaderCart() {
  if (!isShopifyConfigured()) return <CartLink count={0} />;
  return (
    <Suspense fallback={<CartLink count={0} />}>
      <HeaderCartCount />
    </Suspense>
  );
}

async function HeaderCartCount() {
  const { cart, stale } = await getCart();
  return (
    <>
      <CartLink count={cart?.totalQuantity ?? 0} />
      {stale && <ForgetStaleCart />}
    </>
  );
}
