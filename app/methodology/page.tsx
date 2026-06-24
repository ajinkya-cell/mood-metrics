"use client";

import React from "react";
import {
  MathOperations,
  Newspaper,
  RedditLogo,
  Coins,
  Gauge,
  Info,
  CheckCircle,
} from "@phosphor-icons/react";
import DoubleBezel from "../components/DoubleBezel";

export default function MethodologyPage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 select-none overflow-hidden pb-20 font-sans">
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-[#0C0C0E] text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-500 font-bold mb-4">
          <MathOperations size={12} />
          SYSTEM METHODOLOGY
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          How MoodMetrics Works
        </h1>
        <p className="text-zinc-500 text-sm font-mono mt-2 max-w-2xl">
          A descriptive breakdown of our 4-layer sentiment blending algorithm, data sourcing, and directional score interpretation.
        </p>
      </div>

      {/* The Blend Formula visual block */}
      <section className="mb-12">
        <DoubleBezel className="p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest block uppercase">
                THE BLENDED CORE FORMULA
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                Score = (L1 × 40%) + (L2 × 30%) + (L3 × 15%) + (L4 × 15%)
              </h2>
              <p className="text-xs text-zinc-400 mt-2 max-w-lg leading-relaxed">
                By blending short-term market momentum (Flash), historical community consensus (Historic), leverage market positioning (Funding), and macro global indicators (Fear & Greed), MoodMetrics creates a high-fidelity sentiment oracle.
              </p>
            </div>
            <div className="font-mono text-xs text-zinc-300 bg-black/40 border border-white/5 p-4 rounded-xl max-w-md shrink-0 w-full lg:w-auto">
              <span className="text-emerald-400 font-bold">Weighted Formula Readout:</span>
              <div className="mt-2 space-y-1 text-[11px] text-zinc-400">
                <div>• Flash Ingestion (L1): <span className="text-white">40% weight</span></div>
                <div>• Historic Reddit (L2): <span className="text-white">30% weight</span></div>
                <div>• Funding Rates (L3): <span className="text-white">15% weight</span></div>
                <div>• Fear & Greed Index (L4): <span className="text-white">15% weight</span></div>
              </div>
            </div>
          </div>
        </DoubleBezel>
      </section>

      {/* Descriptive Layer Analysis */}
      <section className="space-y-6 mb-16">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Info className="text-emerald-400" />
          The Four Ingestion Layers
        </h2>

        <div className="grid grid-cols-1 gap-6">
          {/* L1: Flash Ingestion */}
          <DoubleBezel className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Newspaper size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">L1 — Flash Ingestion (40% Weight)</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">REAL-TIME SENTIMENT & BREAKING NEWS</span>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-zinc-900 border border-white/5 px-2.5 py-1 rounded text-zinc-400">
                FETCH FREQUENCY: EVERY 30 MINUTES
              </span>
            </div>
            <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
              <p>
                <strong>What it is:</strong> The Flash Layer measures immediate sentiment momentum. It evaluates CoinGecko community vote percentages (upvotes vs downvotes) and parses breaking headlines from main RSS publications (CoinDesk, Cointelegraph, Decrypt, and Cryptoslate).
              </p>
              <p>
                <strong>How it is fetched:</strong> Live queries extract the active coin metadata from CoinGecko's `/coins/[id]` endpoint. RSS XML documents are concurrently read and parsed using Cheerio to extract article descriptions, filter keywords, and verify coin relevance.
              </p>
              <p>
                <strong>Calculation:</strong> Raw articles are processed and combined with community vote metrics to generate a normalized rating from `-100` (bearish panic) to `+100` (bullish momentum).
              </p>
            </div>
          </DoubleBezel>

          {/* L2: Historic Reddit */}
          <DoubleBezel className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <RedditLogo size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">L2 — Historic Reddit AI (30% Weight)</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">MACRO-COMMUNITY MOOD TIMELINE</span>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-zinc-900 border border-white/5 px-2.5 py-1 rounded text-zinc-400">
                FETCH FREQUENCY: EVERY 6 HOURS
              </span>
            </div>
            <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
              <p>
                <strong>What it is:</strong> A long-term baseline tracking community consensus. Instead of relying on instant reactions, the Historic Layer crawls Reddit boards, extracting public threads to capture deep-rooted sentiment.
              </p>
              <p>
                <strong>How it is fetched:</strong> A cron script triggers sequential JSON requests across targeted coin subreddits. Captured post titles and text are analyzed by our Nvidia Llama 3.1 8B Instruct model, generating precise directional scores.
              </p>
              <p>
                <strong>Calculation:</strong> Individual post scores are run through a **Recency Decay** formula ($t_{1/2} = 12h$) and a **Log-scaled Upvote Boost** (viral posts are boosted but not allowed to break the scale). These are pre-aggregated into 1-hour timeseries buckets.
              </p>
            </div>
          </DoubleBezel>

          {/* L3: Funding Rates */}
          <DoubleBezel className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Coins size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">L3 — Funding Rates (15% Weight)</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">DERIVATIVES LEVERAGE BIAS</span>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-zinc-900 border border-white/5 px-2.5 py-1 rounded text-zinc-400">
                FETCH FREQUENCY: EVERY 30 MINUTES
              </span>
            </div>
            <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
              <p>
                <strong>What it is:</strong> Leveraged market positioning telemetry. Perpetual swaps utilize funding rates to keep the perpetual price pegged to spot. Positive rates indicate long traders pay short traders (excess bullish leverage); negative rates indicate shorts pay longs (excess bearish leverage).
              </p>
              <p>
                <strong>How it is fetched:</strong> Queried directly from the Binance Futures perp contract API (`/fapi/v1/fundingRate?symbol=BTCUSDT`).
              </p>
              <p>
                <strong>Calculation:</strong> The decimal rate is divided by `0.001` (representing a high 0.10% premium) and clamped: $f(rate) = clamp(rate / 0.001, -1, 1)$. This maps rates to a `-1.0..+1.0` scale (and multiplied by 100 on the dashboard).
              </p>
            </div>
          </DoubleBezel>

          {/* L4: Fear & Greed */}
          <DoubleBezel className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Gauge size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">L4 — Global Fear & Greed (15% Weight)</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">GLOBAL MARKET EMOTION</span>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-zinc-900 border border-white/5 px-2.5 py-1 rounded text-zinc-400">
                FETCH FREQUENCY: EVERY 30 MINUTES
              </span>
            </div>
            <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
              <p>
                <strong>What it is:</strong> The global crypto market index tracking volatility, volume momentum, and social presence.
              </p>
              <p>
                <strong>How it is fetched:</strong> Ingested daily from Alternative.me's public endpoint (`/fng/`).
              </p>
              <p>
                <strong>Calculation:</strong> Shifted to center around 50 (neutral): $f(value) = clamp((value - 50) / 50, -1, 1)$, translating the raw `0..100` range to a `-1.0..+1.0` scale.
              </p>
            </div>
          </DoubleBezel>
        </div>
      </section>

      {/* Interpretation Section (bullish, bearish, neutral) */}
      <section>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
          <CheckCircle className="text-emerald-400" />
          Interpreting the Blended Score
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs text-zinc-400">
          {/* Bullish */}
          <DoubleBezel className="p-6 flex flex-col justify-between h-72">
            <div>
              <span className="text-emerald-400 font-bold text-sm block mb-1">
                BULLISH STATE (+21 to +100)
              </span>
              <span className="text-[9.5px] text-zinc-500 block mb-4 border-b border-white/5 pb-2">
                LONG ACCUMULATION BIAS
              </span>
              <p className="font-sans leading-relaxed text-zinc-400 text-xs">
                Indicates strong positive alignment. News publications report constructive updates, Reddit discussions are highly positive, perpetual funding is positive (long leverage), and the global index indicates high greed. Spot accumulation is likely favored.
              </p>
            </div>
            <span className="text-emerald-500 text-[10px] font-bold block mt-4 border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded w-max">
              MARKET ACTION: CONSIDER LONG BIAS
            </span>
          </DoubleBezel>

          {/* Neutral */}
          <DoubleBezel className="p-6 flex flex-col justify-between h-72">
            <div>
              <span className="text-zinc-300 font-bold text-sm block mb-1">
                NEUTRAL STATE (-20 to +20)
              </span>
              <span className="text-[9.5px] text-zinc-500 block mb-4 border-b border-white/5 pb-2">
                CONSOLIDATION / RANGE-BOUND
              </span>
              <p className="font-sans leading-relaxed text-zinc-400 text-xs">
                Indicates mixed signals or range-bound consolidation. Positive community hype may be offset by high derivatives funding drag, or strong on-chain indicators may meet local news corrections. Sentiment is balanced and lacks clear trend direction.
              </p>
            </div>
            <span className="text-zinc-400 text-[10px] font-bold block mt-4 border border-white/5 bg-white/5 px-2 py-1 rounded w-max">
              MARKET ACTION: WAIT FOR BREAKOUT
            </span>
          </DoubleBezel>

          {/* Bearish */}
          <DoubleBezel className="p-6 flex flex-col justify-between h-72">
            <div>
              <span className="text-rose-400 font-bold text-sm block mb-1">
                BEARISH STATE (-100 to -21)
              </span>
              <span className="text-[9.5px] text-zinc-500 block mb-4 border-b border-white/5 pb-2">
                SHORT DISTRIBUTION BIAS
              </span>
              <p className="font-sans leading-relaxed text-zinc-400 text-xs">
                Indicates negative alignment and fear. Heavy bearish articles, negative Reddit consensus, negative funding rates (shorts paying longs due to high shorting leverage), and extreme fear in the global index. Short positioning or distribution bias is favored.
              </p>
            </div>
            <span className="text-rose-500 text-[10px] font-bold block mt-4 border border-rose-500/20 bg-rose-500/5 px-2 py-1 rounded w-max">
              MARKET ACTION: CONSIDER RISK OFFSET
            </span>
          </DoubleBezel>
        </div>
      </section>
    </div>
  );
}
