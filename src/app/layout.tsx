import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Yuvabe Studios brand fonts. Two families only: Clash Display (headings), Gilroy (body).
const clash = localFont({
  src: [
    { path: "../fonts/clash-display/ClashDisplayMedium.woff2", weight: "500" },
    { path: "../fonts/clash-display/ClashDisplaySemibold.woff2", weight: "600" },
  ],
  variable: "--font-clash",
  display: "swap",
});
const gilroy = localFont({
  src: [
    { path: "../fonts/gilroy/Gilroy-Regular.ttf", weight: "400" },
    { path: "../fonts/gilroy/Gilroy-Medium.ttf", weight: "500" },
    { path: "../fonts/gilroy/Gilroy-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-gilroy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Our work · Yuvabe Studios",
  description: "A selection of reels made by Yuvabe Studios with CreativeOS.",
  // Some reels are not yet published by the brands themselves.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${clash.variable} ${gilroy.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
