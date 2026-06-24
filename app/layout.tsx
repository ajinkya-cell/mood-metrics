import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalNav from "./components/GlobalNav";
import GrainOverlay from "./components/GrainOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoodMetrics — Advanced Crypto Sentiment Ingestion",
  description:
    "Aggregating crypto market sentiment from Reddit, CoinGecko news, and RSS feeds using Nvidia NIM Llama 3.1 AI modeling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-zinc-100">
        <GrainOverlay />
        <GlobalNav />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
