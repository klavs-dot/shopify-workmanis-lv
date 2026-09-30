"use client";

import { useEffect } from "react";

import { forgetStaleCart } from "@/app/cart/actions";

// Renderējas tikai tad, kad "14d_cart" cookie norāda uz grozu, ko Shopify
// vairs nezina (beidzies termiņš / pasūtījums noformēts). Servera komponente
// cookie izdzēst nevar, tāpēc to klusi izdara server action pēc ielādes.
export function ForgetStaleCart() {
  useEffect(() => {
    forgetStaleCart().catch(() => {
      // Nākamā lapas ielāde mēģinās vēlreiz.
    });
  }, []);
  return null;
}
