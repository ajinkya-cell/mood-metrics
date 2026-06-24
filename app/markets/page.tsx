import React from "react";
import { db } from "@/lib/db/client";
import { tickers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchCoinPrice } from "@/lib/scrapers/coingecko";
import { Coins, CaretUp, CaretDown } from "@phosphor-icons/react/dist/ssr";
import DoubleBezel from "../components/DoubleBezel";

export const metadata = {
  title: "Quantitative Market Analysis | MoodMetrics",
  description: "Live comparative analysis of price action, volumes, and volume momentum ratios.",
};

// Next.js Server Component
export default async function MarketsPage() {
  const activeTickers = await db.query.tickers.findMany({
    where: eq(tickers.isActive, true),
  });

  // Fetch prices in parallel
  const marketRecords = await Promise.all(
    activeTickers.map(async (ticker) => {
      const stats = ticker.coingeckoId
        ? await fetchCoinPrice(ticker.coingeckoId)
        : null;
      return {
        ticker,
        stats,
      };
    })
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 select-none overflow-hidden pb-20 font-mono">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-[#0C0C0E] text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-500 font-bold mb-4">
          <Coins size={12} />
          QUANTITATIVE METRICS BOARD
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white font-sans">
          Market Intelligence
        </h1>
        <p className="text-zinc-500 text-sm mt-1 max-w-2xl font-sans">
          Comparative overview of capitalization, trading activity, volume momentum ratios, and community metrics.
        </p>
      </div>

      {/* Quantitative Grid Table */}
      <div className="space-y-6">
        {marketRecords.map(({ ticker, stats }) => {
          if (!stats) return null;

          const isUp = stats.change24h >= 0;
          // Calculate Volume Momentum (ratio of 24h volume over 7d average)
          const volMomentum =
            stats.volume7dAvg > 0
              ? stats.volume24h / stats.volume7dAvg
              : 1.0;

          return (
            <DoubleBezel key={ticker.id} className="w-full">
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 items-center">
                {/* Asset Identity (col-3) */}
                <div className="lg:col-span-3">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
                    ASSET CORE
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-zinc-900 border border-white/5 flex items-center justify-center text-xs font-bold text-white">
                      {ticker.symbol}
                    </div>
                    <div>
                      <span className="text-xs text-white font-sans font-bold block leading-none">
                        {ticker.name}
                      </span>
                      <span className="text-[9px] text-zinc-500">
                        CG_ID: {ticker.coingeckoId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Change (col-2) */}
                <div className="lg:col-span-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
                    VALUATION
                  </span>
                  <span className="text-sm font-bold text-white block">
                    ${stats.usd.toLocaleString()}{" "}
                    <span className="text-[10px] text-zinc-600 font-normal">USD</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] ${
                      isUp ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {isUp ? <CaretUp size={8} /> : <CaretDown size={8} />}
                    {isUp ? "+" : ""}
                    {stats.change24h.toFixed(2)}%
                  </span>
                </div>

                {/* Market Cap & 24h Volume (col-3) */}
                <div className="lg:col-span-3">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
                    CAPITALIZATION & LIQUIDITY
                  </span>
                  <div className="text-[10.5px] text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">CAP:</span>
                      <span className="text-white">${stats.marketCapUsd.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">24H_VOL:</span>
                      <span>${stats.volume24h.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Volume Momentum Index (col-2) */}
                <div className="lg:col-span-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
                    VOL MOMENTUM
                  </span>
                  <span
                    className={`text-sm font-bold block ${
                      volMomentum > 1.2
                        ? "text-emerald-500"
                        : volMomentum < 0.8
                        ? "text-rose-500"
                        : "text-zinc-300"
                    }`}
                  >
                    {volMomentum.toFixed(2)}x
                  </span>
                  <span className="text-[9px] text-zinc-500 block leading-tight">
                    {volMomentum > 1.0 ? "Volume surge vs 7d avg" : "Declining liquidity velocity"}
                  </span>
                </div>

                {/* Community Metrics (col-2) */}
                <div className="lg:col-span-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
                    COMMUNITY POWER
                  </span>
                  <div className="text-[10px] text-zinc-400">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">REDDIT:</span>
                      <span>{stats.redditSubscribers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">GECKO_VOTES:</span>
                      <span className="text-emerald-500">{Math.round(stats.geckoSentimentUp)}% Up</span>
                    </div>
                  </div>
                </div>
              </div>
            </DoubleBezel>
          );
        })}
      </div>
    </div>
  );
}
