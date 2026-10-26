"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  CaretUp,
  CaretDown,
  CaretRight,
  ArrowClockwise,
  Terminal,
  ShieldCheck,
  ArrowSquareOut,
  Newspaper,
  RedditLogo,
  Coins,
} from "@phosphor-icons/react";
import SentimentChart from "./SentimentChart";
import HorizontalScale from "./HorizontalScale";
import TerminalLoader from "./TerminalLoader";
import BeveledCard from "./BeveledCard";
import Meter, { getSentimentColorClass } from "./meter";

function getRelativeTime(timestamp: string) {
  const ms = Date.now() - new Date(timestamp).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

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
    whaleScore: number;
    whaleNetFlowUsd: number;
    whaleLabel: string;
    whaleTransactions: Array<{
      txHash: string;
      amount: number;
      amountUsd: number;
      fromAddress: string;
      toAddress: string;
      timestamp: string;
      type: "inflow" | "outflow" | "transfer";
    }>;
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
    lastFlashScrapeAt: string | null;
    lastRedditScrapeAt: string | null;
  };
};

// Returns "Xm/Xh/Xd ago" if the last scrape is older than maxAgeHours, else null
function staleAge(lastScrapeAt: string | null, maxAgeHours: number): string | null {
  if (!lastScrapeAt) return "never";
  const ageMs = Date.now() - new Date(lastScrapeAt).getTime();
  if (ageMs <= maxAgeHours * 60 * 60 * 1000) return null;
  const hours = Math.floor(ageMs / (60 * 60 * 1000));
  return hours >= 24 ? `${Math.floor(hours / 24)}d ago` : `${hours}h ago`;
}

export default function Dashboard() {
  const [activeSymbol, setActiveSymbol] = useState("BTC");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  const fetchSentiment = async (symbol: string, force = false) => {
    const startTime = Date.now();
    try {
      setIsAnalyzing(true);
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
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1200 - elapsed);
      setTimeout(() => {
        setIsAnalyzing(false);
        setLoading(false);
        setRefreshing(false);
      }, remaining);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSentiment(activeSymbol);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeSymbol]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const startTime = Date.now();
    try {
      setIsAnalyzing(true);
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
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1200 - elapsed);
      setTimeout(() => {
        setIsAnalyzing(false);
        setLoading(false);
      }, remaining);
    }
  };

  const triggerForceRefresh = () => {
    setRefreshing(true);
    fetchSentiment(activeSymbol, true);
  };

  if (isAnalyzing) {
    return <TerminalLoader symbol={activeSymbol} />;
  }

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-[100dvh] w-full pt-20 bg-[#050505] text-zinc-100 font-sans antialiased overflow-x-hidden pb-16">
      <main className="max-w-7xl mx-auto px-4 pt-6">
        {/* Minimal Dashboard Header */}
        <div className="mb-8 pb-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] text-zinc-500 font-mono tracking-[0.2em] uppercase block">
              QUANTITATIVE TELEMETRY
            </span>
            <div className="flex items-baseline gap-4 mt-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white font-sans tracking-tight">
                Market Sentiment
              </h1>
            </div>
          </div>

          {/* Minimal Coin Selector Pill */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-mono tracking-wider hidden sm:inline-block">
              COIN:
            </span>
            <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 select-none">
              {["BTC", "ETH", "SOL"].map((sym) => {
                const isActive = activeSymbol === sym;
                return (
                  <button
                    key={sym}
                    onClick={() => setActiveSymbol(sym)}
                    className={`cursor-pointer px-3.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider transition-all duration-200 ${
                      isActive
                        ? "bg-white text-black shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-rose-950/20 border border-rose-500/20 rounded-xl px-5 py-3.5 flex items-center justify-between text-sm font-mono text-rose-400 mb-6"
            >
              <span>[SYSTEM ERROR] {error}</span>
              <button onClick={() => setError(null)} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* ── LEFT COLUMN: GAUGE + INGESTION FEED (lg:col-span-5) ── */}
            <div className="lg:col-span-5 flex flex-col gap-6 w-full animate-[fadeIn_0.6s_ease-out] h-full">
              {/* GAUGE PANEL */}
              <BeveledCard className="w-full">
                <div className="p-7">
                  <div className="flex justify-between items-start mb-6 font-mono text-xs text-zinc-500 tracking-wider">
                    <div>
                      <span className="block uppercase text-zinc-300 font-bold">
                        {data.ticker.name} Telemetry
                      </span>
                      <span className="text-[11px] text-zinc-500">ORACLE NODE / DEPLOYED</span>
                    </div>

                    {/* Minimal SYNC Button */}
                    <button
                      onClick={triggerForceRefresh}
                      disabled={refreshing}
                      className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-40 select-none"
                    >
                      <ArrowClockwise size={11} className={refreshing ? "animate-spin text-emerald-400" : ""} />
                      <span>{refreshing ? "REFRESHING" : "SYNC"}</span>
                    </button>
                  </div>

                  {/* Live Conversion Price readout */}
                  <div className="flex items-baseline justify-between mb-8">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono tracking-widest block uppercase">
                        LIVE CONVERSION
                      </span>
                      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mt-1 font-sans">
                        ${data.price ? data.price.usd.toLocaleString() : "N/A"}{" "}
                        <span className="text-xs text-zinc-500 font-mono font-normal">USD</span>
                      </h1>
                    </div>

                    {data.price && (
                      <div
                        className={`flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-full border ${
                          data.price.change24hPercent >= 0
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {data.price.change24hPercent >= 0 ? (
                          <CaretUp size={11} weight="bold" />
                        ) : (
                          <CaretDown size={11} weight="bold" />
                        )}
                        <span>{data.price.change24hPercent >= 0 ? "+" : ""}
                        {data.price.change24hPercent.toFixed(2)}%</span>
                      </div>
                    )}
                  </div>

                  <Meter
                    score={data.sentiment.score}
                    label={data.sentiment.label}
                    className="mt-6"
                  />
                </div>
              </BeveledCard>

              {/* INGESTION FEED PANEL */}
              <BeveledCard className="w-full flex-grow flex flex-col min-h-[480px]">
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4 font-mono text-zinc-400 text-xs tracking-widest border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Terminal size={15} className="text-emerald-400" />
                      <span className="font-bold text-white">INGESTION LOG — LIVE</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      STREAM ACTIVE
                    </span>
                  </div>

                  {/* Clean Feed List */}
                  <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {data.recentSignals.map((sig, i) => {
                      const isExpanded = expandedIndex === i;
                      const isBullish = sig.label === "bullish";
                      const isBearish = sig.label === "bearish";
                      const scoreVal = parseFloat(sig.score);

                      return (
                        <div
                          key={i}
                          className={`rounded-lg transition-colors border-b border-white/[0.04] last:border-0 ${
                            isExpanded ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <div
                            onClick={() => setExpandedIndex(isExpanded ? null : i)}
                            className="p-2.5 flex items-center justify-between cursor-pointer text-zinc-400 hover:text-zinc-200"
                          >
                            <div className="flex items-center gap-2 overflow-hidden mr-3">
                              <motion.span
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="shrink-0 text-zinc-500"
                              >
                                <CaretRight size={10} />
                              </motion.span>
                              <span className="text-zinc-500 font-bold shrink-0 text-[10px] tracking-wider">
                                [{sig.source.toUpperCase().replace("_", " ")}]
                              </span>
                              <span className="text-zinc-300 truncate text-xs font-sans">
                                {sig.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`font-bold px-2 py-0.5 rounded text-[11px] font-mono ${
                                  isBullish
                                    ? "text-emerald-400"
                                    : isBearish
                                    ? "text-rose-400"
                                    : "text-zinc-400"
                                }`}
                              >
                                {scoreVal > 0 ? "+" : ""}
                                {scoreVal.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden px-4 pb-3 pt-1 border-t border-white/5"
                              >
                                <div className="border-l border-emerald-500/40 pl-3 py-1 text-xs text-zinc-300 space-y-1.5">
                                  <div>
                                    <span className="text-emerald-400 font-mono text-[10px] font-bold">
                                      ANALYSIS:
                                    </span>{" "}
                                    {sig.reasoning || "No explanation provided."}
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1 font-mono">
                                    <span>
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
                                        className="flex items-center gap-1 text-zinc-400 hover:text-emerald-400 underline"
                                      >
                                        VIEW SOURCE <ArrowSquareOut size={8} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </BeveledCard>
            </div>

            {/* ── RIGHT COLUMN: 4-LAYER BENTO + CHART (lg:col-span-7) ── */}
            <div className="lg:col-span-7 flex flex-col gap-6 w-full animate-[fadeIn_0.6s_ease-out_delay-100ms] h-full">
              {/* Bento Grid */}
              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* L1 Flash News */}
                <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-200 group">
                  <div>
                    {/* Top Header Row */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-zinc-400 font-mono tracking-wider font-semibold uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        L1 — FLASH NEWS
                      </span>
                      <span className="text-xs text-zinc-400 font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
                        45% WT
                      </span>
                    </div>

                    {/* Middle Score & Source Row */}
                    <div className="flex justify-between items-baseline gap-2 mb-2">
                      <span
                        className={`font-mono text-4xl sm:text-5xl font-extrabold tracking-tight ${getSentimentColorClass(
                          data.sentiment.flashScore
                        )}`}
                      >
                        {data.sentiment.flashScore > 0 ? "+" : ""}
                        {data.sentiment.flashScore}
                      </span>
                      <div className="text-right">
                        <span className="text-sm sm:text-base text-zinc-100 flex items-center justify-end gap-1.5 font-sans font-medium">
                          <Newspaper size={17} className="text-emerald-400" />
                          CoinGecko + RSS
                        </span>
                        <span className="text-xs text-zinc-400 font-mono mt-0.5 block">
                          Real-time news ingestion
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Metadata Badges */}
                  <div className="border-t border-white/[0.06] pt-3.5 font-mono text-xs text-zinc-400 flex items-center justify-between mt-4">
                    <span className="flex items-center gap-2">
                      <span className="text-zinc-500">Status:</span>
                      {staleAge(data.meta.lastFlashScrapeAt, 2) ? (
                        <span className="text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                          Stale · {staleAge(data.meta.lastFlashScrapeAt, 2)}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                          Fresh Feed
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-zinc-500">Used:</span>
                      <span className="text-zinc-200 font-semibold">{data.meta.flashPostsUsed} items</span>
                    </span>
                  </div>
                </BeveledCard>

                {/* L2 Historic Reddit */}
                <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-200 group">
                  <div>
                    {/* Top Header Row */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-zinc-400 font-mono tracking-wider font-semibold uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                        L2 — HISTORIC REDDIT
                      </span>
                      <span className="text-xs text-zinc-400 font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
                        35% WT
                      </span>
                    </div>

                    {/* Middle Score & Source Row */}
                    <div className="flex justify-between items-baseline gap-2 mb-2">
                      <span
                        className={`font-mono text-4xl sm:text-5xl font-extrabold tracking-tight ${getSentimentColorClass(
                          data.sentiment.historicScore
                        )}`}
                      >
                        {data.sentiment.historicScore > 0 ? "+" : ""}
                        {data.sentiment.historicScore}
                      </span>
                      <div className="text-right">
                        <span className="text-sm sm:text-base text-zinc-100 flex items-center justify-end gap-1.5 font-sans font-medium">
                          <RedditLogo size={17} className="text-cyan-400" />
                          Subreddit Discussions
                        </span>
                        <span className="text-xs text-zinc-400 font-mono mt-0.5 block">
                          AI Analyzed sentiment
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Metadata Badges */}
                  <div className="border-t border-white/[0.06] pt-3.5 font-mono text-xs text-zinc-400 flex items-center justify-between mt-4">
                    <span className="flex items-center gap-2">
                      <span className="text-zinc-500">Source:</span>
                      {staleAge(data.meta.lastRedditScrapeAt, 12) ? (
                        <span className="text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                          Stale · {staleAge(data.meta.lastRedditScrapeAt, 12)}
                        </span>
                      ) : (
                        <span className="text-zinc-300 font-medium bg-white/[0.04] px-2 py-0.5 rounded border border-white/10 text-[11px]">
                          Arctic Shift
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-zinc-500">Analyzed:</span>
                      <span className="text-zinc-200 font-semibold">{data.sentiment.totalPostsAnalyzed} posts</span>
                    </span>
                  </div>
                </BeveledCard>

                {/* L3 Funding Rates */}
                <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-200 group">
                  <div>
                    {/* Top Header Row */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-zinc-400 font-mono tracking-wider font-semibold uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                        L3 — FUNDING RATES
                      </span>
                      <span className="text-xs text-zinc-400 font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
                        15% WT
                      </span>
                    </div>

                    {/* Middle Score & Source Row */}
                    <div className="flex justify-between items-baseline gap-2 mb-2">
                      <span
                        className={`font-mono text-4xl sm:text-5xl font-extrabold tracking-tight ${getSentimentColorClass(
                          data.sentiment.fundingScore
                        )}`}
                      >
                        {data.sentiment.fundingScore > 0 ? "+" : ""}
                        {data.sentiment.fundingScore}
                      </span>
                      <div className="text-right">
                        <span className="text-sm sm:text-base text-zinc-100 flex items-center justify-end gap-2 font-sans font-medium">
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
                          Binance Futures
                        </span>
                        <span className="text-xs text-zinc-400 font-mono mt-0.5 block">
                          Perpetual leverage positioning
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Metadata Badges */}
                  <div className="border-t border-white/[0.06] pt-3.5 font-mono text-xs text-zinc-400 flex items-center justify-between mt-4">
                    <span className="flex items-center gap-2">
                      <span className="text-zinc-500">Rate (8h):</span>
                      <span className="text-white font-semibold font-mono">
                        {(data.sentiment.fundingRate.rate * 100).toFixed(4)}%
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-zinc-500">Class:</span>
                      <span className="uppercase text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                        {data.sentiment.fundingRate.label.replace(/_/g, " ")}
                      </span>
                    </span>
                  </div>
                </BeveledCard>

                {/* L4 Global Fear & Greed */}
                <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-200 group">
                  <div>
                    {/* Top Header Row */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-zinc-400 font-mono tracking-wider font-semibold uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]" />
                        L4 — GLOBAL FEAR & GREED
                      </span>
                      <span className="text-xs text-zinc-400 font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
                        5% WT
                      </span>
                    </div>

                    {/* Middle Score & Source Row */}
                    <div className="flex justify-between items-baseline gap-2 mb-2">
                      <span
                        className={`font-mono text-4xl sm:text-5xl font-extrabold tracking-tight ${getSentimentColorClass(
                          data.sentiment.fearGreedScore
                        )}`}
                      >
                        {data.sentiment.fearGreedScore > 0 ? "+" : ""}
                        {data.sentiment.fearGreedScore}
                      </span>
                      <div className="text-right">
                        <span className="text-sm sm:text-base text-zinc-100 flex items-center justify-end gap-1.5 font-sans font-medium">
                          <ShieldCheck size={17} className="text-violet-400" />
                          Market Sentiment
                        </span>
                        <span className="text-xs text-zinc-400 font-mono mt-0.5 block">
                          Alternative.me index
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Metadata Badges */}
                  <div className="border-t border-white/[0.06] pt-3.5 font-mono text-xs text-zinc-400 flex items-center justify-between mt-4">
                    <span className="flex items-center gap-2">
                      <span className="text-zinc-500">Index Value:</span>
                      <span className="text-white font-semibold font-mono">
                        {data.sentiment.fearGreed.value}/100
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-zinc-500">State:</span>
                      <span className="uppercase text-violet-300 font-medium bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 text-[11px]">
                        {data.sentiment.fearGreed.label}
                      </span>
                    </span>
                  </div>
                </BeveledCard>

                {/* L5 Whale Movement Layer */}
                <BeveledCard className="md:col-span-2 p-6 flex flex-col justify-between min-h-[14rem]">
                  <div className="flex justify-between items-start border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono tracking-widest block uppercase font-bold">
                        L5 — WHALE MOVEMENT LAYER
                      </span>
                      <span className="text-sm text-zinc-200 flex items-center gap-2 mt-1 font-medium">
                        <Coins size={16} className="text-zinc-400" />
                        On-Chain Large Address Net Inflows
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`text-2xl font-extrabold ${getSentimentColorClass(data.sentiment.whaleScore)}`}>
                        {data.sentiment.whaleScore > 0 ? "+" : ""}{data.sentiment.whaleScore}
                      </span>
                      <span className="block text-[11px] text-zinc-400 mt-0.5 font-medium">
                        NET: {data.sentiment.whaleNetFlowUsd >= 0 ? "+" : ""}${(data.sentiment.whaleNetFlowUsd / 1e6).toFixed(2)}M
                      </span>
                    </div>
                  </div>

                  {/* Clean Transaction List */}
                  <div className="mt-4 flex-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono tracking-wider block mb-2">
                      RECENT BLOCKCHAIN MOVEMENT (24H)
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-xs pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent select-text">
                      {data.sentiment.whaleTransactions && data.sentiment.whaleTransactions.length > 0 ? (
                        data.sentiment.whaleTransactions.map((tx: any, idx: number) => {
                          const isAccum = tx.type === "outflow";
                          const isSell = tx.type === "inflow";
                          return (
                            <div
                              key={idx}
                              className="flex justify-between items-center py-2 px-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] rounded transition-colors"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="truncate text-zinc-300 font-sans text-xs max-w-[160px] sm:max-w-[260px]">
                                  {tx.fromAddress} → {tx.toAddress}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                  {getRelativeTime(tx.timestamp)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-zinc-400 text-xs font-mono">
                                  {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {activeSymbol} (${(tx.amountUsd / 1e6).toFixed(2)}M)
                                </span>
                                <span
                                  className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                                    isAccum
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : isSell
                                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                      : "bg-zinc-800 text-zinc-400"
                                  }`}
                                >
                                  {tx.type}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-zinc-600 text-xs font-mono">
                          NO SIGNIFICANT WHALE ACTIVITY DETECTED IN THIS BLOCK
                        </div>
                      )}
                    </div>
                  </div>
                </BeveledCard>
              </div>

              {/* Sentiment Chart Panel */}
              <BeveledCard className="w-full">
                <div className="p-7">
                  <div className="mb-6">
                    <SentimentChart data={data.timeseries} />
                  </div>

                  {/* Clean In-Depth Calculation Dropdown */}
                  <details className="group border border-white/5 rounded-xl bg-white/[0.01] overflow-hidden transition-all duration-200">
                    <summary className="flex justify-between items-center px-4 py-3 text-xs font-mono text-zinc-400 hover:text-white cursor-pointer select-none transition-colors border-b border-transparent group-open:border-white/5">
                      <span className="flex items-center gap-2 font-bold">HOW IS THIS CALCULATED?</span>
                      <span className="text-[10px] text-zinc-500 transition-transform duration-200 group-open:rotate-180">
                        ▼
                      </span>
                    </summary>
                    <div className="p-4 text-xs text-zinc-400 leading-relaxed font-mono space-y-3">
                      <div>
                        <h4 className="font-bold text-white mb-1.5 text-[11px] uppercase tracking-wider text-emerald-400">
                          1. Trend & Volume
                        </h4>
                        <p>
                          The trend line plots hourly sentiment (-100 to +100). The bottom volume bars show total post volume segmented by <span className="text-emerald-400 font-semibold">Bullish</span>, <span className="text-rose-400 font-semibold">Bearish</span>, and <span className="text-zinc-400 font-semibold">Neutral</span> posts.
                        </p>
                      </div>

                      <div className="border-t border-white/5 pt-3">
                        <h4 className="font-bold text-white mb-1.5 text-[11px] uppercase tracking-wider text-emerald-400">
                          2. Weighting Formula
                        </h4>
                        <p className="mb-2">
                          Calculated as a volume-weighted average incorporating source credibility (News: 1.0, CoinGecko: 0.9, Reddit: 0.7), log upvote boosts, and recency decay.
                        </p>
                        <div className="bg-black/50 p-2.5 rounded text-[10px] text-zinc-300 font-mono overflow-x-auto whitespace-pre">
{`Hourly Score = ∑ (Post Score × Source Weight × Upvote Boost × Recency Weight) / Total Posts`}
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              </BeveledCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] p-6 animate-pulse space-y-6">
      <div className="h-12 w-full max-w-7xl mx-auto rounded-full bg-zinc-900/60 border border-white/5 mt-4" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto items-start">
        {/* Left column skeleton */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          <div className="h-[28rem] rounded-2xl bg-zinc-900/60 border border-white/5" />
          <div className="h-[21rem] rounded-2xl bg-zinc-900/60 border border-white/5" />
        </div>
        {/* Right column skeleton */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-[12rem] rounded-2xl bg-zinc-900/60 border border-white/5" />
            <div className="h-[12rem] rounded-2xl bg-zinc-900/60 border border-white/5" />
            <div className="h-[12rem] rounded-2xl bg-zinc-900/60 border border-white/5" />
            <div className="h-[12rem] rounded-2xl bg-zinc-900/60 border border-white/5" />
          </div>
          <div className="h-[25rem] rounded-2xl bg-zinc-900/60 border border-white/5" />
        </div>
      </div>
    </div>
  );
}
