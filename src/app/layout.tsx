import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "shopify.workmanis.lv — Pallet Operations",
  description:
    "AI warehouse and manifest processing system for pallet / liquidation / return / outlet business. SEPARATE project from Workmanis.lv.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lv">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
