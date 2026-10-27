import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Jersey_10, Bricolage_Grotesque, Reenie_Beanie } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import GlobalNav from "./components/GlobalNav";
import GlobalFooter from "./components/GlobalFooter";
import ScrollToTop from "./components/ScrollToTop";
import GrainOverlay from "./components/GrainOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Display face (headlines, big numerals, wordmark) + grotesk for UI
const jersey = Jersey_10({
  variable: "--font-jersey",
  subsets: ["latin"],
  weight: "400",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

// Handwritten face for the landing page's "The idea" statement
const reenieBeanie = Reenie_Beanie({
  variable: "--font-reenie-beanie",
  subsets: ["latin"],
  weight: "400",
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
      className={`${geistSans.variable} ${jetbrainsMono.variable} ${jersey.variable} ${bricolage.variable} ${reenieBeanie.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        <Script id="chrome-extension-error-intercept" strategy="beforeInteractive">
          {`
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
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-[var(--ed-page)] text-zinc-100" suppressHydrationWarning>
        <GrainOverlay />
        <ScrollToTop />
        <GlobalNav />
        <div className="flex-1 flex flex-col">{children}</div>
        <GlobalFooter />
      </body>
    </html>
  );
}
