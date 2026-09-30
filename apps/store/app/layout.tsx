import type { Metadata, Viewport } from "next";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeaderCart } from "@/components/cart/HeaderCart";

import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://14d.lv";
// Līdz palaišanai (mock dati) meklētājiem neindeksēt. Palaižot Vercel env
// uzstāda NEXT_PUBLIC_ALLOW_INDEXING=true.
const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "14D — izdevīgi piedāvājumi katru nedēļu",
    template: "%s · 14D",
  },
  description:
    "14D piedāvā atlasītas noliktavas, outlet un palešu preces par izdevīgām cenām. Jaunas preces regulāri un ierobežotā daudzumā.",
  applicationName: "14D",
  openGraph: {
    type: "website",
    siteName: "14D",
    locale: "lv_LV",
    url: SITE_URL,
    title: "14D — izdevīgi piedāvājumi katru nedēļu",
    description:
      "Atlasītas noliktavas, outlet un palešu preces vienā vietā. Ierobežots daudzums.",
  },
  twitter: {
    card: "summary_large_image",
    title: "14D — izdevīgi piedāvājumi katru nedēļu",
    description:
      "Atlasītas noliktavas, outlet un palešu preces vienā vietā. Ierobežots daudzums.",
  },
  robots: ALLOW_INDEXING
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lv">
      <body className="flex min-h-screen flex-col bg-white text-neutral-900 antialiased">
        {/* Ar Shopify HeaderCart lasa groza cookie, tāpēc visas lapas renderējas
         *  katram pieprasījumam (ƒ) — apzināts kompromiss par servera
         *  renderētu groza skaitu. Katalogs joprojām nāk no data cache (60 s);
         *  lapu `revalidate` / generateStaticParams strādā tikai mock režīmā. */}
        <Header cart={<HeaderCart />} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
