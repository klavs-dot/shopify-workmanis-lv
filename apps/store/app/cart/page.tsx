import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ShoppingBag } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { itemsLabel } from "@/components/cart/CartLink";
import { CartLineControls } from "@/components/cart/CartLineControls";
import { CheckoutButton } from "@/components/cart/CheckoutButton";
import { formatMoney } from "@/lib/format-money";
import { getCart, isShopifyConfigured } from "@/lib/shopify";
import type { CartItem } from "@/types/cart";

export const metadata: Metadata = {
  title: "Grozs",
  description: "Tavu izvēlēto preču grozs.",
  robots: { index: false, follow: false },
};

// Grozs — Shopify Storefront cart, kura id glabājas httpOnly cookie
// "14d_cart". Lapa renderējas katram pieprasījumam (lasa cookie); izmaiņas
// veic server actions (app/cart/actions.ts), apmaksa notiek Shopify checkout.
// Bez Shopify (mock dati) pasūtīšana ir izslēgta un lapa to pasaka. Novecojušu
// groza cookie izmet galvenes <HeaderCart /> (tā ir arī šajā lapā).
export default async function CartPage() {
  const orderingEnabled = isShopifyConfigured();
  const { cart, unavailable } = await getCart();
  const items = cart?.items ?? [];
  const hasUnavailable = items.some((i) => !i.available);

  return (
    <Container className="py-10 md:py-16">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Grozs
        </h1>
        {orderingEnabled && (
          <p className="mt-1 text-sm text-neutral-600">
            {cart && items.length > 0
              ? `Grozā ir ${itemsLabel(cart.totalQuantity)}.`
              : "Pievieno preces no kataloga, lai redzētu tās šeit."}
          </p>
        )}
      </header>

      {!orderingEnabled ? (
        <CartNotice
          icon={<ShoppingBag className="h-10 w-10 text-neutral-400" />}
          title="Pasūtīšana tiešsaistē būs pieejama drīzumā"
          text="Šobrīd katalogs darbojas priekšskatījuma režīmā. Grozu un drošu apmaksu ieslēgsim, tiklīdz veikals būs atvērts."
        />
      ) : unavailable ? (
        <CartNotice
          icon={<AlertTriangle className="h-10 w-10 text-amber-500" />}
          title="Grozu šobrīd neizdevās ielādēt"
          text="Tavas preces grozā nav pazudušas. Lūdzu, mēģini vēlreiz pēc brīža."
          action={
            <LinkButton href="/cart" variant="primary">
              Mēģināt vēlreiz
            </LinkButton>
          }
        />
      ) : !cart || items.length === 0 ? (
        <CartNotice
          icon={<ShoppingBag className="h-10 w-10 text-neutral-400" />}
          title="Tavs grozs vēl ir tukšs"
          text="Pārlūko jaunākos piedāvājumus un pievieno preces grozam — pirkumu pabeigsi drošā Shopify checkout vidē."
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
          <section aria-label="Preces grozā">
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
              {items.map((item) => (
                <CartLine key={item.lineId} item={item} />
              ))}
            </ul>
            <Link
              href="/products"
              className="mt-4 inline-block text-sm font-medium text-neutral-700 underline-offset-2 hover:text-neutral-900 hover:underline"
            >
              ← Turpināt iepirkties
            </Link>
          </section>

          <aside className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Kopsavilkums
            </h2>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <span className="text-sm text-neutral-700">Starpsumma</span>
              <span className="tabular text-xl font-extrabold text-neutral-900">
                {formatMoney(cart.subtotal)}
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-600">
              Piegādes veidu un tās izmaksas izvēlēsies apmaksas solī.
            </p>

            {hasUnavailable && (
              <p role="alert" className="mt-3 text-xs font-medium text-red-700">
                Grozā ir preces, kas vairs nav pieejamas — noņem tās, lai
                turpinātu.
              </p>
            )}
            {/* key: groza izmaiņas notīra iepriekšējo checkout kļūdu */}
            <CheckoutButton
              key={items.map((i) => `${i.lineId}:${i.quantity}:${i.available}`).join()}
              disabled={hasUnavailable}
            />
            <p className="mt-3 text-center text-[11px] text-neutral-500">
              Apmaksa notiek drošā Shopify checkout vidē.
            </p>
          </aside>
        </div>
      )}
    </Container>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const href = `/products/${item.productSlug}`;
  return (
    <li className="flex gap-4 py-4">
      <Link
        href={href}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 sm:h-24 sm:w-24"
      >
        {item.productImage && (
          <Image
            src={item.productImage.url}
            alt={item.productImage.alt}
            fill
            sizes="96px"
            className={item.available ? "object-cover" : "object-cover grayscale"}
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={href}
              className="line-clamp-2 text-sm font-medium text-neutral-900 hover:underline"
            >
              {item.productTitle}
            </Link>
            {item.variantTitle && (
              <div className="mt-0.5 text-xs text-neutral-500">{item.variantTitle}</div>
            )}
            {item.quantity > 1 && (
              <div className="tabular mt-0.5 text-xs text-neutral-500">
                {formatMoney(item.unitPrice)} / gab.
              </div>
            )}
          </div>
          <span className="tabular shrink-0 text-sm font-bold text-neutral-900">
            {formatMoney(item.lineTotal)}
          </span>
        </div>

        {!item.available && (
          <div className="mt-1 text-xs font-medium text-red-700">
            Pārdots — šī prece vairs nav pieejama.
          </div>
        )}

        <CartLineControls
          lineId={item.lineId}
          title={item.productTitle}
          quantity={item.quantity}
          maxQuantity={item.available ? item.maxQuantity : 0}
        />
      </div>
    </li>
  );
}

function CartNotice({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
      {icon}
      <div>
        <div className="text-base font-semibold text-neutral-900">{title}</div>
        <p className="mt-1 max-w-sm text-sm text-neutral-600">{text}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {action}
        <LinkButton href="/products" variant={action ? "outline" : "primary"}>
          Skatīt produktus
        </LinkButton>
        <LinkButton href="/categories" variant="outline">
          Pārlūkot kategorijas
        </LinkButton>
      </div>
    </div>
  );
}
