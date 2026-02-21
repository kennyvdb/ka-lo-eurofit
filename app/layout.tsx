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
  title: "LO App",
  description: "LO platform - GO! Atheneum Avelgem",
  applicationName: "LO App",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LO App",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
