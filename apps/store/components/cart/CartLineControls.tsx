"use client";

import { useActionState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

import { updateCartLine, type CartActionState } from "@/app/cart/actions";
import { cn } from "@/lib/utils";

const INITIAL_STATE: CartActionState = { status: "idle" };

const STEP_BUTTON =
  "inline-flex h-8 w-8 items-center justify-center text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

// Groza rindas daudzums un "Noņemt". Viena forma ar vairākām submit pogām —
// katra nosūta savu `quantity` (0 = noņemt). Daudzuma pogas rādās tikai tad,
// ja Shopify atlikums atļauj vairāk par 1 gab. (sk. maxCartQuantity).
export function CartLineControls({
  lineId,
  title,
  quantity,
  maxQuantity,
}: {
  lineId: string;
  title: string;
  quantity: number;
  maxQuantity: number;
}) {
  const [state, formAction, pending] = useActionState(updateCartLine, INITIAL_STATE);
  const showStepper = maxQuantity > 1 || quantity > 1;

  return (
    <form
      action={formAction}
      aria-busy={pending}
      className={cn("mt-auto pt-2 transition-opacity", pending && "opacity-60")}
    >
      <input type="hidden" name="lineId" value={lineId} />
      <div className="flex items-center justify-between gap-3">
        {showStepper ? (
          <div
            role="group"
            aria-label="Daudzums"
            className="inline-flex items-center overflow-hidden rounded-md border border-neutral-300"
          >
            <button
              type="submit"
              name="quantity"
              value={quantity - 1}
              disabled={pending || quantity <= 1}
              aria-label="Samazināt daudzumu"
              className={STEP_BUTTON}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="tabular w-8 text-center text-sm font-medium" aria-live="polite">
              {quantity}
            </span>
            <button
              type="submit"
              name="quantity"
              value={quantity + 1}
              disabled={pending || quantity >= maxQuantity}
              aria-label="Palielināt daudzumu"
              className={STEP_BUTTON}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-neutral-500">{quantity} gab.</span>
        )}

        <button
          type="submit"
          name="quantity"
          value={0}
          disabled={pending}
          aria-label={`Noņemt „${title}” no groza`}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-neutral-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Noņemt
        </button>
      </div>

      {state.status === "error" && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
