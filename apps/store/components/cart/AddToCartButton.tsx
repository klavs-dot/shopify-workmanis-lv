"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Check, Loader2, ShoppingCart } from "lucide-react";

import { addToCart, type CartActionState } from "@/app/cart/actions";
import { cn } from "@/lib/utils";

const INITIAL_STATE: CartActionState = { status: "idle" };

const BUTTON_CLASSES =
  "inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

// "Pievienot grozam" produkta lapā. Pēc veiksmīgas pievienošanas server action
// pārraksta groza cookie, Next pārrenderē lapu, un poga saņem jauno
// `inCartQuantity` — sasniedzot limitu, tā kļūst par saiti "Skatīt grozu".
// Limitu (maxQuantity) un pieejamību serveris pārbauda vēlreiz.
export function AddToCartButton({
  variantId,
  orderingEnabled,
  available,
  inCartQuantity,
  maxQuantity,
}: {
  variantId: string;
  /** False while Shopify isn't configured (mock data) — ordering is off. */
  orderingEnabled: boolean;
  available: boolean;
  /** Units of this variant already in the shopper's cart. */
  inCartQuantity: number;
  maxQuantity: number;
}) {
  const [state, formAction, pending] = useActionState(addToCart, INITIAL_STATE);
  const canOrder = orderingEnabled && available;

  if (canOrder && inCartQuantity >= maxQuantity) {
    return (
      <div className="flex flex-1 flex-col gap-1.5 sm:flex-none">
        <Link href="/cart" className={BUTTON_CLASSES}>
          <Check className="h-4 w-4" />
          Skatīt grozu
        </Link>
        <p role="status" className="text-xs font-medium text-emerald-700">
          {state.status === "success" && state.message
            ? state.message
            : "Prece ir tavā grozā."}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-1.5 sm:flex-none">
      <input type="hidden" name="variantId" value={variantId} />
      <button
        type="submit"
        disabled={!canOrder || pending}
        aria-busy={pending}
        title={
          !available
            ? "Šobrīd nav pieejams"
            : !orderingEnabled
            ? "Pasūtīšana tiešsaistē būs pieejama drīzumā"
            : undefined
        }
        className={cn(
          BUTTON_CLASSES,
          pending
            ? "cursor-wait opacity-80"
            : "disabled:cursor-not-allowed disabled:bg-neutral-300"
        )}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {!available
          ? "Nav pieejams"
          : pending
          ? "Pievieno…"
          : inCartQuantity > 0
          ? "Pievienot vēl vienu"
          : "Pievienot grozam"}
      </button>

      {state.status === "error" ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {state.message}
        </p>
      ) : state.status === "success" || inCartQuantity > 0 ? (
        <p role="status" className="text-xs text-neutral-600">
          {state.status === "success" && state.message
            ? state.message
            : `Grozā jau ir ${inCartQuantity} gab.`}{" "}
          <Link
            href="/cart"
            className="font-medium text-neutral-900 underline-offset-2 hover:underline"
          >
            Skatīt grozu →
          </Link>
        </p>
      ) : null}
    </form>
  );
}
