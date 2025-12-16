import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteHeader } from "@/components/layout/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RePart - Circular Electronics Marketplace",
  description: "Buy and sell defective/donor electronic devices in Azerbaijan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#05070d] text-slate-100 antialiased pb-24 md:pb-0`}>
        <SiteHeader />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <div className="md:hidden">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
