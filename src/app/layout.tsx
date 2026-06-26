import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Wardrobe — curate fashion you love",
    template: "%s · Wardrobe",
  },
  description:
    "Wardrobe is a social fashion collection app. Clip clothing from any brand, drag it onto visual closets, follow friends, and react to their style.",
  applicationName: "Wardrobe",
  keywords: [
    "fashion",
    "wishlist",
    "wardrobe",
    "outfit",
    "style",
    "collections",
  ],
  openGraph: {
    title: "Wardrobe — curate fashion you love",
    description:
      "Clip clothing from any brand, drag it onto visual closets, follow friends, and react to their style.",
    siteName: "Wardrobe",
    type: "website",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Wardrobe — curate fashion you love",
    description:
      "Clip clothing from any brand, drag it onto visual closets, follow friends, and react to their style.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <a
            href="#main"
            className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
