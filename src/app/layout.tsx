import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dîner de Gala — Mboro Horizons · Billetterie officielle",
    template: "%s · Dîner de Gala Mboro Horizons",
  },
  description:
    "Réservez votre place pour le Dîner de Gala de Mboro Horizons, le 30 décembre 2026 au Foyer des jeunes de Mboro. Prévente 7 000 FCFA · VIP 10 000 FCFA. Paiement sécurisé.",
  openGraph: {
    title: "Dîner de Gala — Mboro Horizons",
    description:
      "Honorer ceux qui ont marqué Mboro, inspirer ceux qui construiront son avenir. 30 décembre 2026 · Foyer des jeunes, Mboro.",
    images: ["/images/hero.jpg"],
    locale: "fr_SN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050403",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="min-h-dvh">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
