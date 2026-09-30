import { Suspense } from "react";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { getCart, isShopifyConfigured } from "@/lib/shopify";
import { maxCartQuantity } from "@/types/cart";
import type { Product } from "@/types/product";

// Produkta lapas pirkšanas poga (servera komponente). Vai prece jau ir grozā,
// nolasa Suspense robežā, lai Shopify groza pieprasījums neaizkavētu pārējo
// lapu; līdz tam poga rādās parastajā "Pievienot grozam" stāvoklī.
export function ProductPurchase({ product }: { product: Product }) {
  const orderingEnabled = isShopifyConfigured();
  const available = product.availability === "in_stock";
  const button = (inCartQuantity: number) => (
    <AddToCartButton
      variantId={product.variantId}
      orderingEnabled={orderingEnabled}
      available={available}
      inCartQuantity={inCartQuantity}
      maxQuantity={maxCartQuantity(product.stockQty)}
    />
  );

  if (!orderingEnabled || !available) return button(0);
  return (
    <Suspense fallback={button(0)}>
      <ProductPurchaseWithCart product={product} render={button} />
    </Suspense>
  );
}

async function ProductPurchaseWithCart({
  product,
  render,
}: {
  product: Product;
  render: (inCartQuantity: number) => React.ReactNode;
}) {
  const { cart } = await getCart();
  const inCart =
    cart?.items.find((i) => i.variantId === product.variantId)?.quantity ?? 0;
  return render(inCart);
}
