"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CaretUp,
  CaretDown,
  MagnifyingGlass,
  ArrowClockwise,
  Terminal,
  ShieldCheck,
  ArrowSquareOut,
  Newspaper,
  RedditLogo,
} from "@phosphor-icons/react";
import DoubleBezel from "./DoubleBezel";
import SentimentChart from "./SentimentChart";
import HorizontalScale from "./HorizontalScale";
import GlowCard from "./GlowCard";

type AnalyzeResponse = {
  ticker: { symbol: string; name: string };
  price: {
    usd: number;
    change24hPercent: number;
    marketCapUsd: number;
    geckoSentimentUp: number;
    geckoSentimentDown: number;
    redditSubscribers: number;
  } | null;
  sentiment: {
    score: number;
    label: "bullish" | "bearish" | "neutral";
    flashScore: number;
    historicScore: number;
    fundingScore: number;
    fearGreedScore: number;
    flashWeight: number;
    historicWeight: number;
    fundingWeight: number;
    fearGreedWeight: number;
    fundingRate: { rate: number; score: number; label: string };
    fearGreed: { value: number; score: number; label: string };
    totalPostsAnalyzed: number;
    bullishPercent: number;
    bearishPercent: number;
    neutralPercent: number;
    geckoVoteUp: number | null;
    geckoVoteDown: number | null;
  };
  timeseries: Array<{ time: string; score: number; posts: number }>;
  recentSignals: Array<{
    title: string;
    source: string;
    label: string;
    score: string;
    reasoning: string;
    postedAt: string;
    url: string;
  }>;
  meta: {
    blendFormula: string;
    flashFresh: boolean;
    flashPostsUsed: number;
    historicBucketsUsed: number;
    lastUpdated: string;
  };
};

export default function Dashboard() {
  const [activeSymbol, setActiveSymbol] = useState("BTC");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSentiment = async (symbol: string, force = false) => {
    try {
      setLoading(!data || refreshing);
      setError(null);
      const url = `/api/analyze?symbol=${symbol}${force ? "&force=true" : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) throw new Error(`Asset not found: ${symbol}`);
        throw new Error("Failed to fetch sentiment telemetry");
      }
      const json = (await res.json()) as AnalyzeResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSentiment(activeSymbol);
  }, [activeSymbol]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const searchRes = await fetch(`/api/search?q=${searchQuery}`);
      if (!searchRes.ok) throw new Error("Search resolution failed");
      const results = await searchRes.json();
      if (results && results.length > 0) {
        setActiveSymbol(results[0].symbol.toUpperCase());
        setSearchQuery("");
      } else {
        throw new Error(`No tickers resolved for "${searchQuery}"`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search resolution error");
      setLoading(false);
    }
  };

  const triggerForceRefresh = () => {
    setRefreshing(true);
    fetchSentiment(activeSymbol, true);
  };

  const getNeedleCoordinates = (score: number) => {
    const angleInDegrees = -90 + (score / 100) * 135;
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    const radius = 55;
    const cx = 80;
    const cy = 80;
    const x = cx + radius * Math.cos(angleInRadians);
    const y = cy + radius * Math.sin(angleInRadians);
    return { x, y };
  };

  const getSentimentColorClass = (score: number) => {
    if (score > 20) return "text-emerald-500";
    if (score < -20) return "text-rose-500";
    return "text-zinc-400";
  };

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  const sentimentColor = data ? getSentimentColorClass(data.sentiment.score) : "text-zinc-400";
  const needleCoords = data ? getNeedleCoordinates(data.sentiment.score) : { x: 80, y: 25 };

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-zinc-100 font-sans antialiased overflow-x-hidden pb-16">
      {/* ── LOCAL NAV ── */}
      <nav className="mx-4 mb-8">
        <GlowCard
          accent="zinc"
          className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <span className="text-xs font-mono text-emerald-400 font-bold">M</span>
            </div>
            <span className="font-mono text-sm tracking-[0.3em] font-semibold text-white">
              MOODMETRICS
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/5">
            {["BTC", "ETH", "SOL"].map((sym) => (
              <button
                key={sym}
                onClick={() => setActiveSymbol(sym)}
                className={`px-5 py-2 rounded-full text-sm font-mono tracking-wider transition-all duration-300 ${
                  activeSymbol === sym
                    ? "bg-white/10 text-white shadow-sm border border-white/5"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <MagnifyingGlass size={14} className="absolute left-3 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker (e.g. SOL)..."
              className="bg-black/60 border border-white/5 focus:border-white/15 focus:ring-1 focus:ring-white/10 rounded-full pl-9 pr-4 py-2 text-sm font-mono tracking-wide w-56 transition-all duration-300 outline-none text-zinc-200 placeholder-zinc-600"
            />
          </form>
        </GlowCard>
      </nav>

      <main className="max-w-7xl mx-auto px-4">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-rose-950/20 border border-rose-500/20 rounded-xl px-5 py-4 flex items-center justify-between text-sm font-mono text-rose-400 mb-6"
            >
              <span>[SYSTEM ERROR] {error}</span>
              <button onClick={() => setError(null)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {data && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ── LEFT: GAUGE ── */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <GlowCard accent="emerald" className="w-full p-8">
                  <div className="flex justify-between items-start mb-6 font-mono text-xs text-zinc-500 tracking-wider">
                    <div>
                      <span className="block uppercase text-zinc-400 font-bold">
                        {data.ticker.name} Telemetry
                      </span>
                      <span>ACTIVE / DEPLOYED</span>
                    </div>
                    <button
                      onClick={triggerForceRefresh}
                      disabled={refreshing}
                      className="flex items-center gap-1.5 text-xs bg-white/5 border border-white/5 hover:border-white/10 px-2 py-1 rounded-md text-zinc-400 transition-all duration-300 hover:text-zinc-200 active:scale-95 disabled:opacity-40"
                    >
                      <ArrowClockwise size={10} className={refreshing ? "animate-spin" : ""} />
                      {refreshing ? "REFRESHING" : "SYNC"}
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between mb-8">
                    <div>
                      <span className="text-xs text-zinc-500 font-mono tracking-widest block">
                        LIVE CONVERSION
                      </span>
                      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mt-1">
                        ${data.price ? data.price.usd.toLocaleString() : "N/A"}{" "}
                        <span className="text-sm text-zinc-600 font-mono font-medium">USD</span>
                      </h1>
                    </div>

                    {data.price && (
                      <div
                        className={`flex items-center gap-1 font-mono text-sm px-3 py-1.5 rounded-md border ${
                          data.price.change24hPercent >= 0
                            ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-400"
                            : "bg-rose-950/10 border-rose-500/20 text-rose-400"
                        }`}
                      >
                        {data.price.change24hPercent >= 0 ? (
                          <CaretUp size={12} />
                        ) : (
                          <CaretDown size={12} />
                        )}
                        {data.price.change24hPercent >= 0 ? "+" : ""}
                        {data.price.change24hPercent.toFixed(2)}%
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center py-4 relative">
                    <div className="relative w-64 h-64 flex items-center justify-center">
                      <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-15">
                        <path
                          d="M 30.5 129.5 A 70 70 0 1 1 129.5 129.5"
                          fill="none"
                          stroke="rgba(255,255,255,0.03)"
                          strokeWidth="10"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 30.5 129.5 A 70 70 0 1 1 129.5 129.5"
                          fill="none"
                          stroke={
                            data.sentiment.score > 20
                              ? "#10B981"
                              : data.sentiment.score < -20
                              ? "#F43F5E"
                              : "#71717A"
                          }
                          strokeWidth="2"
                          strokeOpacity="0.3"
                          strokeLinecap="round"
                        />
                        <line
                          x1="80"
                          y1="80"
                          x2={needleCoords.x}
                          y2={needleCoords.y}
                          stroke={
                            data.sentiment.score > 20
                              ? "#10B981"
                              : data.sentiment.score < -20
                              ? "#F43F5E"
                              : "#ECECED"
                          }
                          strokeWidth="3"
                          strokeLinecap="round"
                          style={{ filter: "drop-shadow(0 0 3px currentColor)" }}
                        />
                        <circle cx="80" cy="80" r="5" fill="#0C0C0E" stroke="#71717A" strokeWidth="1.5" />
                      </svg>

                      <div className="absolute flex flex-col items-center justify-center font-mono">
                        <span className="text-xs text-zinc-500 tracking-wider">
                          BLENDED SENTIMENT
                        </span>
                        <motion.span
                          key={data.sentiment.score}
                          initial={{ scale: 0.9, opacity: 0.8 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 100, damping: 15, mass: 0.8 }}
                          className={`text-5xl font-bold tracking-tighter ${sentimentColor}`}
                        >
                          {data.sentiment.score > 0 ? "+" : ""}
                          {data.sentiment.score}
                        </motion.span>
                        <span className="text-xs uppercase text-zinc-400 font-semibold px-3 py-1 rounded bg-white/5 border border-white/5 mt-2">
                          {data.sentiment.label}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs text-zinc-500 font-mono uppercase text-center mt-4">
                      Blended components weighted: 40/30/15/15
                    </span>
                  </div>
                </GlowCard>
              </div>

              {/* ── RIGHT: 4-LAYER BENTO ── */}
              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlowCard accent="emerald" className="p-6 flex flex-col justify-between min-h-[12rem]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm text-zinc-500 font-mono tracking-widest block">
                        L1 — FLASH NEWS (40%)
                      </span>
                      <span className="text-sm text-zinc-300 flex items-center gap-1 mt-1">
                        <Newspaper size={14} className="text-zinc-500" />
                        CoinGecko + RSS Feeds
                      </span>
                    </div>
                    <span
                      className={`font-mono text-xl font-bold ${getSentimentColorClass(
                        data.sentiment.flashScore
                      )}`}
                    >
                      {data.sentiment.flashScore > 0 ? "+" : ""}
                      {data.sentiment.flashScore}
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-3 font-mono text-xs text-zinc-500 flex justify-between">
                    <span>Feed status: Fresh</span>
                    <span>Used: {data.meta.flashPostsUsed} items</span>
                  </div>
                </GlowCard>

                <GlowCard accent="emerald" className="p-6 flex flex-col justify-between min-h-[12rem]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm text-zinc-500 font-mono tracking-widest block">
                        L2 — HISTORIC REDDIT (30%)
                      </span>
                      <span className="text-sm text-zinc-300 flex items-center gap-1 mt-1">
                        <RedditLogo size={14} className="text-zinc-500" />
                        AI Analyzed Subreddits
                      </span>
                    </div>
                    <span
                      className={`font-mono text-xl font-bold ${getSentimentColorClass(
                        data.sentiment.historicScore
                      )}`}
                    >
                      {data.sentiment.historicScore > 0 ? "+" : ""}
                      {data.sentiment.historicScore}
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-3 font-mono text-xs text-zinc-500 flex justify-between">
                    <span>Subscribers: {data.price?.redditSubscribers.toLocaleString() || "N/A"}</span>
                    <span>Total analyzed: {data.sentiment.totalPostsAnalyzed}</span>
                  </div>
                </GlowCard>

                <GlowCard accent="emerald" className="p-6 flex flex-col justify-between min-h-[12rem]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm text-zinc-500 font-mono tracking-widest block">
                        L3 — FUNDING RATES (15%)
                      </span>
                      <span className="text-sm text-zinc-300 flex items-center gap-1.5 mt-1">
                        <span className="relative flex h-2 w-2">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              data.sentiment.fundingRate.rate >= 0.0001
                                ? "bg-emerald-400"
                                : data.sentiment.fundingRate.rate <= -0.0001
                                ? "bg-rose-400"
                                : "bg-zinc-400"
                            }`}
                          />
                          <span
                            className={`relative inline-flex rounded-full h-2 w-2 ${
                              data.sentiment.fundingRate.rate >= 0.0001
                                ? "bg-emerald-500"
                                : data.sentiment.fundingRate.rate <= -0.0001
                                ? "bg-rose-500"
                                : "bg-zinc-500"
                            }`}
                          />
                        </span>
                        Binance Futures Perp
                      </span>
                    </div>
                    <span
                      className={`font-mono text-xl font-bold ${getSentimentColorClass(
                        data.sentiment.fundingScore
                      )}`}
                    >
                      {data.sentiment.fundingScore > 0 ? "+" : ""}
                      {data.sentiment.fundingScore}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 font-mono text-xs text-zinc-400 border-t border-white/5 pt-3">
                    <div className="flex justify-between">
                      <span>Funding Rate (8h):</span>
                      <span className="text-white">
                        {(data.sentiment.fundingRate.rate * 100).toFixed(4)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Classification:</span>
                      <span className="uppercase text-zinc-400">
                        {data.sentiment.fundingRate.label.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </GlowCard>

                <GlowCard accent="emerald" className="p-6 flex flex-col justify-between min-h-[12rem]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm text-zinc-500 font-mono tracking-widest block">
                        L4 — GLOBAL FEAR & GREED (15%)
                      </span>
                      <span className="text-sm text-zinc-300 flex items-center gap-1 mt-1">
                        <ShieldCheck size={14} className="text-zinc-500" />
                        Crypto Market Sentiment
                      </span>
                    </div>
                    <span
                      className={`font-mono text-xl font-bold ${getSentimentColorClass(
                        data.sentiment.fearGreedScore
                      )}`}
                    >
                      {data.sentiment.fearGreedScore > 0 ? "+" : ""}
                      {data.sentiment.fearGreedScore}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 font-mono text-xs text-zinc-400 border-t border-white/5 pt-3">
                    <div className="flex justify-between">
                      <span>Fear & Greed Value:</span>
                      <span className="text-white">{data.sentiment.fearGreed.value}/100</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Market State:</span>
                      <span className="uppercase text-zinc-400">
                        {data.sentiment.fearGreed.label}
                      </span>
                    </div>
                  </div>
                </GlowCard>
              </div>
            </div>

            {/* ── DIVIDER ── */}
            <div className="my-8">
              <HorizontalScale />
            </div>

            {/* ── LOWER: CHART + FEED ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 border border-white/5 bg-[#0C0C0E]/80 rounded-3xl p-8">
                <SentimentChart data={data.timeseries} />
              </div>

              <div className="lg:col-span-5 border border-white/5 bg-[#0C0C0E]/80 rounded-3xl p-6 flex flex-col h-[320px]">
                <div className="flex items-center gap-2 mb-4 font-mono text-zinc-500 text-xs tracking-widest">
                  <Terminal size={14} />
                  <span>SYSTEM INGESTION LOG — LIVE FEED</span>
                </div>

                <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                  {data.recentSignals.map((sig, i) => {
                    const isExpanded = expandedIndex === i;
                    const isBullish = sig.label === "bullish";
                    const isBearish = sig.label === "bearish";
                    const scoreVal = parseFloat(sig.score);

                    return (
                      <div
                        key={i}
                        className="border border-transparent hover:border-white/5 hover:bg-black/20 rounded px-2 py-1.5 transition-all duration-300"
                      >
                        <div
                          onClick={() => setExpandedIndex(isExpanded ? null : i)}
                          className="flex items-center justify-between cursor-pointer text-zinc-500 hover:text-zinc-300"
                        >
                          <div className="flex items-center gap-2 overflow-hidden mr-4">
                            <span className="text-zinc-600 font-bold shrink-0 text-xs">
                              [{sig.source.toUpperCase().replace("_", " ")}]
                            </span>
                            <span className="text-zinc-300 truncate text-xs">
                              {sig.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={
                                isBullish
                                  ? "text-emerald-500/80"
                                  : isBearish
                                  ? "text-rose-500/80"
                                  : "text-zinc-500"
                              }
                            >
                              {scoreVal > 0 ? "+" : ""}
                              {scoreVal.toFixed(2)}
                            </span>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1 rounded select-none">
                              CLASSIFIED
                            </span>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-white/5 mt-2 pt-2 text-zinc-400 space-y-1.5"
                            >
                              <div className="text-xs">
                                <span className="text-zinc-600 font-bold">ANALYSIS:</span>{" "}
                                {sig.reasoning || "No explanation provided."}
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-zinc-600 pt-1">
                                <span>
                                  Ingested:{" "}
                                  {new Date(sig.postedAt).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {sig.url && (
                                  <a
                                    href={sig.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-0.5 text-zinc-500 hover:text-zinc-300 underline"
                                  >
                                    VIEW SOURCE <ArrowSquareOut size={8} />
                                  </a>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] p-6 animate-pulse space-y-6">
      <div className="h-14 w-full max-w-7xl mx-auto rounded-2xl bg-zinc-900 border border-white/5" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto items-start">
        <div className="lg:col-span-5 h-[28rem] rounded-2xl bg-zinc-900 border border-white/5" />
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 rounded-2xl bg-zinc-900 border border-white/5" />
          <div className="h-48 rounded-2xl bg-zinc-900 border border-white/5" />
          <div className="h-48 rounded-2xl bg-zinc-900 border border-white/5" />
          <div className="h-48 rounded-2xl bg-zinc-900 border border-white/5" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
        <div className="lg:col-span-7 h-72 rounded-2xl bg-zinc-900 border border-white/5" />
        <div className="lg:col-span-5 h-72 rounded-2xl bg-zinc-900 border border-white/5" />
      </div>
    </div>
  );
}
