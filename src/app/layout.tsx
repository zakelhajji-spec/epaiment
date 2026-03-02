import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Epaiement.ma - Paiements et Factures Conformes DGI 2026",
  description: "Générez des liens de paiement, des factures électroniques conformes aux mesures fiscales marocaines 2026. Gestion complète de la facturation, dépenses et rapports TVA.",
  keywords: ["paiement", "facture", "Maroc", "DGI 2026", "TVA", "ICE", "lien de paiement", "QR code", "Casablanca"],
  authors: [{ name: "Epaiement.ma Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Epaiement.ma - Facturation Conforme DGI 2026",
    description: "Solution complète de paiement et facturation pour les entreprises marocaines",
    url: "https://epaiement.ma",
    siteName: "Epaiement.ma",
    type: "website",
    locale: "fr_MA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Epaiement.ma",
    description: "Facturation conforme DGI 2026 au Maroc",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="skype_toolbar" content="skype_toolbar_parser_compatible" />
        <meta name="referrer" content="origin-when-cross-origin" />
        <meta name="theme-color" content="#1B3F66" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
