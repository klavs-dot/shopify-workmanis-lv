"use server";

import { redirect } from "next/navigation";

import {
  addCartLines,
  clearCartId,
  createCart,
  getCartById,
  hasCartCookie,
  isShopifyConfigured,
  readCartId,
  removeCartLines,
  saveCartId,
  updateCartLines,
  type CartMutationResult,
} from "@/lib/shopify";

// Groza server actions (Shopify Storefront Cart API). Katra darbība pati
// pārlasa grozu no Shopify, tāpēc noteikumi (1 gab. vienai precei, ja
// Shopify nerāda lielāku atlikumu; pārdotas preces grozā nenonāk) nav
// apejami ar viltotu formu. Veiksmīga darbība pārraksta "14d_cart" cookie
// (30 dienu termiņš sākas no jauna), un Next tad pārrenderē lapu — galvenē
// atjaunojas groza skaits.

export interface CartActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const MESSAGES = {
  disabled: "Pasūtīšana tiešsaistē būs pieejama drīzumā.",
  failed: "Grozu neizdevās atjaunināt. Lūdzu, mēģini vēlreiz.",
  added: "Prece pievienota grozam.",
  alreadyInCart: "Šī prece jau ir tavā grozā.",
  soldOut: "Šī prece diemžēl vairs nav pieejama.",
  expired: "Groza derīguma termiņš beidzies — pievieno preces vēlreiz.",
  empty: "Tavs grozs ir tukšs.",
  unavailableItems:
    "Grozā ir preces, kas vairs nav pieejamas — noņem tās, lai turpinātu.",
  checkoutFailed: "Neizdevās pāriet uz apmaksu. Lūdzu, mēģini vēlreiz.",
} as const;

const VARIANT_ID_PATTERN = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
const LINE_ID_PATTERN = /^gid:\/\/shopify\/CartLine\/[\w.~%?=&-]+$/;

function fail(message: string): CartActionState {
  return { status: "error", message };
}

function logFailure(action: string, detail: unknown): void {
  console.error(
    `[cart] ${action}:`,
    detail instanceof Error ? detail.message : JSON.stringify(detail)
  );
}

function logWarnings(action: string, result: CartMutationResult): void {
  if (result.userErrors.length || result.warnings.length) {
    console.warn(`[cart] ${action}:`, JSON.stringify({
      userErrors: result.userErrors,
      warnings: result.warnings,
    }));
  }
}

/** "Pievienot grozam" (produkta lapa). formData: variantId. */
export async function addToCart(
  _prev: CartActionState,
  formData: FormData
): Promise<CartActionState> {
  if (!isShopifyConfigured()) return fail(MESSAGES.disabled);

  const variantId = formData.get("variantId");
  if (typeof variantId !== "string" || !VARIANT_ID_PATTERN.test(variantId)) {
    return fail(MESSAGES.failed);
  }

  try {
    const cartId = await readCartId();
    const current = cartId ? await getCartById(cartId) : null;

    const existing = current?.items.find((i) => i.variantId === variantId);
    if (current && existing && existing.quantity >= existing.maxQuantity) {
      await saveCartId(current.id);
      return { status: "success", message: MESSAGES.alreadyInCart };
    }

    const line = { merchandiseId: variantId, quantity: 1 };
    let result = current
      ? await addCartLines(current.id, [line])
      : await createCart([line]);
    // Grozs beidzās starp nolasīšanu un pievienošanu — veido jaunu.
    if (result.cartMissing) result = await createCart([line]);
    logWarnings("add", result);

    if (!result.cart) {
      if (!current && (await hasCartCookie())) await clearCartId();
      return fail(MESSAGES.failed);
    }

    let cart = result.cart;
    const added = cart.items.find((i) => i.variantId === variantId);
    if (!added || !added.available) {
      // Shopify atteica (nav atlikuma) vai — iecietīgs backend kā mock.shop —
      // pieņēma pārdotu preci; tādu izņemam atpakaļ.
      if (added) cart = (await removeCartLines(cart.id, [added.lineId])).cart ?? cart;
      await saveCartId(cart.id);
      return fail(MESSAGES.soldOut);
    }
    if (added.quantity > added.maxQuantity) {
      // Divas cilnes pievieno vienlaikus vai atlikums sarucis kopš lapas ielādes.
      cart =
        (await updateCartLines(cart.id, [
          { id: added.lineId, quantity: added.maxQuantity },
        ])).cart ?? cart;
    }

    await saveCartId(cart.id);
    return { status: "success", message: MESSAGES.added };
  } catch (err) {
    logFailure("add", err);
    return fail(MESSAGES.failed);
  }
}

/** Daudzuma maiņa / noņemšana (/cart). formData: lineId, quantity
 *  (0 = noņemt). Daudzums tiek ierobežots līdz rindas maxQuantity. */
export async function updateCartLine(
  _prev: CartActionState,
  formData: FormData
): Promise<CartActionState> {
  if (!isShopifyConfigured()) return fail(MESSAGES.disabled);

  const lineId = formData.get("lineId");
  const requested = Number(formData.get("quantity"));
  if (
    typeof lineId !== "string" ||
    lineId.length > 512 ||
    !LINE_ID_PATTERN.test(lineId) ||
    !Number.isInteger(requested) ||
    requested < 0
  ) {
    return fail(MESSAGES.failed);
  }

  try {
    const cartId = await readCartId();
    const current = cartId ? await getCartById(cartId) : null;
    if (!current) {
      if (await hasCartCookie()) await clearCartId();
      return fail(MESSAGES.expired);
    }

    const line = current.items.find((i) => i.lineId === lineId);
    if (!line) {
      // Jau noņemta (dubultklikšķis, cita cilne) — tikai atsvaidzinām.
      await saveCartId(current.id);
      return { status: "success" };
    }

    const quantity = Math.min(requested, line.maxQuantity);
    const result =
      quantity === 0
        ? await removeCartLines(current.id, [line.lineId])
        : await updateCartLines(current.id, [{ id: line.lineId, quantity }]);
    logWarnings(quantity === 0 ? "remove" : "update", result);

    if (result.cartMissing) {
      await clearCartId();
      return fail(MESSAGES.expired);
    }
    if (!result.cart) return fail(MESSAGES.failed);

    await saveCartId(result.cart.id);
    return { status: "success" };
  } catch (err) {
    logFailure("update", err);
    return fail(MESSAGES.failed);
  }
}

/** "Pāriet uz apmaksu": pārlasa grozu (cenas/pieejamība var būt mainījušās)
 *  un pārvirza uz Shopify checkout. */
export async function checkout(): Promise<CartActionState> {
  if (!isShopifyConfigured()) return fail(MESSAGES.disabled);

  const cartId = await readCartId();
  if (!cartId) {
    if (await hasCartCookie()) await clearCartId();
    return fail(MESSAGES.empty);
  }

  let checkoutUrl: URL;
  try {
    const cart = await getCartById(cartId);
    if (!cart) {
      await clearCartId();
      return fail(MESSAGES.expired);
    }
    if (cart.items.length === 0 || cart.items.some((i) => !i.available)) {
      // Lapā redzamais grozs ir novecojis (prece tikko pārdota u.tml.) —
      // cookie pārrakstīšana liek Next pārrenderēt /cart ar aktuālo stāvokli.
      await saveCartId(cart.id);
      return fail(cart.items.length === 0 ? MESSAGES.empty : MESSAGES.unavailableItems);
    }

    checkoutUrl = new URL(cart.checkoutUrl);
    if (checkoutUrl.protocol !== "https:") throw new Error(`checkoutUrl ${cart.checkoutUrl}`);
  } catch (err) {
    logFailure("checkout", err);
    return fail(MESSAGES.checkoutFailed);
  }

  // Ārpus try: redirect() darbojas, izmetot izņēmumu.
  redirect(checkoutUrl.toString());
}

/** Izmet cookie, kas norāda uz Shopify vairs nezināmu grozu (beidzies
 *  termiņš vai pasūtījums jau noformēts). Servera komponentes cookies mainīt
 *  nevar, tāpēc to izsauc <ForgetStaleCart /> no pārlūka. */
export async function forgetStaleCart(): Promise<void> {
  if (!isShopifyConfigured() || !(await hasCartCookie())) return;

  const cartId = await readCartId();
  if (cartId) {
    try {
      if (await getCartById(cartId)) return;
    } catch {
      return; // Shopify nav sasniedzams — grozs var būt vēl derīgs.
    }
  }
  await clearCartId();
}
