"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLineUp,
  Database,
  Info,
  Sliders,
  ArrowRight,
  Heart,
} from "@phosphor-icons/react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: ChartLineUp },
  { href: "/records", label: "AI Records", icon: Database },
  { href: "/backtester", label: "Quant Lab", icon: Sliders },
  { href: "/advanced", label: "Advanced Tools", icon: Sliders },
  { href: "/methodology", label: "How It Works", icon: Info },
  { href: "/support", label: "Support", icon: Heart },
];

export default function GlobalNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4 pb-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between rounded-2xl border border-white/5 bg-[#0C0C0E]/85 backdrop-blur-xl px-6 py-3 shadow-[0_0_15px_-5px_rgba(0,0,0,0.4)] transition-all duration-500 hover:shadow-[0_0_25px_-8px_rgba(255,255,255,0.04)]">
        <Link href="/" className="flex items-center gap-3 group transition-all duration-300">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-xs font-mono text-emerald-400 font-bold">M</span>
          </div>
          <span className="font-mono text-sm tracking-[0.3em] font-semibold text-white group-hover:text-emerald-400 transition-colors duration-300">
            MOODMETRICS
          </span>
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5 bg-black/40 p-1 rounded-full border border-white/5">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-tight transition-all duration-300 ${
                  isActive
                    ? "bg-white/10 text-white shadow-[inset_0_0_8px_rgba(255,255,255,0.06)] border border-white/5"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                <Icon
                  size={12}
                  className={isActive ? "text-emerald-400" : "text-zinc-600"}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold rounded-full tracking-wider transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
          >
            LAUNCH
            <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] transition-transform duration-300">
              <ArrowRight size={10} weight="bold" />
            </span>
          </Link>
        </div>
      </div>

      <div className="flex xl:hidden overflow-x-auto gap-2 py-2 px-2 mt-2 scrollbar-none border-b border-white/5">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-mono transition-all duration-300 ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/25"
                  : "text-zinc-500 bg-zinc-900/30 border border-transparent hover:bg-zinc-900/50"
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
