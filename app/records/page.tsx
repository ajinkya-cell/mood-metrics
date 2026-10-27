"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Funnel,
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  Newspaper,
  RedditLogo,
  Eye,
  MagnifyingGlass,
  ChartLineUp,
  Brain,
  CaretDown,
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "motion/react";
import BeveledCard from "../components/BeveledCard";
import SentimentChart from "../components/SentimentChart";
import { PageShell, PageHero, Hatch, SectionHeading, GlassSegmented } from "../components/editorial";

const SYMBOLS = ["ALL", "BTC", "ETH", "SOL"] as const;
const COINS = ["BTC", "ETH", "SOL"] as const;
type Coin = (typeof COINS)[number];
type AssetFilter = (typeof SYMBOLS)[number];

// Define Types
type SentimentRecord = {
  id: string;
  label: "bullish" | "bearish" | "neutral";
  score: string;
  confidence: string;
  reasoning: string;
  analyzedAt: string;
  postTitle: string;
  postContent: string;
  postUrl: string | null;
  sourceType: "reddit" | "coingecko" | "news_rss";
  postedAt: string;
  upvotes: number;
  tickerSymbol: string;
  tickerName: string;
  similarity?: number | null;
};

type TimeseriesPoint = {
  time: string;
  score: number;
  posts: number;
  bullish: number;
  bearish: number;
  neutral: number;
};

type Stats = {
  avgScore: number;
  avgConfidence: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  totalCount: number;
};

type Ticker = {
  symbol: string;
  name: string;
};

// Strip HTML tags and common entities
function cleanHtmlText(html: string): string {
  if (!html) return "";
  let clean = html.replace(/<[^>]*>/g, "");
  clean = clean
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
  return clean.trim();
}

export default function SentimentRecordsPage() {
  // Filter States
  const [selectedSymbol, setSelectedSymbol] = useState<string>("ALL");
  const [selectedLabel, setSelectedLabel] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<string>("text"); // "text" | "semantic"
  const [timeframe, setTimeframe] = useState<string>("7d");
  const [limit] = useState<number>(20);
  const [page, setPage] = useState<number>(0);

  // Data States
  const [records, setRecords] = useState<SentimentRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    avgScore: 0,
    avgConfidence: 0,
    bullishCount: 0,
    bearishCount: 0,
    neutralCount: 0,
    totalCount: 0,
  });
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [tickersList, setTickersList] = useState<Ticker[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [blendedScore, setBlendedScore] = useState<number | null>(null);
  const [fearGreed, setFearGreed] = useState<{ value: number; label: string } | null>(null);

  // Collapsed states for reasoning details
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Which coin the timeline actually shows: the API falls back to BTC when the filter is "ALL"
  const [timeseriesSymbol, setTimeseriesSymbol] = useState<string>("BTC");

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = page * limit;
      const query = new URLSearchParams({
        symbol: selectedSymbol,
        label: selectedLabel,
        source: selectedSource,
        search: searchQuery,
        searchType,
        timeframe,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const res = await fetch(`/api/records?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load records from api");
      const data = await res.json();

      setRecords(data.records);
      setStats(data.stats);
      setTimeseries(data.timeseries);
      setTimeseriesSymbol(data.meta?.tickerForTimeseries ?? (selectedSymbol === "ALL" ? "BTC" : selectedSymbol));
      setTickersList(data.tickers);

      // Fetch blended sentiment score for active symbol (or BTC as benchmark)
      try {
        const blendSymbol = selectedSymbol === "ALL" ? "BTC" : selectedSymbol;
        const blendRes = await fetch(`/api/analyze?symbol=${blendSymbol}`);
        if (blendRes.ok) {
          const blendData = await blendRes.json();
          setBlendedScore(blendData.sentiment.score);
          if (blendData.sentiment.fearGreed) {
            setFearGreed({
              value: blendData.sentiment.fearGreed.value,
              label: blendData.sentiment.fearGreed.label,
            });
          } else {
            setFearGreed(null);
          }
        } else {
          setBlendedScore(null);
          setFearGreed(null);
        }
      } catch (blendErr) {
        console.warn("Failed to fetch blended score:", blendErr);
        setBlendedScore(null);
        setFearGreed(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when filters or pagination changes
  useEffect(() => {
    fetchData();
  }, [selectedSymbol, selectedLabel, selectedSource, timeframe, page]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchData();
  };

  // Render AI Verdict Matrix (Scatter Plot of score vs confidence)
  const renderVerdictMatrix = () => {
    if (isLoading) return null;

    const width = 300;
    const height = 200;
    const padding = 20;

    return (
      <BeveledCard className="p-6 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} className="text-[var(--ed-fg-55)]" />
            <h3 className="ed-eyebrow">
              Verdict scatter
            </h3>
          </div>
          <p className="text-[13px] text-[var(--ed-fg-55)] mb-2 leading-relaxed">
            Each post: AI score (−1 to +1) against the model&apos;s confidence.
          </p>
          <span className="ed-tag mb-4 inline-flex">
            <span className="ed-square bg-[#F28C45]" />
            {selectedSymbol === "ALL" ? "Posts from BTC · ETH · SOL" : `${selectedSymbol} posts only`}
          </span>

          <div className="ed-tray p-2 flex items-center justify-center">
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
              <line
                x1={width / 2}
                y1={padding}
                x2={width / 2}
                y2={height - padding}
                stroke="rgba(255,255,255,0.06)"
              />
              <line
                x1={padding}
                y1={height - padding}
                x2={width - padding}
                y2={height - padding}
                stroke="rgba(255,255,255,0.06)"
              />
              <line
                x1={padding}
                y1={height / 2}
                x2={width - padding}
                y2={height / 2}
                stroke="rgba(255,255,255,0.045)"
              />

              {records.map((r, idx) => {
                const s = parseFloat(r.score);
                const c = parseFloat(r.confidence ?? "0.5");

                const xVal = padding + ((s + 1) / 2) * (width - padding * 2);
                const yVal = height - padding - c * (height - padding * 2);

                // void-ui pearls, each seated in a ring of the tray colour so overlaps stay
                // legible. Bullish solid, bearish a hollow ring, neutral small and dim.
                const bull = r.label === "bullish";
                const bear = r.label === "bearish";

                return (
                  <g key={r.id || idx} className="cursor-pointer">
                    <title>
                      {r.tickerSymbol}: score {s}, confidence {Math.round(c * 100)}%
                    </title>
                    <circle cx={xVal} cy={yVal} r={bull || bear ? 5.5 : 4} fill="#0c0c0d" />
                    {bull ? (
                      <circle cx={xVal} cy={yVal} r="3.5" fill="rgb(126 190 152)" />
                    ) : bear ? (
                      <circle cx={xVal} cy={yVal} r="2.8" fill="#0c0c0d" stroke="rgb(229 115 115)" strokeWidth="1.5" />
                    ) : (
                      <circle cx={xVal} cy={yVal} r="2" fill="rgba(255,255,255,0.3)" />
                    )}
                  </g>
                );
              })}

              <text x={padding} y={height - 5} fill="rgb(115 115 115)" fontSize="10.5">
                Bearish
              </text>
              <text x={width - padding} y={height - 5} textAnchor="end" fill="rgb(115 115 115)" fontSize="10.5">
                Bullish
              </text>
              <text x={width / 2} y={padding - 5} textAnchor="middle" fill="rgb(115 115 115)" fontSize="10.5">
                100% confidence
              </text>
            </svg>
          </div>
        </div>

        <div className="border-t border-[var(--ed-border)] pt-3 mt-4 text-[13px] text-[var(--ed-fg-55)] flex justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[rgb(126_190_152)]" /> Bullish
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" /> Neutral
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border-[1.5px] border-[rgb(229_115_115)]" /> Bearish
          </span>
        </div>
      </BeveledCard>
    );
  };

  return (
    <PageShell>
      <PageHero
        micro="Quantitative ledger · AI-classified posts"
        lead="Every post the"
        accent="AI"
        tail=" has read."
        description="Granular records from Reddit and news feeds, with the model's verdict, confidence and reasoning, plus the trends they add up to."
        aside={
          <>
            <span className="ed-micro">Filter asset</span>
            <GlassSegmented
              options={SYMBOLS}
              value={selectedSymbol as AssetFilter}
              onChange={(sym) => {
                setSelectedSymbol(sym);
                setPage(0);
              }}
              layoutId="recordsSymbol"
            />
          </>
        }
      />

      {/* Grid of 6 Telemetry Summary Cards */}
      <section className="px-4 md:px-5 pb-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-[var(--ed-border)] pt-5">
        {/* Dashboard Blended Sentiment Score */}
        <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem]">
          <div>
            <div className="ed-eyebrow mb-2 flex items-center justify-between">
              <span>BLENDED SENTIMENT</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                {selectedSymbol === "ALL" ? "BTC Benchmark" : selectedSymbol}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`font-display text-6xl leading-none tracking-tight tabular-nums ${
                  blendedScore !== null
                    ? blendedScore > 20
                      ? "text-emerald-400"
                      : blendedScore < -20
                      ? "text-rose-400"
                      : "text-zinc-200"
                    : "text-zinc-500"
                }`}
              >
                {isLoading ? (
                  <span className="text-xl text-zinc-500 animate-pulse font-mono">LOADING...</span>
                ) : blendedScore !== null ? (
                  blendedScore > 0 ? `+${blendedScore}` : blendedScore
                ) : (
                  "N/A"
                )}
              </span>
              {!isLoading && blendedScore !== null && <span className="text-xs text-zinc-500 font-mono">(-100 to +100)</span>}
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-400 font-sans border-t border-[var(--ed-border)] pt-3 flex flex-col gap-1">
            <span>Weighted index combining social text, leverage, and Fear & Greed.</span>
            <Link href="/methodology" className="text-[13px] text-[var(--ed-fg-70)] hover:text-white transition-colors mt-0.5">
              READ METHODOLOGY →
            </Link>
          </div>
        </BeveledCard>

        {/* Average Sentiment Score */}
        <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem]">
          <div>
            <div className="ed-eyebrow mb-2">
              AVERAGE TEXT SENTIMENT
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`font-display text-6xl leading-none tracking-tight tabular-nums ${
                  stats.avgScore > 0.2
                    ? "text-emerald-400"
                    : stats.avgScore < -0.2
                    ? "text-rose-400"
                    : "text-zinc-200"
                }`}
              >
                {stats.avgScore > 0 ? "+" : ""}
                {Math.round(stats.avgScore * 100)}
              </span>
              <span className="text-xs text-zinc-500 font-mono">(-100 to +100)</span>
            </div>
          </div>
          <div className="mt-4 text-xs leading-relaxed text-zinc-400 font-sans border-t border-[var(--ed-border)] pt-3 flex flex-col gap-1">
            <span>
              <span className="text-amber-400 font-mono font-semibold">NOTE:</span> Measures raw text. Blended score incorporates contrarian indicators.
            </span>
            <Link href="/methodology" className="text-[13px] text-[var(--ed-fg-70)] hover:text-white transition-colors mt-0.5">
              READ METHODOLOGY →
            </Link>
          </div>
        </BeveledCard>

        {/* AI Confidence */}
        <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem]">
          <div>
            <div className="ed-eyebrow mb-2">
              AI CLASSIFIER CONFIDENCE
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-6xl leading-none tracking-tight tabular-nums text-white">
                {Math.round(stats.avgConfidence * 100)}%
              </span>
              <span className="text-xs text-zinc-500 font-mono">ACCURACY BIAS</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-400 font-sans border-t border-[var(--ed-border)] pt-3">
            Average confidence the AI model reports for its calls.
          </div>
        </BeveledCard>

        {/* Signals Distribution */}
        <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem]">
          <div>
            <div className="ed-eyebrow mb-2">
              LABEL RATIO MATRIX
            </div>
            <div className="space-y-1.5 mt-2 font-mono text-xs">
              <div className="flex justify-between text-zinc-300">
                <span className="text-emerald-400 font-semibold">BULLISH</span>
                <span>
                  {stats.bullishCount} ({stats.totalCount > 0 ? Math.round((stats.bullishCount / stats.totalCount) * 100) : 0}%)
                </span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span className="text-zinc-500 font-semibold">NEUTRAL</span>
                <span>
                  {stats.neutralCount} ({stats.totalCount > 0 ? Math.round((stats.neutralCount / stats.totalCount) * 100) : 0}%)
                </span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span className="text-rose-400 font-semibold">BEARISH</span>
                <span>
                  {stats.bearishCount} ({stats.totalCount > 0 ? Math.round((stats.bearishCount / stats.totalCount) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-500 font-sans border-t border-[var(--ed-border)] pt-3">
            Ratio metrics for sentiment label slices.
          </div>
        </BeveledCard>

        {/* Total Volume */}
        <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem]">
          <div>
            <div className="ed-eyebrow mb-2">
              TOTAL INGESTED LOGS
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-6xl leading-none tracking-tight tabular-nums text-white">
                {stats.totalCount}
              </span>
              <span className="text-xs text-zinc-500 font-mono">RECORDS</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-400 font-sans border-t border-[var(--ed-border)] pt-3">
            Total records meeting the active query criteria.
          </div>
        </BeveledCard>

        {/* Fear & Greed Index */}
        <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem]">
          <div>
            <div className="ed-eyebrow mb-2">
              FEAR & GREED INDEX
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-6xl leading-none tracking-tight tabular-nums text-white">
                  {isLoading ? (
                    <span className="text-xl text-zinc-500 animate-pulse font-mono">LOADING...</span>
                  ) : fearGreed !== null ? (
                    fearGreed.value
                  ) : (
                    "N/A"
                  )}
                </span>
                {!isLoading && fearGreed !== null && <span className="text-xs text-zinc-500 font-mono">/ 100</span>}
              </div>
              <span className="text-xs font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full border border-[var(--ed-border)] bg-white/[0.03] text-zinc-300">
                {isLoading ? "LOADING" : fearGreed !== null ? fearGreed.label : "N/A"}
              </span>
            </div>

            {/* Clean Progress Meter */}
            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 transition-all duration-500"
                  style={{ width: fearGreed !== null ? `${fearGreed.value}%` : '0%' }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>0 FEAR</span>
                <span>50 NEUTRAL</span>
                <span>100 GREED</span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-400 font-sans border-t border-[var(--ed-border)] pt-3 flex flex-col gap-1">
            <span>Global indicator measuring market leverage and sentiment.</span>
            <a 
              href="https://alternative.me/crypto/fear-and-greed-index/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[13px] text-[var(--ed-fg-70)] hover:text-white transition-colors"
            >
              ALTERNATIVE.ME SOURCE →
            </a>
          </div>
        </BeveledCard>
      </section>

      <Hatch />

      <SectionHeading
        eyebrow="Trends"
        lead="Seven days of"
        accent="verdicts"
        aside="One coin's hourly sentiment over the last week, and how confident the model was in each call."
      />
      <section className="px-4 md:px-5 pb-5 grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left main grid: Chronological chart */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <BeveledCard className="p-7">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-5 border-b border-[var(--ed-border)] pb-4">
              <div className="flex flex-col gap-1.5">
                <h2 className="ed-eyebrow flex items-center gap-2">
                  <ChartLineUp size={14} />
                  Sentiment timeline · {timeseriesSymbol} · 7 days
                </h2>
                <p className="text-[12.5px] text-[var(--ed-fg-55)]">
                  {selectedSymbol === "ALL"
                    ? `One coin at a time, not a combined line. Showing ${timeseriesSymbol}; pick another to switch.`
                    : `${timeseriesSymbol} only. The records below are filtered to it too.`}
                </p>
              </div>
              {/* Per-chart coin picker; it also sets the page's asset filter */}
              <GlassSegmented
                options={COINS}
                value={timeseriesSymbol as Coin}
                onChange={(sym) => {
                  setSelectedSymbol(sym);
                  setPage(0);
                }}
                layoutId="timelineSymbol"
              />
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center font-mono text-zinc-500 text-sm animate-pulse">
                RETRIEVING HISTORICAL TELEMETRY MATRIX...
              </div>
            ) : (
              <SentimentChart data={timeseries} />
            )}

            <details className="group mt-6 rounded-xl shadow-[0_0_0_1px_var(--ed-border)] overflow-hidden">
              <summary className="flex justify-between items-center px-4 py-3 cursor-pointer select-none list-none">
                <span className="ed-eyebrow">What is this chart?</span>
                <CaretDown size={12} className="text-[var(--ed-fg-50)] transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 pt-1 text-[14px] leading-relaxed text-[var(--ed-fg-70)] space-y-3">
                <p>
                  Every Reddit post and news article about <span className="text-white">{timeseriesSymbol}</span> gets a score from the AI, from
                  −100 (very bearish) to +100 (very bullish). Each hour&apos;s posts are averaged, weighted by engagement, into one number.
                </p>
                <ul className="space-y-1.5">
                  <li><span className="text-white">Thin line</span>: the raw hourly score. It jumps around because some hours have only a few posts.</li>
                  <li><span className="text-white">Bold line</span>: a rolling average of those hours, so the trend is easy to follow.</li>
                  <li><span className="text-[#F28C45]">Orange area</span>: the trend is above zero (net bullish). The faint area below zero is net bearish.</li>
                  <li><span className="text-white">Bars at the bottom</span>: how many posts were scored that hour. A spike on a tall bar carries more weight than one on a short bar.</li>
                </ul>
                <p>
                  Switch 24H / 3D / 7D to zoom, and hover for any hour&apos;s exact score and post count. Timelines are kept per coin because
                  BTC, ETH and SOL often move on different news, so averaging them would hide that.
                </p>
              </div>
            </details>
          </BeveledCard>
        </div>

        {/* Right main grid: Scatter Plot Matrix */}
        <div className="lg:col-span-4">
          {renderVerdictMatrix()}
        </div>
      </section>

      <Hatch />

      <SectionHeading
        eyebrow="Ledger"
        lead="Search the"
        accent="records"
        aside="Filter by verdict and source, or switch to AI semantic search to find posts by meaning."
      />
      <section className="px-4 md:px-5 pb-5 space-y-3">
      {/* Filter deck */}
      <BeveledCard className="p-6 md:p-7">
        <h2 className="ed-eyebrow flex items-center gap-2 mb-5">
          <Funnel size={14} />
          Filters
        </h2>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Label Selector */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="ed-eyebrow">LABEL</label>
            <select
              value={selectedLabel}
              onChange={(e) => {
                setSelectedLabel(e.target.value);
                setPage(0);
              }}
              className="bg-white/[0.03] border border-[var(--ed-border)] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30 w-full cursor-pointer transition-colors font-mono"
            >
              <option value="ALL" className="bg-[#131314]">ALL LABELS</option>
              <option value="BULLISH" className="bg-[#131314]">BULLISH</option>
              <option value="NEUTRAL" className="bg-[#131314]">NEUTRAL</option>
              <option value="BEARISH" className="bg-[#131314]">BEARISH</option>
            </select>
          </div>

          {/* Source Selector */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="ed-eyebrow">SOURCE</label>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setPage(0);
              }}
              className="bg-white/[0.03] border border-[var(--ed-border)] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30 w-full cursor-pointer transition-colors font-mono"
            >
              <option value="ALL" className="bg-[#131314]">ALL SOURCES</option>
              <option value="REDDIT" className="bg-[#131314]">REDDIT BOARDS</option>
              <option value="COINGECKO" className="bg-[#131314]">COINGECKO</option>
              <option value="NEWS_RSS" className="bg-[#131314]">NEWS HEADLINES</option>
            </select>
          </div>

          {/* Search Mode Selector */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="ed-eyebrow">MODE</label>
            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setPage(0);
              }}
              className="bg-white/[0.03] border border-[var(--ed-border)] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30 w-full cursor-pointer transition-colors font-mono"
            >
              <option value="text" className="bg-[#131314]">KEYWORD</option>
              <option value="semantic" className="bg-[#131314]">AI SEMANTIC</option>
            </select>
          </div>

          {/* Text Search Input */}
          <div className="md:col-span-3 flex flex-col gap-1.5 relative">
            <label className="ed-eyebrow">
              {searchType === "semantic" ? "AI PROMPT" : "KEYWORD"}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={searchType === "semantic" ? "Ask AI e.g. 'etf flows'..." : "Search titles/content..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/[0.03] border border-[var(--ed-border)] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-white/30 w-full placeholder-zinc-600 font-sans transition-colors"
              />
              {searchType === "semantic" ? (
                <Brain size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              ) : (
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              )}
            </div>
          </div>

          {/* Apply Button */}
          <div className="md:col-span-1">
            <button
              type="submit"
              className="ed-chip ed-press w-full py-2.5 px-3 text-[13.5px] font-medium text-white cursor-pointer"
            >
              Apply
            </button>
          </div>
        </form>
      </BeveledCard>

      {/* Granular records list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-32 ed-bento animate-pulse"
              />
            ))}
          </div>
        ) : records.length === 0 ? (
          <BeveledCard className="text-center py-16 text-zinc-500 font-sans text-sm">
            No AI sentiment records found matching the active filters.
          </BeveledCard>
        ) : (
          records.map((item) => {
            const scoreNum = parseFloat(item.score);
            const isReddit = item.sourceType === "reddit";
            const isExpanded = expandedRecordId === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <BeveledCard className="w-full p-6 md:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--ed-border)] pb-2.5 mb-3 text-xs text-zinc-400">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {isReddit ? (
                        <RedditLogo size={15} className="text-rose-400" />
                      ) : (
                        <Newspaper size={15} className="text-zinc-400" />
                      )}
                      <span className="font-bold uppercase text-zinc-300 text-[11px] tracking-wider">
                        [{item.sourceType.replace("_", " ")}]
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-[var(--ed-border)] text-zinc-300 text-[11px] font-bold">
                        {item.tickerSymbol}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        UPVOTES: {item.upvotes ?? 0}
                      </span>
                      {item.similarity !== undefined && item.similarity !== null && item.similarity < 1.0 && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-950/30 text-purple-400 border border-purple-500/20 font-bold uppercase text-[10px] font-mono">
                          MATCH: {Math.round(item.similarity * 100)}%
                        </span>
                      )}
                    </div>

                    <span className="text-zinc-500 text-[11px]">
                      {new Date(item.postedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-5 md:items-start justify-between">
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-[1.15rem] font-medium leading-snug tracking-[-0.02em] text-[var(--ed-fg-90)]">
                        {item.postTitle || "HEADLINE ANALYSIS"}
                      </h3>
                      <p className="text-[14px] text-[var(--ed-fg-55)] leading-relaxed">
                        {(() => {
                          const cleaned = cleanHtmlText(item.postContent);
                          return cleaned.length > 450
                            ? `${cleaned.slice(0, 450)}...`
                            : cleaned;
                        })()}
                      </p>
                    </div>

                    {/* AI Verdict Summary Column */}
                    <div className="flex items-center gap-4 py-2 px-3.5 rounded-xl border border-[var(--ed-border)] bg-white/[0.01] font-mono shrink-0 mt-3 md:mt-0">
                      <div className="text-center min-w-[70px]">
                        <span className="text-[10px] text-zinc-500 block uppercase font-medium mb-0.5">
                          VERDICT
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            item.label === "bullish"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : item.label === "bearish"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {item.label.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-center min-w-[50px] border-l border-[var(--ed-border)] pl-3.5">
                        <span className="text-[10px] text-zinc-500 block uppercase font-medium mb-0.5">
                          SCORE
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            scoreNum > 0.2
                              ? "text-emerald-400"
                              : scoreNum < -0.2
                              ? "text-rose-400"
                              : "text-zinc-300"
                          }`}
                        >
                          {scoreNum > 0 ? "+" : ""}
                          {scoreNum.toFixed(2)}
                        </span>
                      </div>

                      <div className="text-center min-w-[50px] border-l border-[var(--ed-border)] pl-3.5">
                        <span className="text-[10px] text-zinc-500 block uppercase font-medium mb-0.5">
                          CONF
                        </span>
                        <span className="text-sm font-bold text-white">
                          {Math.round(parseFloat(item.confidence ?? "0") * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible reasoning bar */}
                  <div className="mt-4 pt-3 border-t border-[var(--ed-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => setExpandedRecordId(isExpanded ? null : item.id)}
                      className="flex items-center gap-1.5 text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>{isExpanded ? "HIDE REASONING" : "VIEW AI REASONING"}</span>
                    </button>

                    {item.postUrl && (
                      <a
                        href={item.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-zinc-500 hover:text-emerald-400 transition-colors"
                      >
                        SOURCE LINK <ArrowSquareOut size={11} />
                      </a>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 border-l border-[var(--ed-blue-label)] pl-3 py-1 text-[14px] text-[var(--ed-fg-70)] leading-relaxed">
                      <div className="ed-eyebrow flex items-center gap-1.5 mb-1.5">
                        <Brain size={13} />
                        AI reasoning
                      </div>
                      {item.reasoning || "No reasoning details returned by model."}
                    </div>
                  )}
                </BeveledCard>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Minimal Pagination controls */}
      {!isLoading && records.length > 0 && (
        <div className="flex items-center justify-between mt-6 border-t border-[var(--ed-border)] pt-5 text-[13px] text-[var(--ed-fg-55)]">
          <span>
            SHOWING {page * limit + 1} - {Math.min((page + 1) * limit, stats.totalCount)} OF{" "}
            {stats.totalCount} RECORDS
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className={`ed-chip ed-press px-4 py-1.5 flex items-center gap-1.5 text-[13px] font-medium ${
                page === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "text-white cursor-pointer"
              }`}
            >
              <ArrowLeft size={12} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= stats.totalCount}
              className={`ed-chip ed-press px-4 py-1.5 flex items-center gap-1.5 text-[13px] font-medium ${
                (page + 1) * limit >= stats.totalCount
                  ? "opacity-40 cursor-not-allowed"
                  : "text-white cursor-pointer"
              }`}
            >
              Next <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
      </section>
    </PageShell>
  );
}
