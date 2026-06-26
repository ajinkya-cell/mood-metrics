"use client";

import React from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/records", label: "AI Records" },
  { href: "/backtester", label: "Backtest" },
  { href: "/advanced", label: "Advanced Tools" },
  { href: "/methodology", label: "How It Works" },
  { href: "/support", label: "Support" },
];

export default function GlobalFooter() {
  return (
    <footer className="relative w-full mt-24">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="bg-[#070709]/80 backdrop-blur-md px-6 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Main grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
            {/* Brand */}
            <div className="md:col-span-4 space-y-4">
              <Link href="/" className="inline-block">
                <img
                  src="/logo.png"
                  alt="MoodMetrics Logo"
                  className="w-28 object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
                />
              </Link>
              <p className="text-zinc-500 font-sans leading-relaxed text-xs max-w-xs">
                An advanced quantitative psychology sandbox mapping real-time
                community sentiment, perpetual funding rates, and on-chain whale
                activity into actionable market coefficients.
              </p>
            </div>

            {/* Navigation */}
            <div className="md:col-span-3 space-y-4">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-[0.2em] block">
                Navigation
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors duration-200 font-mono"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Creator */}
            <div className="md:col-span-5 space-y-4 md:pl-6 md:border-l border-white/[0.04]">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-[0.2em] block">
                Creator
              </span>
              <p className="text-zinc-400 font-sans leading-relaxed text-xs">
                Hey, I am Ajinkya. I like to develop things.
              </p>
              <p className="text-zinc-500 font-sans text-[11px] -mt-2">
                Check out my other works:
              </p>
              <div className="flex items-center gap-5 pt-1">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors duration-200"
                  aria-label="GitHub"
                >
                  <svg
                    className="w-4 h-4 fill-current group-hover:scale-110 transition-transform duration-200"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.867 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                    />
                  </svg>
                  <span className="text-[11px] font-mono tracking-wider">
                    GITHUB
                  </span>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors duration-200"
                  aria-label="X (Twitter)"
                >
                  <svg
                    className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform duration-200"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="text-[11px] font-mono tracking-wider">
                    X
                  </span>
                </a>
                <a
                  href="https://ajinkya.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors duration-200"
                  aria-label="Portfolio"
                >
                  <span className="text-[10px] font-bold font-sans bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded leading-none group-hover:bg-emerald-500/20 transition-colors duration-200">
                    W
                  </span>
                  <span className="text-[11px] font-mono tracking-wider">
                    PORTFOLIO
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-14 pt-6 border-t border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-zinc-600 font-sans text-center md:text-left leading-relaxed">
              &copy; {new Date().getFullYear()} MOODMETRICS INC. — Experimental
              clustering project. Not financial advice.
            </p>
            <p className="text-[10px] text-zinc-600 font-sans text-center md:text-right leading-relaxed">
              Built with Llama 3.1, Next.js &amp; Neon PostgreSQL
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
