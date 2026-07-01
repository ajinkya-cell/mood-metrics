"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bug,
  GlobeSimple,
  Lightbulb,
  ShieldCheck,
  ChartLineUp,
} from "@phosphor-icons/react";

import { FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/records", label: "AI Records" },
  { href: "/backtester", label: "Backtest" },
  { href: "/advanced", label: "Advanced Tools" },
  { href: "/methodology", label: "How It Works" },
  { href: "/support", label: "Support" },
];

const SOCIAL_LINKS = [
  { href: "https://github.com/ajinkya-cell/", label: "GitHub", icon:FaGithub },
  { href: "https://x.com/ajinkyacell", label: "Twitter", icon: FaXTwitter },
  { href: "https://ajinkya-cell.vercel.app/", label: "Portfolio", icon: GlobeSimple },
];

export default function GlobalFooter() {
  return (
    <footer className="relative mt-24 w-full overflow-hidden border-t border-white/5 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_35%),linear-gradient(180deg,rgba(9,9,11,0.96),rgba(5,5,5,1))]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
      <div className="absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:gap-8">

          {/* Left: Creator (primary) */}
          <div className="rounded-3xl border border-white/6 bg-white/[0.03] p-7 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.8)] backdrop-blur-sm">
            <span className="mb-4 block text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
              Creator
            </span>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-zinc-300 max-w-lg">
                Thanks for stopping by! I'm<span className="bg-gradient-to-b from-zinc-300 px-1 to-emerald-600 bg-clip-text text-transparent italic font-bold">
  Ajinkya 
</span>, a developer who enjoys learning by building. This website is entirely my own work, from the design and development to the small details behind the scenes. I'm always experimenting with new technologies, especially in AI and web development, and using each project to grow as an engineer. <br />


<span className="">
  If you enjoyed this project, I'd love to connect. You can also explore more of my work through the links below.
</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {SOCIAL_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-400 transition-colors duration-200 hover:border-emerald-400/20 hover:bg-emerald-400/10 hover:text-white"
                      aria-label={item.label}
                    >
                      <Icon size={14} weight="bold" />
                      {item.label}
                    </a>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="mailto:ajinkya@example.com?subject=MoodMetrics%20bug%20report"
                  className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-emerald-400 transition-colors font-mono tracking-wide"
                >
                  <Bug size={12} />
                  Report bug
                </a>
                <span className="text-zinc-700">|</span>
                <a
                  href="mailto:ajinkya@example.com?subject=MoodMetrics%20suggestion"
                  className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-emerald-400 transition-colors font-mono tracking-wide"
                >
                  <Lightbulb size={12} />
                  Suggest
                </a>
                
               
              </div>
            </div>
          </div>

          {/* Right: Brand + Navigation */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-5">
              <Link href="/" className="inline-flex items-center mb-3">
                <img
                  src="/logo.png"
                  alt="MoodMetrics"
                  className="h-10 w-auto object-contain opacity-90"
                />
              </Link>
              <p className="text-xs leading-relaxed text-zinc-500 mb-3">
                Real-time crypto sentiment &amp; market signal dashboard.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300">
                  <ChartLineUp size={10} weight="bold" />
                  Live
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                  30m refresh
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                  BTC &middot; ETH &middot; SOL
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-5">
              <span className="mb-3 block text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                Navigation
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight
                      size={10}
                      className="text-zinc-600 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-300"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
