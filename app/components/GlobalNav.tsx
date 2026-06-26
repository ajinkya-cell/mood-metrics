"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLineUp,
  Database,
  Info,
  Sliders,
  Heart,
} from "@phosphor-icons/react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: ChartLineUp },
  { href: "/records", label: "AI Records", icon: Database },
  { href: "/backtester", label: "Backtest", icon: Sliders },
  { href: "/advanced", label: "Advanced Tools", icon: Sliders },
  { href: "/methodology", label: "How It Works", icon: Info },
  { href: "/support", label: "Support", icon: Heart },
];

export default function GlobalNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4 pb-2">
      <div className="max-w-5xl mx-auto flex items-center justify-between rounded-2xl border border-white/5 bg-[#0C0C0E]/85 backdrop-blur-xl px-6 py-2  shadow-[0_0_15px_-5px_rgba(0,0,0,0.4)] transition-all duration-500 hover:shadow-[0_0_25px_-8px_rgba(255,255,255,0.04)]">
        <Link href="/" className="flex items-center group transition-all duration-300">
          <img
            src="/logo.png"
            alt="MoodMetrics Logo"
            className="w-30 object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        <nav className="hidden xl:flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 py-2 text-xs font-mono tracking-wider transition-all duration-300 ${
                  isActive
                    ? "text-emerald-400 font-extrabold border-b-2 border-emerald-500/80 px-0.5"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Icon
                  size={14}
                  className={isActive ? "text-emerald-400" : "text-zinc-500"}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/5 rounded-full"
            aria-label="GitHub"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.867 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/5 rounded-full flex items-center justify-center"
            aria-label="X (formerly Twitter)"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>

      <div className="flex xl:hidden overflow-x-auto gap-5 py-3 px-4 mt-2 scrollbar-none border-b border-white/5 items-center">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 text-xs font-mono tracking-wider transition-all duration-300 pb-1.5 ${
                isActive
                  ? "text-emerald-400 font-extrabold border-b-2 border-emerald-500/80"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
