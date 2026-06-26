import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalNav from "./components/GlobalNav";
import GlobalFooter from "./components/GlobalFooter";
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Intercept chrome extension errors to prevent Next.js dev overlay from crashing
              window.addEventListener('error', function(e) {
                if (e.message && (
                  e.message.indexOf('MetaMask') !== -1 ||
                  e.message.indexOf('messenger') !== -1 ||
                  (e.filename && e.filename.indexOf('chrome-extension://') !== -1)
                )) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              }, true);

              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && (
                  String(e.reason.message || e.reason).indexOf('MetaMask') !== -1 ||
                  String(e.reason.message || e.reason).indexOf('Failed to connect to MetaMask') !== -1 ||
                  String(e.reason.stack || '').indexOf('chrome-extension://') !== -1
                )) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              }, true);
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#050505] text-zinc-100">
        <GrainOverlay />
        <GlobalNav />
        <div className="flex-1 flex flex-col">{children}</div>
        <GlobalFooter />
      </body>
    </html>
  );
}
