import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Officieel domein van LOOP
  metadataBase: new URL("https://www.loop-go-atheneumavelgem.be"),

  title: {
    default: "LOOP",
    template: "%s | LOOP",
  },

  description:
    "LOOP — Lichamelijke Opvoeding Online Platform van GO! Atheneum Avelgem.",

  applicationName: "LOOP",

  // Iconen / PWA
  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  // PWA manifest
  manifest: "/manifest.webmanifest",

  // Apple / iPhone beginscherm
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LOOP",
  },

  formatDetection: {
    telephone: false,
  },

  // Canonieke URL
  alternates: {
    canonical: "/",
  },

  // WhatsApp / Facebook / Messenger / LinkedIn
  openGraph: {
    title: "LOOP",
    description:
      "Lichamelijke Opvoeding Online Platform van GO! Atheneum Avelgem.",
    url: "https://www.loop-go-atheneumavelgem.be",
    siteName: "LOOP",
    locale: "nl_BE",
    type: "website",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LOOP — Lichamelijke Opvoeding Online Platform van GO! Atheneum Avelgem",
      },
    ],
  },

  // X / Twitter en andere platformen
  twitter: {
    card: "summary_large_image",
    title: "LOOP",
    description:
      "Lichamelijke Opvoeding Online Platform van GO! Atheneum Avelgem.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          min-h-dvh
          bg-neutral-950
          text-white
          antialiased
          font-sans
        `}
      >
        {children}
      </body>
    </html>
  );
}