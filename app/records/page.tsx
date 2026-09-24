"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Database,
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
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "motion/react";
import BeveledCard from "../components/BeveledCard";
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

    const pointsData = [...timeseries].reverse();
    const width = 800;
    const height = 240;
    const paddingY = 30;
    const volumeHeight = 60;

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4 font-mono text-xs text-zinc-400">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
              HISTORICAL TIMELINE
            </span>
            <span>
              {activePt
                ? new Date(activePt.time).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Hover to scrub hourly telemetry"}
            </span>
          </div>

          {activePt && (
            <div className="flex gap-4 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-lg text-[11px]">
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
        <div className="rounded-xl border border-white/5 bg-black/40 p-4 overflow-hidden relative">
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
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
            <line
              x1="0"
              y1={paddingY}
              x2={width}
              y2={paddingY}
              stroke="rgba(255,255,255,0.03)"
            />
            <line
              x1="0"
              y1={height - volumeHeight - 10 - paddingY}
              x2={width}
              y2={height - volumeHeight - 10 - paddingY}
              stroke="rgba(255,255,255,0.03)"
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
                strokeWidth="2"
                className="pointer-events-none"
              />
            )}

            {/* Volume Chart at bottom */}
            <g transform={`translate(0, ${height - volumeHeight})`}>
              <line
                x1="0"
                y1="0"
                x2={width}
                y2="0"
                stroke="rgba(255,255,255,0.06)"
              />
              {pointsData.map((pt, idx) => {
                const barWidth = Math.max(width / pointsData.length - 2, 2);
                const x = (idx / (pointsData.length - 1 || 1)) * width - barWidth / 2;

                const totalPostsVal = pt.posts || 1;
                const bullPct = pt.bullish / totalPostsVal;
                const bearPct = pt.bearish / totalPostsVal;
                const neutPct = pt.neutral / totalPostsVal;

                const barHeight = (pt.posts / maxPosts) * (volumeHeight - 10);

                const bullHeight = barHeight * bullPct;
                const neutHeight = barHeight * neutPct;
                const bearHeight = barHeight * bearPct;

                return (
                  <g key={idx} className="opacity-60 hover:opacity-100 transition-opacity">
                    {bullHeight > 0 && (
                      <rect
                        x={x}
                        y={volumeHeight - bullHeight}
                        width={barWidth}
                        height={bullHeight}
                        fill="#10B981"
                      />
                    )}
                    {neutHeight > 0 && (
                      <rect
                        x={x}
                        y={volumeHeight - bullHeight - neutHeight}
                        width={barWidth}
                        height={neutHeight}
                        fill="#71717A"
                      />
                    )}
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

            {/* Scrub guideline */}
            {activeCoord && activePt && (
              <g className="pointer-events-none">
                <line
                  x1={activeCoord.x}
                  y1={0}
                  x2={activeCoord.x}
                  y2={height}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={activeCoord.x}
                  cy={activeCoord.y}
                  r="4"
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
      <BeveledCard className="p-6 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={18} className="text-emerald-400" />
            <h3 className="font-mono text-xs text-white uppercase tracking-wider font-bold">
              AI VERDICT SCATTER MATRIX
            </h3>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans mb-4 leading-relaxed">
            Distribution of scores (-1.0 to 1.0) vs model confidence (0 to 1.0).
          </p>

          <div className="rounded-xl border border-white/5 bg-black/40 p-2 flex items-center justify-center">
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
                stroke="rgba(255,255,255,0.02)"
                strokeDasharray="2 2"
              />

              {records.map((r, idx) => {
                const s = parseFloat(r.score);
                const c = parseFloat(r.confidence ?? "0.5");

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
                    r="4"
                    fill={color}
                    opacity="0.75"
                    className="hover:opacity-100 hover:scale-125 transition-all cursor-pointer"
                  >
                    <title>
                      {r.tickerSymbol}: Score {s}, Conf {Math.round(c * 100)}%
                    </title>
                  </circle>
                );
              })}

              <text
                x={padding}
                y={height - 5}
                fill="#71717A"
                fontSize="10"
                fontFamily="monospace"
              >
                BEARISH
              </text>
              <text
                x={width - padding - 45}
                y={height - 5}
                fill="#71717A"
                fontSize="10"
                fontFamily="monospace"
              >
                BULLISH
              </text>
              <text
                x={width / 2 - 25}
                y={padding - 5}
                fill="#71717A"
                fontSize="10"
                fontFamily="monospace"
              >
                100% CONF
              </text>
            </svg>
          </div>
        </div>

        <div className="border-t border-white/5 pt-3 mt-4 font-mono text-xs text-zinc-400 flex justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Bullish
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-500" /> Neutral
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Bearish
          </span>
        </div>
      </BeveledCard>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-8 py-16 pt-24 select-none overflow-hidden pb-28 font-mono">
      {/* Header section with Minimal Coin Selector Pill */}
      <div className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <SectionEyebrow icon={<Database size={15} className="text-emerald-400" />}>
            QUANTITATIVE LEDGER
          </SectionEyebrow>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-sans mt-1">
            Detailed AI Sentiment Records
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl font-sans leading-relaxed">
            Browse through granular AI-classified records from Reddit and news feeds. Inspect confidence metrics, reasoning, and historical timeline trends.
          </p>
        </div>

        {/* Minimal Coin Selector Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-mono tracking-wider">
            FILTER:
          </span>
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 select-none">
            {["ALL", "BTC", "ETH", "SOL"].map((sym) => {
              const isActive = selectedSymbol === sym;
              return (
                <button
                  key={sym}
                  onClick={() => {
                    setSelectedSymbol(sym);
                    setPage(0);
                  }}
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

      {/* Grid of 6 Telemetry Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10 text-base">
        {/* Dashboard Blended Sentiment Score */}
        <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>BLENDED SENTIMENT</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                {selectedSymbol === "ALL" ? "BTC Benchmark" : selectedSymbol}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-5xl font-extrabold font-sans ${
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
          <div className="mt-4 text-xs text-zinc-400 font-sans border-t border-white/5 pt-3 flex flex-col gap-1">
            <span>Weighted index combining social text, leverage, and Fear & Greed.</span>
            <Link href="/methodology" className="text-xs text-emerald-400 hover:text-emerald-300 underline font-mono font-semibold mt-0.5">
              READ METHODOLOGY →
            </Link>
          </div>
        </BeveledCard>

        {/* Average Sentiment Score */}
        <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">
              AVERAGE TEXT SENTIMENT
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-5xl font-extrabold font-sans ${
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
          <div className="mt-4 text-xs leading-relaxed text-zinc-400 font-sans border-t border-white/5 pt-3 flex flex-col gap-1">
            <span>
              <span className="text-amber-400 font-mono font-semibold">NOTE:</span> Measures raw text. Blended score incorporates contrarian indicators.
            </span>
            <Link href="/methodology" className="text-xs text-emerald-400 hover:text-emerald-300 underline font-mono font-semibold mt-0.5">
              READ METHODOLOGY →
            </Link>
          </div>
        </BeveledCard>

        {/* AI Confidence */}
        <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">
              AI CLASSIFIER CONFIDENCE
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold font-sans text-white">
                {Math.round(stats.avgConfidence * 100)}%
              </span>
              <span className="text-xs text-zinc-500 font-mono">ACCURACY BIAS</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-400 font-sans border-t border-white/5 pt-3">
            Confidence average declared by Nvidia Llama 3.1.
          </div>
        </BeveledCard>

        {/* Signals Distribution */}
        <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">
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
          <div className="mt-4 text-xs text-zinc-500 font-sans border-t border-white/5 pt-3">
            Ratio metrics for sentiment label slices.
          </div>
        </BeveledCard>

        {/* Total Volume */}
        <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">
              TOTAL INGESTED LOGS
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold font-sans text-white">
                {stats.totalCount}
              </span>
              <span className="text-xs text-zinc-500 font-mono">RECORDS</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-400 font-sans border-t border-white/5 pt-3">
            Total records meeting the active query criteria.
          </div>
        </BeveledCard>

        {/* Fear & Greed Index */}
        <BeveledCard className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">
              FEAR & GREED INDEX
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold font-sans text-white">
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
              <span className="text-xs font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-zinc-300">
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
          <div className="mt-4 text-xs text-zinc-400 font-sans border-t border-white/5 pt-3 flex flex-col gap-1">
            <span>Global indicator measuring market leverage and sentiment.</span>
            <a 
              href="https://alternative.me/crypto/fear-and-greed-index/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-mono font-semibold"
            >
              ALTERNATIVE.ME SOURCE →
            </a>
          </div>
        </BeveledCard>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        {/* Left main grid: Chronological chart */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <BeveledCard className="p-7">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
              <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2.5">
                <ChartLineUp size={20} className="text-emerald-400" />
                HISTORICAL SENTIMENT TIMELINE (7D)
              </h2>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center font-mono text-zinc-500 text-sm animate-pulse">
                RETRIEVING HISTORICAL TELEMETRY MATRIX...
              </div>
            ) : (
              renderTimeseriesChart()
            )}
          </BeveledCard>
        </div>

        {/* Right main grid: Scatter Plot Matrix */}
        <div className="lg:col-span-4">
          {renderVerdictMatrix()}
        </div>
      </div>

      {/* Filter Coordinate Matrix (Minimal Clean Control Deck) */}
      <BeveledCard className="p-7 mb-10 text-base">
        <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2 mb-6 border-b border-white/5 pb-3 font-sans">
          <Funnel size={18} className="text-emerald-400" />
          FILTER COORDINATE MATRIX
        </h2>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Label Selector */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-mono uppercase tracking-wider font-semibold">LABEL</label>
            <select
              value={selectedLabel}
              onChange={(e) => {
                setSelectedLabel(e.target.value);
                setPage(0);
              }}
              className="bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30 w-full cursor-pointer transition-colors font-mono"
            >
              <option value="ALL" className="bg-[#0C0C0E]">ALL LABELS</option>
              <option value="BULLISH" className="bg-[#0C0C0E]">BULLISH</option>
              <option value="NEUTRAL" className="bg-[#0C0C0E]">NEUTRAL</option>
              <option value="BEARISH" className="bg-[#0C0C0E]">BEARISH</option>
            </select>
          </div>

          {/* Source Selector */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-mono uppercase tracking-wider font-semibold">SOURCE</label>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setPage(0);
              }}
              className="bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30 w-full cursor-pointer transition-colors font-mono"
            >
              <option value="ALL" className="bg-[#0C0C0E]">ALL SOURCES</option>
              <option value="REDDIT" className="bg-[#0C0C0E]">REDDIT BOARDS</option>
              <option value="COINGECKO" className="bg-[#0C0C0E]">COINGECKO</option>
              <option value="NEWS_RSS" className="bg-[#0C0C0E]">NEWS HEADLINES</option>
            </select>
          </div>

          {/* Search Mode Selector */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-mono uppercase tracking-wider font-semibold">MODE</label>
            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setPage(0);
              }}
              className="bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30 w-full cursor-pointer transition-colors font-mono"
            >
              <option value="text" className="bg-[#0C0C0E]">KEYWORD</option>
              <option value="semantic" className="bg-[#0C0C0E]">AI SEMANTIC</option>
            </select>
          </div>

          {/* Text Search Input */}
          <div className="md:col-span-3 flex flex-col gap-1.5 relative">
            <label className="text-xs text-zinc-400 font-mono uppercase tracking-wider font-semibold">
              {searchType === "semantic" ? "AI PROMPT" : "KEYWORD"}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={searchType === "semantic" ? "Ask AI e.g. 'etf flows'..." : "Search titles/content..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-white/30 w-full placeholder-zinc-600 font-sans transition-colors"
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
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
            >
              FILTER
            </button>
          </div>
        </form>
      </BeveledCard>

      {/* Granular records list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-32 rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse"
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
                <BeveledCard className="w-full p-6 md:p-7 hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5 mb-3 text-xs text-zinc-400">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {isReddit ? (
                        <RedditLogo size={15} className="text-rose-400" />
                      ) : (
                        <Newspaper size={15} className="text-zinc-400" />
                      )}
                      <span className="font-bold uppercase text-zinc-300 text-[11px] tracking-wider">
                        [{item.sourceType.replace("_", " ")}]
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-zinc-300 text-[11px] font-bold">
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
                      <h3 className="text-base md:text-lg font-bold text-white leading-snug font-sans tracking-tight hover:text-emerald-400 transition-colors">
                        {item.postTitle || "HEADLINE ANALYSIS"}
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                        {(() => {
                          const cleaned = cleanHtmlText(item.postContent);
                          return cleaned.length > 450
                            ? `${cleaned.slice(0, 450)}...`
                            : cleaned;
                        })()}
                      </p>
                    </div>

                    {/* AI Verdict Summary Column */}
                    <div className="flex items-center gap-4 py-2 px-3.5 rounded-xl border border-white/5 bg-white/[0.01] font-mono shrink-0 mt-3 md:mt-0">
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

                      <div className="text-center min-w-[50px] border-l border-white/10 pl-3.5">
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

                      <div className="text-center min-w-[50px] border-l border-white/10 pl-3.5">
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
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
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
                    <div className="mt-3 border-l border-emerald-500/40 pl-3 py-2 text-xs md:text-sm text-zinc-300 font-sans leading-relaxed bg-white/[0.01] rounded-r-lg">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-bold mb-1.5">
                        <Brain size={14} />
                        LLAMA-3.1 CLASSIFICATION ANALYSIS:
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
        <div className="flex items-center justify-between mt-10 border-t border-white/5 pt-6 text-xs text-zinc-400">
          <span>
            SHOWING {page * limit + 1} - {Math.min((page + 1) * limit, stats.totalCount)} OF{" "}
            {stats.totalCount} RECORDS
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className={`px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-1 transition-all text-xs font-mono font-medium ${
                page === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer"
              }`}
            >
              <ArrowLeft size={12} /> PREV
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= stats.totalCount}
              className={`px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-1 transition-all text-xs font-mono font-medium ${
                (page + 1) * limit >= stats.totalCount
                  ? "opacity-40 cursor-not-allowed"
                  : "text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer"
              }`}
            >
              NEXT <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
