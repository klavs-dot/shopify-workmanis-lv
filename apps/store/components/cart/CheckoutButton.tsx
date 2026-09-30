"use client";

import { useActionState } from "react";
import { Loader2, Lock } from "lucide-react";

import { checkout, type CartActionState } from "@/app/cart/actions";
import { cn } from "@/lib/utils";

const INITIAL_STATE: CartActionState = { status: "idle" };

// "Pāriet uz apmaksu": server action pārlasa grozu Shopify un pārvirza uz
// cart.checkoutUrl (Shopify apmaksas lapa). Kļūdas gadījumā paliekam /cart.
export function CheckoutButton({ disabled = false }: { disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(checkout, INITIAL_STATE);

  return (
    <form action={formAction} className="mt-4">
      <button
        type="submit"
        disabled={disabled || pending}
        aria-busy={pending}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
          pending
            ? "cursor-wait opacity-80"
            : "disabled:cursor-not-allowed disabled:bg-neutral-300"
        )}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        {pending ? "Atver apmaksu…" : "Pāriet uz apmaksu"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
