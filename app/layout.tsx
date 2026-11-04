import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site } from "@/lib/site";
import "./globals.css";

const inter = localFont({
  src: "./fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.brandName}: ${site.strapline}`, template: `%s | ${site.brandName}` },
  description:
    "AUSPHARMA markets generic medicines made by WHO-GMP certified manufacturing partners. Scan the QR code on your pack to check its batch Certificate of Analysis.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "en_IN", siteName: site.brandName },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08524c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
