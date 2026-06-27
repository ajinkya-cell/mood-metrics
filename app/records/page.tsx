"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Database,
  Calendar,
  ShieldCheck,
  Funnel,
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  Newspaper,
  RedditLogo,
  Globe,
  Info,
  Circle,
  Eye,
  MagnifyingGlass,
  ChartBar,
  ChartLineUp,
  Brain,
  TrendUp,
  TrendDown,
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "motion/react";
import GlowCard from "../components/GlowCard";
import HorizontalScale from "../components/HorizontalScale";
import SectionEyebrow from "../components/SectionEyebrow";

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

  // Chart hover scrubbing state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

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

  // Calculate coordinates for SVG timeseries chart
  const getChartCoords = (
    index: number,
    score: number,
    totalPoints: number,
    width: number,
    height: number,
    paddingY: number
  ) => {
    const x = (index / (totalPoints - 1 || 1)) * width;
    const yRange = height - paddingY * 2;
    // Score is -100 to +100
    const y = height - paddingY - ((score + 100) / 200) * yRange;
    return { x, y };
  };

  // Render SVG Timeseries Chart
  const renderTimeseriesChart = () => {
    if (!timeseries || timeseries.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center text-xs text-zinc-500 font-mono">
          NO HISTORICAL DATA AVAILABLE FOR CHOSEN FILTERS
        </div>
      );
    }

    // Chronological order (API returns desc, we reverse for graph)
    const pointsData = [...timeseries].reverse();
    const width = 800;
    const height = 240;
    const paddingY = 30;
    const volumeHeight = 60; // height of volume bar graph at the bottom

    const coords = pointsData.map((pt, i) =>
      getChartCoords(i, pt.score, pointsData.length, width, height - volumeHeight - 10, paddingY)
    );

    let lineD = "";
    let areaD = "";
    if (coords.length > 0) {
      lineD = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 1; i < coords.length; i++) {
        lineD += ` L ${coords[i].x} ${coords[i].y}`;
      }
      areaD = `${lineD} L ${coords[coords.length - 1].x} ${height - volumeHeight - 10} L ${coords[0].x} ${height - volumeHeight - 10} Z`;
    }

    // Find max posts in a single bucket to scale volume bars
    const maxPosts = Math.max(...pointsData.map((p) => p.posts), 1);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      if (!chartContainerRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const pct = clientX / rect.width;
      const idx = Math.min(
        Math.max(Math.round(pct * (pointsData.length - 1)), 0),
        pointsData.length - 1
      );
      setHoverIndex(idx);
    };

    const activePt = hoverIndex !== null ? pointsData[hoverIndex] : null;
    const activeCoord = hoverIndex !== null ? coords[hoverIndex] : null;

    return (
      <div ref={chartContainerRef} className="w-full">
        {/* Scrub tooltip */}
        <div className="flex flex-col md:flex-row  justify-between items-start md:items-center gap-2 mb-4 font-mono text-xs text-zinc-400">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
              CHRONOLOGICAL AI SENTIMENT TIMELINE
            </span>
            <span>
              {activePt
                ? new Date(activePt.time).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Hover graph to scrub detailed bucket metrics"}
            </span>
          </div>

          {activePt && (
            <div className="flex gap-4 bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg text-[11px]">
              <div>
                SCORE:{" "}
                <span
                  className={
                    activePt.score > 20
                      ? "text-emerald-400 font-bold"
                      : activePt.score < -20
                      ? "text-rose-400 font-bold"
                      : "text-zinc-300"
                  }
                >
                  {activePt.score > 0 ? "+" : ""}
                  {activePt.score}
                </span>
              </div>
              <div className="border-l border-white/10 pl-4">
                POSTS: <span className="text-white font-bold">{activePt.posts}</span>
              </div>
              <div className="border-l border-white/10 pl-4 flex gap-2">
                <span className="text-emerald-500 font-bold">▲{activePt.bullish}</span>
                <span className="text-zinc-500 font-bold">●{activePt.neutral}</span>
                <span className="text-rose-500 font-bold">▼{activePt.bearish}</span>
              </div>
            </div>
          )}
        </div>

        {/* The SVG element */}
        <div className="border border-white/5 bg-[#08080A] rounded-2xl p-4 overflow-hidden relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height="100%"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
            className="cursor-crosshair overflow-visible"
          >
            <defs>
              <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="scoreLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="50%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line
              x1="0"
              y1={(height - volumeHeight - 10) / 2}
              x2={width}
              y2={(height - volumeHeight - 10) / 2}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="4 4"
            />
            <line
              x1="0"
              y1={paddingY}
              x2={width}
              y2={paddingY}
              stroke="rgba(255,255,255,0.02)"
            />
            <line
              x1="0"
              y1={height - volumeHeight - 10 - paddingY}
              x2={width}
              y2={height - volumeHeight - 10 - paddingY}
              stroke="rgba(255,255,255,0.02)"
            />

            {/* Area Fill */}
            {areaD && (
              <path d={areaD} fill="url(#scoreAreaGrad)" className="pointer-events-none" />
            )}

            {/* Sentiment line */}
            {lineD && (
              <path
                d={lineD}
                fill="none"
                stroke="url(#scoreLineGrad)"
                strokeWidth="2.5"
                className="pointer-events-none"
                style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.3))" }}
              />
            )}

            {/* Volume Chart at bottom (Stacked bars) */}
            <g transform={`translate(0, ${height - volumeHeight})`}>
              <line
                x1="0"
                y1="0"
                x2={width}
                y2="0"
                stroke="rgba(255,255,255,0.08)"
              />
              {pointsData.map((pt, idx) => {
                const barWidth = Math.max(width / pointsData.length - 2, 2);
                const x = (idx / (pointsData.length - 1 || 1)) * width - barWidth / 2;

                const totalPostsVal = pt.posts || 1;
                const bullPct = pt.bullish / totalPostsVal;
                const bearPct = pt.bearish / totalPostsVal;
                const neutPct = pt.neutral / totalPostsVal;

                const barHeight = (pt.posts / maxPosts) * (volumeHeight - 10);

                // Heights for stacked colors
                const bullHeight = barHeight * bullPct;
                const neutHeight = barHeight * neutPct;
                const bearHeight = barHeight * bearPct;

                return (
                  <g key={idx} className="opacity-60 hover:opacity-100 transition-opacity">
                    {/* Bullish segment (green) */}
                    {bullHeight > 0 && (
                      <rect
                        x={x}
                        y={volumeHeight - bullHeight}
                        width={barWidth}
                        height={bullHeight}
                        fill="#10B981"
                      />
                    )}
                    {/* Neutral segment (gray) */}
                    {neutHeight > 0 && (
                      <rect
                        x={x}
                        y={volumeHeight - bullHeight - neutHeight}
                        width={barWidth}
                        height={neutHeight}
                        fill="#71717A"
                      />
                    )}
                    {/* Bearish segment (red) */}
                    {bearHeight > 0 && (
                      <rect
                        x={x}
                        y={volumeHeight - bullHeight - neutHeight - bearHeight}
                        width={barWidth}
                        height={bearHeight}
                        fill="#F43F5E"
                      />
                    )}
                  </g>
                );
              })}
            </g>

            {/* Scrub vertical guideline and tracker node */}
            {activeCoord && activePt && (
              <g className="pointer-events-none">
                <line
                  x1={activeCoord.x}
                  y1={0}
                  x2={activeCoord.x}
                  y2={height}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={activeCoord.x}
                  cy={activeCoord.y}
                  r="5"
                  fill="#10B981"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </svg>
        </div>
      </div>
    );
  };

  // Render AI Verdict Matrix (Scatter Plot of score vs confidence)
  const renderVerdictMatrix = () => {
    if (isLoading) return null;

    const width = 300;
    const height = 200;
    const padding = 20;

    return (
      <div className="bg-[#0C0C0E]/50 border border-white/5 rounded-2xl p-6 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Brain size={16} className="text-emerald-400" />
            <h3 className="font-mono text-xs text-white uppercase tracking-wider">
              AI VERDICT SCATTER MATRIX
            </h3>
          </div>
          <p className="text-[10px] text-zinc-500 font-sans mb-4">
            Visualizing the cluster distribution of scores (-1.0 to 1.0) against AI confidence values (0 to 1.0).
          </p>

          <div className="relative p-2 flex items-center justify-center">
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
              {/* Axes */}
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

              {/* Grid Label Lines */}
              <line
                x1={padding}
                y1={height / 2}
                x2={width - padding}
                y2={height / 2}
                stroke="rgba(255,255,255,0.02)"
                strokeDasharray="2 2"
              />

              {/* Scatter Points */}
              {records.map((r, idx) => {
                const s = parseFloat(r.score);
                const c = parseFloat(r.confidence ?? "0.5");

                // Map values
                const xVal = padding + ((s + 1) / 2) * (width - padding * 2);
                const yVal = height - padding - c * (height - padding * 2);

                const color =
                  r.label === "bullish"
                    ? "#10B981"
                    : r.label === "bearish"
                    ? "#F43F5E"
                    : "#71717A";

                return (
                  <circle
                    key={r.id || idx}
                    cx={xVal}
                    cy={yVal}
                    r="4.5"
                    fill={color}
                    opacity="0.65"
                    className="hover:opacity-100 hover:scale-125 transition-all cursor-pointer"
                  >
                    <title>
                      {r.tickerSymbol}: Score {s}, Conf {Math.round(c * 100)}%
                    </title>
                  </circle>
                );
              })}

              {/* Axes Labels */}
              <text
                x={padding}
                y={height - 5}
                fill="#71717A"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                BEARISH
              </text>
              <text
                x={width - padding - 50}
                y={height - 5}
                fill="#71717A"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                BULLISH
              </text>
              <text
                x={width / 2 - 25}
                y={padding - 5}
                fill="#71717A"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                100% CONF
              </text>
            </svg>
          </div>
        </div>

        <div className="mt-4 border-t border-white/5 pt-3 font-mono text-xs text-zinc-400 flex justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Bullish
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" /> Neutral
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Bearish
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-8 py-16 pt-25 select-none overflow-hidden pb-28 font-mono text-lg">
      {/* Header section */}
      <div className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <SectionEyebrow icon={<Database size={16} className="text-emerald-400" />}>
            QUANTITATIVE LEDGER
          </SectionEyebrow>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-sans mt-3">
            Detailed AI Sentiment Records
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl mt-4 max-w-3xl font-sans leading-relaxed">
            Browse through exact AI-classified market telemetry. Deep dive into every scraped headline and Reddit post, inspect Nvidia Llama 3.1 confidence indicators, and study chronological volume spikes.
          </p>

          {/* Minimal Ticker Selector */}
          <div className="mt-4 flex items-center gap-3 md:gap-4 font-mono text-xs tracking-widest select-none">
            <span className="text-zinc-500 font-bold">ACTIVE COIN:</span>
            {["ALL", "BTC", "ETH", "SOL"].map((sym) => {
              const isActive = selectedSymbol === sym;
              return (
                <button
                  key={sym}
                  onClick={() => {
                    setSelectedSymbol(sym);
                    setPage(0);
                  }}
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

      {/* Grid of Telemetry Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 text-base">
        {/* Dashboard Blended Sentiment Score */}
        <GlowCard 
          accent={blendedScore !== null ? (blendedScore > 20 ? "emerald" : blendedScore < -20 ? "rose" : "zinc") : "zinc"} 
          className="p-7 flex flex-col justify-between min-h-[15rem] hover:scale-[1.02] transition-transform duration-300"
        >
          <div>
            <div className="text-sm text-zinc-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 flex-wrap">
              <span>BLENDED SENTIMENT</span>
              <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">
                {selectedSymbol === "ALL" ? "BTC Benchmark" : selectedSymbol}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-6xl font-extrabold font-sans ${
                  blendedScore !== null
                    ? blendedScore > 20
                      ? "text-emerald-400"
                      : blendedScore < -20
                      ? "text-rose-400"
                      : "text-zinc-300"
                    : "text-zinc-500"
                }`}
              >
                {blendedScore !== null ? (blendedScore > 0 ? `+${blendedScore}` : blendedScore) : "N/A"}
              </span>
              <span className="text-sm text-zinc-500">(-100 to +100)</span>
            </div>
          </div>
          <div className="mt-5 text-sm text-zinc-300 font-sans border-t border-white/5 pt-4 flex flex-col gap-2">
            <span>Weighted index combining social text, leverage, and Fear & Greed.</span>
            <Link href="/methodology" className="text-sm text-emerald-400 hover:text-emerald-300 underline font-bold inline-block font-mono tracking-wide mt-1">
              READ MORE →
            </Link>
          </div>
        </GlowCard>

        {/* Average Sentiment Score */}
        <GlowCard accent={stats.avgScore > 0.2 ? "emerald" : stats.avgScore < -0.2 ? "rose" : "zinc"} className="p-7 flex flex-col justify-between min-h-[15rem] hover:scale-[1.02] transition-transform duration-300">
          <div>
            <div className="text-sm text-zinc-400 font-bold uppercase tracking-wider mb-3">
              AVERAGE TEXT SENTIMENT
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-6xl font-extrabold font-sans ${
                  stats.avgScore > 0.2
                    ? "text-emerald-400"
                    : stats.avgScore < -0.2
                    ? "text-rose-400"
                    : "text-zinc-300"
                }`}
              >
                {stats.avgScore > 0 ? "+" : ""}
                {Math.round(stats.avgScore * 100)}
              </span>
              <span className="text-sm text-zinc-500">(-100 to +100)</span>
            </div>
          </div>
          <div className="mt-5 text-sm leading-relaxed text-zinc-300 font-sans border-t border-white/5 pt-4 flex flex-col gap-2">
            <span>
              <span className="text-amber-400 font-bold font-mono text-sm">TELEMETRY NOTE:</span> This score measures raw textual comments. The Dashboard Blended Score ({blendedScore !== null ? (blendedScore > 0 ? `+${blendedScore}` : blendedScore) : "N/A"}) incorporates contrarian indicators.
            </span>
            <Link href="/methodology" className="text-sm text-emerald-400 hover:text-emerald-300 underline font-bold inline-block font-mono tracking-wide mt-1">
              READ MORE →
            </Link>
          </div>
        </GlowCard>

        {/* AI Confidence */}
        <GlowCard accent="zinc" className="p-7 flex flex-col justify-between min-h-[15rem] hover:scale-[1.02] transition-transform duration-300">
          <div>
            <div className="text-sm text-zinc-400 font-bold uppercase tracking-wider mb-3">
              AI CLASSIFIER CONFIDENCE
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-extrabold font-sans text-white">
                {Math.round(stats.avgConfidence * 100)}%
              </span>
              <span className="text-sm text-zinc-500">ACCURACY BIAS</span>
            </div>
          </div>
          <div className="mt-5 text-sm text-zinc-300 font-sans border-t border-white/5 pt-4">
            Confidence average declared by Nvidia Llama 3.1.
          </div>
        </GlowCard>

        {/* Signals Distribution */}
        <GlowCard accent="zinc" className="p-7 flex flex-col justify-between min-h-[15rem] hover:scale-[1.02] transition-transform duration-300">
          <div>
            <div className="text-sm text-zinc-400 font-bold uppercase tracking-wider mb-3">
              LABEL RATIO MATRIX
            </div>
            <div className="space-y-3 mt-3">
              <div className="flex justify-between text-sm text-zinc-200">
                <span className="text-emerald-400 font-bold">BULLISH</span>
                <span className="font-bold">
                  {stats.bullishCount} ({stats.totalCount > 0 ? Math.round((stats.bullishCount / stats.totalCount) * 100) : 0}%)
                </span>
              </div>
              <div className="flex justify-between text-sm text-zinc-200">
                <span className="text-zinc-500 font-bold">NEUTRAL</span>
                <span className="font-bold">
                  {stats.neutralCount} ({stats.totalCount > 0 ? Math.round((stats.neutralCount / stats.totalCount) * 100) : 0}%)
                </span>
              </div>
              <div className="flex justify-between text-sm text-zinc-200">
                <span className="text-rose-500 font-bold">BEARISH</span>
                <span className="font-bold">
                  {stats.bearishCount} ({stats.totalCount > 0 ? Math.round((stats.bearishCount / stats.totalCount) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
          <div className="mt-5 text-sm text-zinc-400 font-sans border-t border-white/5 pt-4">
            Ratio metrics for sentiment label slices.
          </div>
        </GlowCard>

        {/* Total Volume */}
        <GlowCard accent="zinc" className="p-7 flex flex-col justify-between min-h-[15rem] hover:scale-[1.02] transition-transform duration-300">
          <div>
            <div className="text-sm text-zinc-400 font-bold uppercase tracking-wider mb-3">
              TOTAL INGESTED LOGS
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-extrabold font-sans text-white">
                {stats.totalCount}
              </span>
              <span className="text-sm text-zinc-500">RECORDS</span>
            </div>
          </div>
          <div className="mt-5 text-sm text-zinc-300 font-sans border-t border-white/5 pt-4">
            Total records meeting the active query criteria.
          </div>
        </GlowCard>

        {/* Fear & Greed Index */}
        <GlowCard 
          accent={fearGreed !== null ? (fearGreed.value >= 56 ? "emerald" : fearGreed.value <= 45 ? "rose" : "zinc") : "zinc"} 
          className="p-7 flex flex-col justify-between min-h-[15rem] hover:scale-[1.02] transition-transform duration-300"
        >
          <div>
            <div className="text-sm text-zinc-400 font-bold uppercase tracking-wider mb-3">
              FEAR & GREED INDEX
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-extrabold font-sans text-white">
                  {fearGreed !== null ? fearGreed.value : "N/A"}
                </span>
                <span className="text-sm text-zinc-500">/ 100</span>
              </div>
              <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded bg-white/5 border border-white/10 ${
                fearGreed !== null 
                  ? (fearGreed.value >= 76 ? "text-emerald-400 border-emerald-500/20" : fearGreed.value >= 56 ? "text-emerald-500 border-emerald-500/10" : fearGreed.value >= 46 ? "text-zinc-300 border-white/5" : fearGreed.value >= 26 ? "text-rose-400 border-rose-500/10" : "text-rose-600 border-rose-500/20")
                  : "text-zinc-500 border-white/5"
              }`}>
                {fearGreed !== null ? fearGreed.label : "LOADING"}
              </span>
            </div>

            {/* Meter component like alternative.me source */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>0 (FEAR)</span>
                <span>50 (NEUTRAL)</span>
                <span>100 (GREED)</span>
              </div>
              <div className="relative h-3.5 w-full bg-zinc-950/80 border border-white/10 rounded-full p-[2.5px] overflow-hidden">
                {/* Gradient track background representing alternative.me's red-orange-yellow-green scale */}
                <div className="absolute inset-[2.5px] rounded-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 opacity-20" />
                {/* Active progress fill */}
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 opacity-95 transition-all duration-555"
                  style={{ width: fearGreed !== null ? `${fearGreed.value}%` : '0%' }}
                />
              </div>
              {fearGreed !== null && (
                <div className="flex justify-between items-center text-[10px] font-mono mt-1 text-zinc-450">
                  <span>INDEX VALUE:</span>
                  <span className="font-extrabold text-white">{fearGreed.value}% POSITION</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-5 text-sm text-zinc-300 font-sans border-t border-white/5 pt-4 flex flex-col gap-2">
            <span className="leading-relaxed">Global indicator measuring leverage levels and social momentum.</span>
            <a 
              href="https://alternative.me/crypto/fear-and-greed-index/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-emerald-400 hover:text-emerald-300 underline font-bold inline-block font-mono tracking-wide mt-1"
            >
              ALTERNATIVE.ME SOURCE →
            </a>
          </div>
        </GlowCard>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left main grid: Chronological chart */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-[#0C0C0E]/50 border border-white/5 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                <ChartLineUp size={22} className="text-emerald-400" />
                HISTORICAL SENTIMENT TIMELINE
              </h2>

              <div className="flex items-center gap-2.5 bg-black/40 border border-white/5 p-2 rounded-xl">
                {["24h", "7d", "30d"].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTimeframe(t);
                      setPage(0);
                    }}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      timeframe === t
                        ? "bg-white/10 text-white"
                        : "text-zinc-450 hover:text-zinc-200"
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center font-mono text-zinc-500 text-sm animate-pulse">
                RETRIEVING HISTORICAL TELEMETRY MATRIX...
              </div>
            ) : (
              renderTimeseriesChart()
            )}
          </div>
        </div>

        {/* Right main grid: Scatter Plot Matrix */}
        <div className="lg:col-span-4">
          {renderVerdictMatrix()}
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-[#0C0C0E]/40 border border-white/5 rounded-2xl p-8 mb-10 text-base">
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
          <Funnel size={22} className="text-emerald-400" />
          FILTER COORDINATE MATRIX
        </h2>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          {/* Label Selector */}
          <div className="md:col-span-3 flex flex-col gap-2">
            <label className="text-sm text-zinc-300 font-extrabold uppercase tracking-wider">SENTIMENT LABEL</label>
            <select
              value={selectedLabel}
              onChange={(e) => {
                setSelectedLabel(e.target.value);
                setPage(0);
              }}
              className="bg-black/80 border border-white/20 rounded-xl px-5 py-3.5 text-base text-white focus:outline-none focus:border-emerald-500 w-full cursor-pointer transition-all"
            >
              <option value="ALL">ALL LABELS</option>
              <option value="BULLISH">BULLISH</option>
              <option value="NEUTRAL">NEUTRAL</option>
              <option value="BEARISH">BEARISH</option>
            </select>
          </div>

          {/* Source Selector */}
          <div className="md:col-span-3 flex flex-col gap-2">
            <label className="text-sm text-zinc-300 font-extrabold uppercase tracking-wider">INGEST SOURCE</label>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setPage(0);
              }}
              className="bg-black/80 border border-white/20 rounded-xl px-5 py-3.5 text-base text-white focus:outline-none focus:border-emerald-500 w-full cursor-pointer transition-all"
            >
              <option value="ALL">ALL SOURCES</option>
              <option value="REDDIT">REDDIT BOARDS</option>
              <option value="COINGECKO">COINGECKO</option>
              <option value="NEWS_RSS">NEWS HEADLINES</option>
            </select>
          </div>

          {/* Search Mode Selector */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-sm text-zinc-300 font-extrabold uppercase tracking-wider">SEARCH MODE</label>
            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setPage(0);
              }}
              className="bg-black/80 border border-white/20 rounded-xl px-5 py-3.5 text-base text-white focus:outline-none focus:border-emerald-500 w-full cursor-pointer transition-all"
            >
              <option value="text">KEYWORD TEXT</option>
              <option value="semantic">AI SEMANTIC (vector)</option>
            </select>
          </div>

          {/* Text Search Input */}
          <div className="md:col-span-3 flex flex-col gap-2 relative">
            <label className="text-sm text-zinc-300 font-extrabold uppercase tracking-wider">{searchType === "semantic" ? "AI PROMPT" : "KEYWORD QUERY"}</label>
            <div className="relative">
              <input
                type="text"
                placeholder={searchType === "semantic" ? "Ask AI e.g. 'etf flows'..." : "Search titles/content..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/80 border border-white/20 rounded-xl pl-12 pr-4 py-3.5 text-base text-white focus:outline-none focus:border-emerald-500 w-full placeholder-zinc-700 font-sans transition-all"
              />
              {searchType === "semantic" ? (
                <Brain size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 animate-pulse" />
              ) : (
                <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              )}
            </div>
          </div>

          {/* Apply Button */}
          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-base font-extrabold py-3.5 px-5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/10"
            >
              FILTER
            </button>
          </div>
        </form>
      </div>

      {/* Granular records list */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-36 border border-white/5 rounded-2xl bg-zinc-950/20 animate-pulse"
              />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-24 text-zinc-400 border border-white/5 rounded-2xl bg-[#0C0C0E]/40 font-sans text-sm">
            No AI sentiment records found matching the active filters.
          </div>
        ) : (
          records.map((item) => {
            const scoreNum = parseFloat(item.score);
            const isReddit = item.sourceType === "reddit";
            const isExpanded = expandedRecordId === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 25, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full bg-[#0C0C0E]/50 border border-white/5 rounded-2xl p-8 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:bg-[#0E0E12]/80 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-4 text-xs md:text-sm text-zinc-450">
                  <div className="flex flex-wrap items-center gap-3">
                    {isReddit ? (
                      <RedditLogo size={16} className="text-rose-500" />
                    ) : (
                      <Newspaper size={16} className="text-emerald-400" />
                    )}
                    <span className="font-extrabold uppercase text-zinc-350 tracking-wider">
                      [{item.sourceType.replace("_", " ")}]
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-zinc-200 text-xs font-bold">
                      {item.tickerSymbol}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      UPVOTES: {item.upvotes ?? 0}
                    </span>
                    {item.similarity !== undefined && item.similarity !== null && item.similarity < 1.0 && (
                      <span className="px-2 py-0.5 rounded bg-purple-950/20 text-purple-400 border border-purple-500/20 font-bold uppercase text-[10px] font-mono tracking-wider">
                        MATCH: {Math.round(item.similarity * 100)}%
                      </span>
                    )}
                  </div>

                  <span className="text-zinc-500 font-medium">
                    INGESTED: {new Date(item.postedAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-extrabold text-white mb-3 leading-snug font-sans tracking-tight hover:text-emerald-400 transition-colors duration-200">
                      {item.postTitle || "HEADLINE ANALYSIS"}
                    </h3>
                    <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-sans">
                      {(() => {
                        const cleaned = cleanHtmlText(item.postContent);
                        return cleaned.length > 450
                          ? `${cleaned.slice(0, 450)}...`
                          : cleaned;
                      })()}
                    </p>
                  </div>

                  {/* AI Verdict panel */}
                  <div className="flex items-center gap-6 py-3.5 px-4 bg-white/[0.02] border border-white/5 rounded-xl font-mono shrink-0 mt-4 md:mt-0">
                    <div className="text-center min-w-[80px]">
                      <span className="text-[10px] text-zinc-550 block uppercase font-bold tracking-wider mb-1.5">
                        AI VERDICT
                      </span>
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-md ${
                          item.label === "bullish"
                            ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20"
                            : item.label === "bearish"
                            ? "bg-rose-950/20 text-rose-400 border border-rose-500/20"
                            : "bg-zinc-900 text-zinc-400 border border-white/5"
                        }`}
                      >
                        {item.label.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-center min-w-[60px] border-l border-white/10 pl-5">
                      <span className="text-[10px] text-zinc-555 block uppercase font-bold tracking-wider mb-1.5">
                        SCORE
                      </span>
                      <span
                        className={`text-sm md:text-base font-extrabold ${
                          scoreNum > 0.2
                            ? "text-emerald-400"
                            : scoreNum < -0.2
                            ? "text-rose-400"
                            : "text-zinc-350"
                        }`}
                      >
                        {scoreNum > 0 ? "+" : ""}
                        {scoreNum.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-center min-w-[60px] border-l border-white/10 pl-5">
                      <span className="text-[10px] text-zinc-555 block uppercase font-bold tracking-wider mb-1.5">
                        CONFIDENCE
                      </span>
                      <span className="text-sm md:text-base font-extrabold text-white">
                        {Math.round(parseFloat(item.confidence ?? "0") * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collapsible reasoning bar */}
                <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm">
                  <button
                    onClick={() => setExpandedRecordId(isExpanded ? null : item.id)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold transition-colors cursor-pointer"
                  >
                    <Eye size={16} />
                    <span>{isExpanded ? "HIDE AI REASONING" : "VIEW AI REASONING DRAWOUT"}</span>
                  </button>

                  {item.postUrl && (
                    <a
                      href={item.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors font-bold"
                    >
                      REDIRECT NODE SOURCE <ArrowSquareOut size={12} />
                    </a>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-5 border-l-2 border-emerald-500/30 bg-emerald-500/[0.02] rounded-r-2xl pl-6 pr-4 py-4 text-sm md:text-base text-zinc-300 font-sans leading-relaxed shadow-inner">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-extrabold mb-3 tracking-widest">
                      <Brain size={16} />
                      NVIDIA NIM LLAMA-3.1-8B-INSTRUCT CLASSIFICATION ANALYSIS:
                    </div>
                    {item.reasoning || "No reasoning details returned by model."}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination controls */}
      {!isLoading && records.length > 0 && (
        <div className="flex items-center justify-between mt-12 border-t border-white/5 pt-8 text-sm md:text-base text-zinc-450">
          <span>
            SHOWING {page * limit + 1} - {Math.min((page + 1) * limit, stats.totalCount)} OF{" "}
            {stats.totalCount} RECORDS
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className={`px-5 py-3 rounded-xl border border-white/5 flex items-center gap-1.5 transition-all text-sm font-bold ${
                page === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "bg-black hover:bg-white/5 text-zinc-300 hover:text-white cursor-pointer"
              }`}
            >
              <ArrowLeft size={14} /> PREVIOUS
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= stats.totalCount}
              className={`px-5 py-3 rounded-xl border border-white/5 flex items-center gap-1.5 transition-all text-sm font-bold ${
                (page + 1) * limit >= stats.totalCount
                  ? "opacity-40 cursor-not-allowed"
                  : "bg-black hover:bg-white/5 text-zinc-300 hover:text-white cursor-pointer"
              }`}
            >
              NEXT <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
