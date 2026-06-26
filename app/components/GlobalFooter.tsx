"use client";

import React from "react";
import Link from "next/link";
import {
  Terminal,
  Cpu,
  Database,
  ShieldCheck,
  ArrowUpRight,
} from "@phosphor-icons/react";

export default function GlobalFooter() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#070709]/90 backdrop-blur-md px-6 py-12 mt-20 font-mono text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Brand Column */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-[10px] font-bold text-emerald-400">M</span>
            </div>
            <span className="font-semibold text-white tracking-[0.25em] uppercase text-sm">
              MOODMETRICS
            </span>
          </div>
          <p className="text-zinc-400 font-sans leading-relaxed text-xs max-w-sm">
            An advanced quantitative psychology sandbox mapping real-time community sentiment, perpetual funding rates, and on-chain whale activity into actionable market coefficients.
          </p>
          <div className="flex items-center gap-4 text-zinc-400">
            <span className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>NODES: ONLINE</span>
            </span>
            <span className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded">
              <span>LATENCY: 84ms</span>
            </span>
          </div>
        </div>

        {/* Navigation Links Column */}
        <div className="md:col-span-3 space-y-3">
          <span className="text-[10px] text-white uppercase font-bold tracking-widest block mb-1">Navigation</span>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/dashboard" className="hover:text-emerald-400 transition-colors duration-200">Dashboard</Link>
            <Link href="/records" className="hover:text-emerald-400 transition-colors duration-200">AI Records</Link>
            <Link href="/backtester" className="hover:text-emerald-400 transition-colors duration-200">Quant Lab</Link>
            <Link href="/advanced" className="hover:text-emerald-400 transition-colors duration-200">Advanced Tools</Link>
            <Link href="/methodology" className="hover:text-emerald-400 transition-colors duration-200">How It Works</Link>
            <Link href="/support" className="hover:text-emerald-400 transition-colors duration-200">Support</Link>
          </div>
        </div>

        {/* Diagnostic Statuses Column */}
        <div className="md:col-span-5 space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
          <span className="text-[10px] text-white uppercase font-bold tracking-widest block mb-1">System Health Diagnostic</span>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="flex items-center gap-1.5 text-zinc-650"><Database size={10} /> DATABASE (NEON POSTGRES)</span>
              <span className="text-emerald-400">CONNECTED</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="flex items-center gap-1.5 text-zinc-600"><Cpu size={10} /> MODEL ENGINE (LLAMA 3.1 8B)</span>
              <span className="text-emerald-400">ACTIVE</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="flex items-center gap-1.5 text-zinc-600"><Terminal size={10} /> API INGESTION GATEWAYS</span>
              <span className="text-emerald-400">3/3 SYNCED</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="flex items-center gap-1.5 text-zinc-600"><ShieldCheck size={10} /> SECURITY CREDENTIALS</span>
              <span className="text-zinc-400">AES-256 VERIFIED</span>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px]">
        <div className="text-zinc-600 text-center md:text-left leading-normal font-sans">
          <span>© {new Date().getFullYear()} MOODMETRICS INC. DEVELOPED AS AN EXPERIMENTAL CLUSTERING PROJECT.</span>
          <br className="hidden md:inline" />
          <span className="text-zinc-750">DISCLAIMER: SENTIMENT METRICS DO NOT CONSTITUTE TRADING RECOMMENDATIONS OR FINANCIAL INVESTMENT ADVICE.</span>
        </div>
        <div className="flex gap-4">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-emerald-400 transition-colors duration-200">
            GITHUB <ArrowUpRight size={10} />
          </a>
        </div>
      </div>
    </footer>
  );
}
