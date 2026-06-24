"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Gauge,
  Cpu,
  Coins,
  ShieldCheck,
  EnvelopeSimple,
  Pulse,
  Newspaper,
} from "@phosphor-icons/react";
import DoubleBezel from "./components/DoubleBezel";
import HorizontalScale from "./components/HorizontalScale";
import MaskGradient from "./components/MaskGradient";
import GlowCard from "./components/GlowCard";
import SectionEyebrow from "./components/SectionEyebrow";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24, filter: "blur(4px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true, amount: 0.2 },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  viewport: { once: true },
};

const LAYERS = [
  {
    icon: Newspaper,
    title: "L1 — FLASH LAYER (40%)",
    desc: "Scrapes CoinGecko market summaries and traditional media RSS feeds at 30-minute intervals.",
  },
  {
    icon: Cpu,
    title: "L2 — HISTORIC REDDIT (30%)",
    desc: "Crawls community subreddits sequentially using 8 anti-blocking defense hooks and Nvidia Llama 3.1.",
  },
  {
    icon: Coins,
    title: "L3 — FUNDING RATES (15%)",
    desc: "Monitors Binance Futures perpetual swaps to determine leveraged long/short market skew.",
  },
  {
    icon: Gauge,
    title: "L4 — FEAR & GREED (15%)",
    desc: "Pulls Alternative.me's daily global Fear & Greed index, normalized dynamically to a -1..+1 scale.",
  },
];

export default function LandingPage() {
  return (
    <div className="w-full flex flex-col items-center select-none overflow-hidden pb-20">
      {/* ── HERO SECTION ── */}
      <motion.section
        {...fadeUp}
        className="w-full max-w-7xl px-6 pt-16 md:pt-24 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
      >
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <SectionEyebrow icon={<Pulse size={10} className="text-emerald-400" />}>
            <span className="text-emerald-400">LIVE</span> TELEMETRY ACTIVE
          </SectionEyebrow>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-none text-white max-w-3xl mb-6">
            Ingesting panic.
            <br />
            <MaskGradient
              as="span"
              from="from-emerald-400 via-emerald-300 to-emerald-500"
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
            >
              Quantifying greed.
            </MaskGradient>
          </h1>

          <p className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-[55ch] mb-8 font-mono">
            MoodMetrics is a clinical sentiment oracle aggregating raw Reddit
            data, perpetual funding leverage, CoinGecko news updates, and global
            Fear & Greed indexes into real-time blended signals.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard">
              <motion.div
                whileTap={{ scale: 0.97 }}
                className="group flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-mono font-bold tracking-wider transition-all duration-300 active:scale-95"
              >
                LAUNCH TERMINAL
                <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] transition-transform duration-300">
                  <ArrowRight size={12} weight="bold" />
                </span>
              </motion.div>
            </Link>

            <Link href="/methodology">
              <motion.div
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-mono tracking-wider transition-all duration-300 active:scale-95"
              >
                METHODOLOGY
              </motion.div>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 w-full">
          <DoubleBezel className="w-full p-6">
            <div className="flex justify-between items-baseline mb-6 font-mono text-xs text-zinc-500">
              <span>TEL_FEED_ACTIVE</span>
              <span className="text-emerald-400">SYNC_OK</span>
            </div>

            <div className="space-y-4 font-mono">
              {[
                { name: "Bitcoin", sym: "BTC", score: 42, price: "$95,240", change: "+1.2%" },
                { name: "Ethereum", sym: "ETH", score: 12, price: "$3,120", change: "-0.4%" },
                { name: "Solana", sym: "SOL", score: -15, price: "$145", change: "+3.8%" },
              ].map((coin) => (
                <Link
                  key={coin.sym}
                  href="/dashboard"
                  className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/40 hover:border-white/15 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-sm font-bold text-zinc-300">
                      {coin.sym}
                    </div>
                    <div>
                      <span className="text-sm text-white block font-sans font-bold">
                        {coin.name}
                      </span>
                      <span className="text-xs text-zinc-500">{coin.price}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">{coin.change}</span>
                    <span
                      className={cn(
                        "text-sm font-bold px-2 py-0.5 rounded",
                        coin.score > 20
                          ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20"
                          : coin.score < -20
                          ? "bg-rose-950/20 text-rose-400 border border-rose-500/20"
                          : "bg-zinc-900 text-zinc-400 border border-white/5"
                      )}
                    >
                      {coin.score > 0 ? "+" : ""}
                      {coin.score}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </DoubleBezel>
        </div>
      </motion.section>

      {/* ── DIVIDER ── */}
      <HorizontalScale />

      {/* ── TRUST STRIP ── */}
      <motion.section
        {...fadeUp}
        className="w-full border-y border-white/5 bg-zinc-950/40 py-12 flex flex-col items-center"
      >
        <span className="text-xs font-mono tracking-[0.25em] text-zinc-600 uppercase mb-4">
          POWERED BY SECURE TELEMETRY CHANNELS
        </span>
        <div className="flex justify-center gap-16 text-zinc-500 font-mono text-sm opacity-60">
          <span className="hover:text-emerald-400/60 transition-colors duration-300">
            COINGECKO_API
          </span>
          <span className="hover:text-emerald-400/60 transition-colors duration-300">
            BINANCE_FUTURES
          </span>
          <span className="hover:text-emerald-400/60 transition-colors duration-300">
            REDDIT_PUBLIC_JSON
          </span>
          <span className="hover:text-emerald-400/60 transition-colors duration-300">
            ALTERNATIVE_ME
          </span>
        </div>
      </motion.section>

      {/* ── DIVIDER ── */}
      <HorizontalScale pattern="rgba(16,185,129,0.12)" />

      {/* ── FEATURES ASYMMETRIC BENTO ── */}
      <motion.section
        {...staggerContainer}
        className="w-full max-w-7xl px-6 py-24 flex flex-col items-start"
      >
        <SectionEyebrow icon={<Pulse size={10} className="text-emerald-400" />}>
          TELEMETRY INFRASTRUCTURE
        </SectionEyebrow>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-12">
          Four-Layer Sentiment Ingestion
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          {LAYERS.map((layer, i) => {
            const Icon = layer.icon;
            const isWide = i === 0;
            return (
              <motion.div
                key={i}
                {...staggerItem}
                className={isWide ? "lg:col-span-7" : "lg:col-span-5"}
              >
                <GlowCard
                  accent="emerald"
                  className="p-8 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Icon size={28} className="text-emerald-400 mb-4" />
                  <div>
                    <h3 className="font-mono text-sm text-white uppercase tracking-wider mb-2">
                      {layer.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed font-sans">
                      {layer.desc}
                    </p>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ── DIVIDER ── */}
      <HorizontalScale />

      {/* ── NEWSLETTER CTA ── */}
      <motion.section
        {...fadeUp}
        className="w-full max-w-xl px-6 py-24"
      >
        <GlowCard accent="emerald" className="p-10 flex flex-col items-center text-center">
          <EnvelopeSimple size={40} className="text-zinc-500 mb-4" />
          <h3 className="text-xl font-bold tracking-tight text-white mb-2">
            Ingestion Reports Inbox
          </h3>
          <p className="text-sm text-zinc-500 max-w-sm mb-6 font-mono">
            Receive automated daily digests of classified sentiment signals,
            funding anomalies, and AI reasoning blocks.
          </p>

          <form onSubmit={(e) => e.preventDefault()} className="w-full flex items-center relative">
            <input
              type="email"
              placeholder="Secure email coordinates..."
              className="bg-black/60 border border-white/5 focus:border-white/15 focus:ring-1 focus:ring-white/10 rounded-full pl-5 pr-36 py-4 text-sm font-mono tracking-wide w-full transition-all duration-300 outline-none text-zinc-200 placeholder-zinc-700"
            />
            <button
              type="submit"
              className="absolute right-1 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-mono font-bold rounded-full tracking-wider transition-all duration-300 active:scale-95"
            >
              SUBSCRIBE
            </button>
          </form>
        </GlowCard>
      </motion.section>
    </div>
  );
}
