"use client";

import React from "react";
import { Clock, ShieldCheck, Waves, Target, BellSimple } from "@phosphor-icons/react";
import DoubleBezel from "../components/DoubleBezel";

export default function RoadmapPage() {
  const PHASES = [
    {
      title: "Phase 1: Core Foundation",
      status: "DEPLOYED",
      date: "Q2 2026",
      icon: ShieldCheck,
      iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      bullets: [
        "Four-Layer Blended Sentiment logic (40/30/15/15 weights).",
        "Scraper Ingestion: CoinGecko communities, RSS streams, Binance perpetuals, alternative.me.",
        "8-Hook anti-blocking defenses for Reddit JSON crawling.",
        "AI Sentiment extraction utilizing Nvidia Llama 3.1 8B Instruct model.",
      ],
    },
    {
      title: "Phase 2: Orderbook & On-Chain",
      status: "IN DEVELOPMENT",
      date: "Q3 2026",
      icon: Waves,
      iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      bullets: [
        "Bid-Ask Orderbook Imbalance ratios (aggregating liquidity depth spreads).",
        "Exchange Net Flows tracking (on-chain deposits vs withdrawals from whale addresses).",
        "Volume Momentum calculations directly embedded in the Blend scores.",
      ],
    },
    {
      title: "Phase 3: Deep NLP Ingestion",
      status: "PLANNED",
      date: "Q4 2026",
      icon: Target,
      iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      bullets: [
        "Ingesting X/Twitter developer/influencer accounts via public indexes.",
        "Telegram channel and Discord community sentiment scrapers.",
        "YouTube weekly analysis transcript extraction and summary digests.",
      ],
    },
    {
      title: "Phase 4: Agent & Alert Systems",
      status: "PLANNED",
      date: "Q1 2027",
      icon: BellSimple,
      iconColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      bullets: [
        "Simulated alert thresholds (triggers based on custom blended scores).",
        "Webhooks and developer API endpoints for external quantitative engines.",
        "Automated discord/telegram alerts for sudden sentiment surges.",
      ],
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12 select-none overflow-hidden pb-20 font-mono">
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-[#0C0C0E] text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-500 font-bold mb-4">
          <Clock size={12} />
          SYSTEM EVOLUTION ROADMAP
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white font-sans">
          Future Enhancements
        </h1>
        <p className="text-zinc-500 text-sm mt-2 max-w-2xl">
          Outlining the roadmap of database expansions, AI iterations, and alert features.
        </p>
      </div>

      {/* Vertical Bento Timeline */}
      <div className="space-y-8 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-[1px] before:bg-white/5">
        {PHASES.map((phase, i) => {
          const Icon = phase.icon;
          return (
            <div key={i} className="flex gap-6 relative items-start">
              {/* Timeline dot */}
              <div
                className={`w-16 h-16 rounded-full shrink-0 flex items-center justify-center border z-10 ${phase.iconColor}`}
              >
                <Icon size={20} />
              </div>

              {/* Timeline Card */}
              <div className="flex-1">
                <DoubleBezel className="p-6">
                  <div className="flex justify-between items-baseline mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                        {phase.title}
                      </h3>
                      <span className="text-[10px] text-zinc-500">{phase.date}</span>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        phase.status === "DEPLOYED"
                          ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20"
                          : phase.status === "IN DEVELOPMENT"
                          ? "bg-blue-950/20 text-blue-400 border border-blue-500/20"
                          : "bg-zinc-900 text-zinc-500 border border-white/5"
                      }`}
                    >
                      {phase.status}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-zinc-400 list-disc pl-4 font-sans leading-relaxed">
                    {phase.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </DoubleBezel>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
