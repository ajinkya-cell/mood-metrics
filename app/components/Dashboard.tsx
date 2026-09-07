"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  CaretUp,
  CaretDown,
  CaretRight,
  MagnifyingGlass,
  ArrowClockwise,
  Terminal,
  ShieldCheck,
  ArrowSquareOut,
  Newspaper,
  RedditLogo,
} from "@phosphor-icons/react";
import SentimentChart from "./SentimentChart";
import HorizontalScale from "./HorizontalScale";
import GlowCard from "./GlowCard";
import TerminalLoader from "./TerminalLoader";
import DoubleBezel from "./DoubleBezel";
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
        <div className="mb-8 pb-6 border-b border-white/5">
          <span className="text-[10px] text-zinc-500 font-mono tracking-[0.2em] uppercase block">
            QUANTITATIVE COCKPIT
          </span>
          <div className="flex items-baseline gap-4 md:gap-6 mt-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-sans">
              Market Sentiment
            </h1>
            
            {/* Minimal Coin Selector */}
            <div className="flex items-center gap-3 md:gap-4 font-mono text-xs tracking-widest select-none">
              <span className="text-zinc-700 font-bold">/</span>
              {["BTC", "ETH", "SOL"].map((sym) => {
                const isActive = activeSymbol === sym;
                return (
                  <button
                    key={sym}
                    onClick={() => setActiveSymbol(sym)}
                    className={`cursor-pointer py-0.5 transition-all duration-200 hover:text-white ${
                      isActive
                        ? "text-emerald-400 font-extrabold border-b-2 border-emerald-500/80 px-0.5"
                        : "text-zinc-500"
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* ── LEFT COLUMN: GAUGE + INGESTION FEED (lg:col-span-5) ── */}
            <div className="lg:col-span-5 flex flex-col gap-6 w-full animate-[fadeIn_0.6s_ease-out] h-full">
              {/* GAUGE PANEL wrapped in DoubleBezel */}
              <DoubleBezel className="w-full">
                <div className="p-8">
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
                      className="flex items-center gap-1.5 text-xs bg-white/5 border border-white/5 hover:border-white/10 px-2.5 py-1.5 rounded-md text-zinc-400 transition-all duration-300 hover:text-zinc-200 active:scale-95 disabled:opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.03)] hover:shadow-[0_0_15px_rgba(255,255,255,0.06)] cursor-pointer"
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

                  <Meter
                    score={data.sentiment.score}
                    label={data.sentiment.label}
                    className="mt-6"
                  />
                </div>
              </DoubleBezel>

              {/* INGESTION FEED PANEL wrapped in DoubleBezel */}
              <DoubleBezel className="w-full flex-grow flex flex-col">
                <div className="p-6 flex flex-col flex-1 min-h-[400px]">
                  <div className="flex items-center justify-between mb-4 font-mono text-zinc-500 text-xs tracking-widest border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-emerald-500" />
                      <span>INGESTION LOG — LIVE TELEMETRY</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 pr-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                    {data.recentSignals.map((sig, i) => {
                      const isExpanded = expandedIndex === i;
                      const isBullish = sig.label === "bullish";
                      const isBearish = sig.label === "bearish";
                      const scoreVal = parseFloat(sig.score);

                      return (
                        <div
                          key={i}
                          className={`border-b border-white/5 hover:bg-white/[0.02] px-2 py-2 transition-all duration-300 rounded-lg ${
                            isExpanded ? "bg-white/[0.02]" : ""
                          }`}
                        >
                          <div
                            onClick={() => setExpandedIndex(isExpanded ? null : i)}
                            className="flex items-center justify-between cursor-pointer text-zinc-400 hover:text-zinc-200"
                          >
                            <div className="flex items-center gap-2 overflow-hidden mr-4">
                              <motion.span
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="shrink-0 text-zinc-600"
                              >
                                <CaretRight size={10} />
                              </motion.span>
                              <span className="text-zinc-600 font-bold shrink-0 text-xs tracking-wider">
                                [{sig.source.toUpperCase().replace("_", " ")}]
                              </span>
                              <span className="text-zinc-300 truncate text-xs">
                                {sig.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`font-bold ${
                                  isBullish
                                    ? "text-emerald-500"
                                    : isBearish
                                    ? "text-rose-500"
                                    : "text-zinc-500"
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
                                className="overflow-hidden mt-2 text-zinc-400 space-y-2 border-t border-white/5 pt-2 pl-4"
                              >
                                <div className="text-xs leading-relaxed">
                                  <span className="text-zinc-600 font-bold font-mono">ANALYSIS:</span>{" "}
                                  {sig.reasoning || "No explanation provided."}
                                </div>
                                <div className="flex justify-between items-center text-xs text-zinc-600 pt-1 font-mono">
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
              </DoubleBezel>
            </div>

            {/* ── RIGHT COLUMN: 4-LAYER BENTO + CHART (lg:col-span-7) ── */}
            <div className="lg:col-span-7 flex flex-col gap-6 w-full animate-[fadeIn_0.6s_ease-out_delay-100ms] h-full">
              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlowCard accent="emerald" className="p-6 flex flex-col justify-between min-h-[12rem] hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-zinc-500 font-mono tracking-widest block">
                        L1 — FLASH NEWS (45%)
                      </span>
                      <span className="text-sm text-zinc-300 flex items-center gap-1.5 mt-2">
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

                <GlowCard accent="emerald" className="p-6 flex flex-col justify-between min-h-[12rem] hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-zinc-500 font-mono tracking-widest block">
                        L2 — HISTORIC REDDIT (35%)
                      </span>
                      <span className="text-sm text-zinc-300 flex items-center gap-1.5 mt-2">
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
                    <span>Via: Arctic Shift mirror</span>
                    <span>Total analyzed: {data.sentiment.totalPostsAnalyzed}</span>
                  </div>
                </GlowCard>

                <GlowCard accent="emerald" className="p-6 flex flex-col justify-between min-h-[12rem] hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-zinc-500 font-mono tracking-widest block">
                        L3 — FUNDING RATES (15%)
                      </span>
                      <span className="text-sm text-zinc-300 flex items-center gap-2 mt-2">
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

                <GlowCard accent="emerald" className="p-6 flex flex-col justify-between min-h-[12rem] hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-zinc-500 font-mono tracking-widest block">
                        L4 — GLOBAL FEAR & GREED (5%)
                      </span>
                      <span className="text-sm text-zinc-300 flex items-center gap-1.5 mt-2">
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

                {/* L5 Whale Movement Layer */}
                <GlowCard accent="emerald" className="md:col-span-2 p-6 flex flex-col justify-between min-h-[14rem] hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex justify-between items-start border-b border-white/5 pb-3">
                    <div>
                      <span className="text-xs text-zinc-500 font-mono tracking-widest block">
                        L5 — WHALE MOVEMENT LAYER (TELEMETRY)
                      </span>
                      <span className="text-sm text-zinc-300 flex items-center gap-1.5 mt-2">
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            data.sentiment.whaleNetFlowUsd >= 0 ? "bg-emerald-400" : "bg-rose-400"
                          }`} />
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${
                            data.sentiment.whaleNetFlowUsd >= 0 ? "bg-emerald-500" : "bg-rose-500"
                          }`} />
                        </span>
                        On-Chain Large Address Net Inflows
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`text-xl font-bold ${getSentimentColorClass(data.sentiment.whaleScore)}`}>
                        {data.sentiment.whaleScore > 0 ? "+" : ""}{data.sentiment.whaleScore}
                      </span>
                      <span className="block text-xs text-zinc-500 mt-0.5">
                        NET FLOW: {data.sentiment.whaleNetFlowUsd >= 0 ? "+" : ""}${(data.sentiment.whaleNetFlowUsd / 1e6).toFixed(2)}M
                      </span>
                    </div>
                  </div>
                  
                  {/* List of recent transactions */}
                  <div className="mt-4 flex-1">
                    <span className="text-xs text-zinc-500 font-bold uppercase font-mono tracking-wider block mb-2">RECENT BLOCKCHAIN MOVEMENT (24H)</span>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 font-mono text-xs pr-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent select-text">
                      {data.sentiment.whaleTransactions && data.sentiment.whaleTransactions.length > 0 ? (
                        data.sentiment.whaleTransactions.map((tx: any, idx: number) => {
                          const isAccum = tx.type === "outflow";
                          const isSell = tx.type === "inflow";
                          return (
                            <div key={idx} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0 hover:bg-white/[0.01] px-1 rounded">
                              <div className="flex flex-col min-w-0">
                                <span className="truncate text-zinc-300 font-sans text-xs max-w-[160px] sm:max-w-[240px]">
                                  {tx.fromAddress} → {tx.toAddress}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                  {getRelativeTime(tx.timestamp)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-zinc-500">
                                  {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {activeSymbol} (${(tx.amountUsd / 1e6).toFixed(2)}M)
                                </span>
                                <span className={`font-bold text-[10px] uppercase px-1.5 py-0.5 rounded ${
                                  isAccum ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20" :
                                  isSell ? "bg-rose-950/20 text-rose-400 border border-rose-500/20" :
                                  "bg-zinc-900 text-zinc-500"
                                }`}>
                                  {tx.type}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-zinc-650 text-xs">NO SIGNIFICANT WHALE ACTIVITY DETECTED IN THIS BLOCK</div>
                      )}
                    </div>
                  </div>
                </GlowCard>
              </div>

              {/* Sentiment Chart Panel wrapped in DoubleBezel */}
              <DoubleBezel className="w-full">
                <div className="p-8">
                  <SentimentChart data={data.timeseries} />
                  
                  {/* Detailed In-Depth Calculation Dropdown */}
                  <details className="group mt-6 border border-white/5 rounded-xl bg-black/20 overflow-hidden transition-all duration-300">
                    <summary className="flex justify-between items-center px-5 py-3.5 text-xs font-mono font-bold text-zinc-400 hover:text-white cursor-pointer select-none transition-colors border-b border-transparent group-open:border-white/5 bg-white/[0.01]">
                      <span className="flex items-center gap-2">HOW IS THIS CALCULATED?</span>
                      <span className="text-[10px] text-zinc-500 transition-transform duration-300 group-open:rotate-180">▼</span>
                    </summary>
                    <div className="p-5 text-xs text-zinc-400 leading-relaxed font-mono space-y-4">
                      <div>
                        <h4 className="font-bold text-white mb-2 text-[11px] uppercase tracking-wider text-emerald-400">1. What the Graph Suggests</h4>
                        <p className="mb-3">The graph tells you two main things about the coin's community conversation:</p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li><strong>The Sentiment Trend (The Line):</strong> Plots the overall mood of the discussion hour-by-hour. A line rising toward +100 indicates that the conversation has become highly optimistic (bullish), while a drop toward -100 suggests panic or bearishness.</li>
                          <li><strong>The Activity Volume (The Bottom Bars):</strong> The height of the bars at the bottom represents the volume of posts/news articles analyzed in that specific hour. The color segments show the exact mix of posts: <span className="text-emerald-400 font-bold">Green</span> (bullish), <span className="text-rose-400 font-bold">Red</span> (bearish), and <span className="text-zinc-500 font-bold">Gray</span> (neutral). This helps you see if a sentiment shift was backed by high volume or just a few posts.</li>
                        </ul>
                      </div>
                      
                      <div className="border-t border-white/5 pt-4">
                        <h4 className="font-bold text-white mb-2 text-[11px] uppercase tracking-wider text-emerald-400">2. How the Score is Calculated</h4>
                        <p className="mb-3">The timeline pulls data from the <code>sentiment_timeseries</code> table. For each 1-hour bucket, the sentiment score is a volume-weighted average of all posts and news articles that were published in that hour, defined by this formula:</p>
                        <div className="my-4 p-3 bg-black/40 border border-white/5 rounded-lg text-center font-bold text-zinc-300 text-[10px] overflow-x-auto whitespace-pre">
{`                 ∑ (Post Score × Source Weight × Upvote Boost × Recency Weight)
  Hourly Score = ─────────────────────────────────────────────────────────────
                                      Total Posts in Hour`}
                        </div>
                        <p className="mb-3">Here is how each component of the weight is determined (as coded in <code>sentiment.ts</code>):</p>
                        <ol className="list-decimal pl-5 space-y-2.5">
                          <li><strong>AI Post Score:</strong> Each post is analyzed by Llama 3.1 8B, which returns a score from -1.0 (extremely bearish) to +1.0 (extremely bullish).</li>
                          <li><strong>Source Weight:</strong> Not all sources are treated equal. Professional news is given higher credibility weights than forum posts:
                            <ul className="list-disc pl-5 mt-1.5 space-y-1">
                              <li>RSS News Articles: 1.0 weight (highest credibility)</li>
                              <li>CoinGecko News: 0.9 weight</li>
                              <li>Reddit Posts: 0.7 weight</li>
                            </ul>
                          </li>
                          <li><strong>Upvote Boost:</strong> To prevent random low-quality posts from swaying the score, posts with high engagement get a logarithmic boost: <code>Boost = 1 + (log₁₀(Upvotes) × 0.1)</code>. This ensures that viral community posts have a stronger influence.</li>
                          <li><strong>Recency Weight:</strong> Decays the weight of a post exponentially depending on how close it was to the boundary of the hour, emphasizing the newest information in that block.</li>
                        </ol>
                      </div>
                    </div>
                  </details>
                </div>
              </DoubleBezel>
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
      <div className="h-14 w-full max-w-7xl mx-auto rounded-full bg-zinc-950 border border-white/5 mt-4" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto items-start">
        {/* Left column skeleton */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          <div className="h-[28rem] rounded-[2rem] bg-zinc-950 border border-white/5" />
          <div className="h-[21rem] rounded-[2rem] bg-zinc-950 border border-white/5" />
        </div>
        {/* Right column skeleton */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-[12rem] rounded-2xl bg-zinc-950 border border-white/5" />
            <div className="h-[12rem] rounded-2xl bg-zinc-950 border border-white/5" />
            <div className="h-[12rem] rounded-2xl bg-zinc-950 border border-white/5" />
            <div className="h-[12rem] rounded-2xl bg-zinc-950 border border-white/5" />
          </div>
          <div className="h-[25rem] rounded-[2rem] bg-zinc-950 border border-white/5" />
        </div>
      </div>
    </div>
  );
}
