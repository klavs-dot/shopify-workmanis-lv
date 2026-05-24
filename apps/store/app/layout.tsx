import type { Metadata, Viewport } from "next";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://14d.lv";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "14D — izdevīgi piedāvājumi katru nedēļu",
    template: "%s · 14D",
  },
  description:
    "14D piedāvā atlasītas noliktavas, outlet un palešu preces par izdevīgām cenām. Jaunas preces regulāri un ierobežotā daudzumā.",
  applicationName: "14D",
  alternates: { canonical: "/" },
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
  robots: { index: true, follow: true },
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
