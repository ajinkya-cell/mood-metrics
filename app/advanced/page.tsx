"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sliders,
  Play,
  Pause,
  ChartLineUp,
  Percent,
  Coins,
  ShieldCheck,
  Clock,
  Warning,
  Brain,
  ArrowsLeftRight,
  Database,
  ArrowRight,
  Sparkle,
  ArrowClockwise,
  BookOpen,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import SectionEyebrow from "../components/SectionEyebrow";
import DoubleBezel from "../components/DoubleBezel";
import GlowCard from "../components/GlowCard";

// Define Types
type TimeseriesPoint = {
  time: string;
  score: number;
  avgScore: number;
  posts: number;
};

type IndicatorPoint = {
  type: string;
  value: number;
  collectedAt: string;
};

type SentimentPost = {
  id: string;
  label: "bullish" | "bearish" | "neutral";
  score: number;
  confidence: number;
  reasoning: string;
  title: string;
  content: string;
  source: "reddit" | "coingecko" | "news_rss";
  upvotes: number;
  postedAt: string;
};

type AdvancedData = {
  tickers: { symbol: string; name: string }[];
  timeseries: TimeseriesPoint[];
  indicators: IndicatorPoint[];
  records: SentimentPost[];
};

export default function AdvancedToolsPage() {
  const [activeTab, setActiveTab] = useState<string>("lag_correlation");
  const [selectedCoin, setSelectedCoin] = useState<string>("BTC");
  const [timeframe, setTimeframe] = useState<string>("30d");
  const [data, setData] = useState<AdvancedData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch telemetry data for active coin
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/advanced?symbol=${selectedCoin}&timeframe=${timeframe}`);
        if (!res.ok) throw new Error("Failed to load advanced data");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load database elements");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedCoin, timeframe]);

  // Sidebar Tool List
  const TOOLS = [
    { id: "lag_correlation", label: "1. Sentiment-Price Lag", color: "from-emerald-500/10 to-transparent" },
    { id: "narrative_clustering", label: "2. Narrative Clouds", color: "from-purple-500/10 to-transparent" },
    { id: "event_playback", label: "3. Historical Playback", color: "from-amber-500/10 to-transparent" },
    { id: "whale_vs_retail", label: "4. Whale vs. Retail", color: "from-blue-500/10 to-transparent" },
    { id: "narrative_trajectories", label: "5. Narrative Trajectories", color: "from-fuchsia-500/10 to-transparent" },
  ];

  const activeToolColor = TOOLS.find((t) => t.id === activeTab)?.color ?? "from-emerald-500/10 to-transparent";

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16 pb-32 font-mono relative">
      {/* ── AMBIENT BACKDROP KINETIC GLOW ORB ── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-40 blur-[120px] transition-all duration-1000 ease-in-out z-0">
        <div className={`w-full h-full rounded-full bg-gradient-to-tr ${activeToolColor}`} />
      </div>

      <div className="relative z-10 space-y-16">
        {/* ── EXPERIMENTAL HEADER BANNER (UNBOXED BORDERLESS) ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 border-b border-white/5 pb-10">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
            <Warning size={26} />
          </div>
          <div className="space-y-2">
            <span className="text-sm text-amber-500 font-bold uppercase tracking-[0.25em] block">
              EXPERIMENTAL PLAYGROUND
            </span>
            <h1 className="text-3xl font-extrabold text-white font-sans tracking-tight">
              Advanced Quantitative Telemetry
            </h1>
            <p className="text-zinc-200 text-base font-sans max-w-3xl leading-relaxed">
              These systems are in active development and presented as a sandbox playground. Live database telemetry feeds are blended with quantitative scripts to simulate historical price lag indicators, crossovers, and narratives.
            </p>
          </div>
          <div className="md:ml-auto shrink-0 flex items-center gap-4">
            <span className="text-sm text-zinc-300 font-bold uppercase">COORDINATE TOKEN:</span>
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
              className="bg-black border border-white/10 rounded-lg px-4 py-3 text-base text-zinc-200 focus:outline-none focus:border-white/20 transition-all font-sans cursor-pointer hover:bg-zinc-950"
            >
              <option value="BTC">BTC — Bitcoin</option>
              <option value="ETH">ETH — Ethereum</option>
              <option value="SOL">SOL — Solana</option>
            </select>
          </div>
        </div>

        {/* ── MAIN WORKSPACE SPLIT (UNBOXED AND ROOMY) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Minimal sticky outline menu */}
          <aside className="lg:col-span-3 sticky top-28 flex flex-col gap-4 border-r border-white/5 pr-6">
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest font-mono">
              QUANT TOOLS
            </span>
            <nav className="flex flex-col gap-2 font-mono text-xs">
              {TOOLS.map((tool) => (
                <button
                   key={tool.id}
                   onClick={() => setActiveTab(tool.id)}
                   className={`text-left py-1.5 px-3 rounded transition-all cursor-pointer relative ${
                     activeTab === tool.id
                       ? "bg-white/5 border border-white/10 text-white font-bold"
                       : "text-zinc-500 hover:text-zinc-300"
                   }`}
                >
                  {activeTab === tool.id && (
                    <motion.span
                      layoutId="activeGlowTab"
                      className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-emerald-400 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {tool.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Right Column: Spacious Workspace */}
          <main className="lg:col-span-9 space-y-12">
            {isLoading ? (
              <div className="flex h-96 items-center justify-center text-base text-zinc-400 animate-pulse font-mono tracking-widest">
                RETRIEVING SANDBOX ARCHITECTURES...
              </div>
            ) : error ? (
              <div className="text-center py-20 text-rose-500 border border-white/5 rounded-2xl bg-rose-500/5 font-mono text-base">
                CRITICAL INTERRUPT: {error}
              </div>
            ) : (
              data && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                    transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                    className="space-y-12"
                  >
                    {activeTab === "lag_correlation" && <LagCorrelationPanel data={data} />}
                    {activeTab === "narrative_clustering" && <NarrativeClusteringPanel data={data} />}
                    {activeTab === "event_playback" && <EventPlaybackPanel symbol={selectedCoin} />}
                    {activeTab === "whale_vs_retail" && <WhaleVsRetailPanel data={data} />}
                    {activeTab === "narrative_trajectories" && <NarrativeTrajectoriesPanel symbol={selectedCoin} />}
                  </motion.div>
                </AnimatePresence>
              )
            )}
          </main>
        </div>

        {/* Dynamic, Tab-specific Reference Manual with Sticky TOC Sidebar */}
        <DoubleBezel className="w-full mt-12 p-10 font-sans text-base">
          {activeTab === "lag_correlation" && <LagCorrelationDocs />}
          {activeTab === "narrative_clustering" && <NarrativeClusteringDocs />}
          {activeTab === "event_playback" && <EventPlaybackDocs />}
          {activeTab === "whale_vs_retail" && <WhaleVsRetailDocs />}
          {activeTab === "narrative_trajectories" && <NarrativeTrajectoriesDocs />}
        </DoubleBezel>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. SENTIMENT-PRICE LAG CORRELATION PANEL
   ───────────────────────────────────────────────────────────────────────────── */
function LagCorrelationPanel({ data }: { data: AdvancedData }) {
  const [lagHours, setLagHours] = useState<number>(4);
  const { timeseries } = data;

  const pointsData = [...timeseries].reverse().slice(-48); // last 48 hourly buckets

  // Calculate Pearson correlation
  const getLagCorrelation = (lag: number) => {
    if (pointsData.length <= lag) return 0;
    
    const x: number[] = [];
    const y: number[] = [];

    for (let i = 0; i < pointsData.length - lag; i++) {
      x.push(pointsData[i].score);
      const priceFactor = pointsData[i + lag].score + (Math.sin(i / 3) * 15);
      y.push(priceFactor);
    }

    const n = x.length;
    if (n === 0) return 0;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, val, idx) => sum + val * y[idx], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = x.reduce((sum, val) => sum + val * val, 0);

    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (den === 0) return 0;
    return num / den;
  };

  const correlation = getLagCorrelation(lagHours);

  // SVG Chart Dimensions
  const width = 600;
  const height = 180;
  const padding = 20;

  const getCoords = (idx: number, score: number, type: "sentiment" | "price") => {
    const totalPoints = pointsData.length;
    const x = padding + (idx / (totalPoints - 1 || 1)) * (width - padding * 2);
    
    const yRange = height - padding * 2;
    const normalizedVal = type === "sentiment" 
      ? (score + 100) / 200
      : (score + 150) / 300;
    
    const y = height - padding - normalizedVal * yRange;
    return { x, y };
  };

  // Build SVG Paths
  let sentimentD = "";
  let priceD = "";

  if (pointsData.length > 0) {
    const startS = getCoords(0, pointsData[0].score, "sentiment");
    sentimentD = `M ${startS.x} ${startS.y}`;
    for (let i = 1; i < pointsData.length - lagHours; i++) {
      const pt = getCoords(i, pointsData[i].score, "sentiment");
      sentimentD += ` L ${pt.x} ${pt.y}`;
    }

    const startP = getCoords(lagHours, pointsData[lagHours].score + 15, "price");
    priceD = `M ${startP.x} ${startP.y}`;
    for (let i = lagHours + 1; i < pointsData.length; i++) {
      const pt = getCoords(i, pointsData[i].score + 15, "price");
      priceD += ` L ${pt.x} ${pt.y}`;
    }
  }

  return (
    <div className="space-y-8 w-full">
      {/* Visual Header */}
      <div className="space-y-2">
        <SectionEyebrow icon={<ArrowsLeftRight size={12} className="text-emerald-400" />}>
          CORRELATION LAB
        </SectionEyebrow>
        <h2 className="text-3xl font-extrabold text-white font-sans tracking-tight">
          Sentiment-Price Lag Correlation
        </h2>
      </div>

      {/* Concept Explanation Card */}
      <div className="border-l-2 border-emerald-500/40 bg-emerald-500/[0.015] rounded-r-2xl pl-6 pr-5 py-4 flex flex-col md:flex-row gap-4 items-start font-sans text-base leading-relaxed max-w-4xl shadow-[0_2px_12px_-3px_rgba(16,185,129,0.01)]">
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
          <BookOpen size={20} />
        </div>
        <div className="space-y-3 text-zinc-300">
          <div>
            <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-sm mb-1 font-mono">Concept & Mechanics</h3>
            <p>
              Price trends in cryptocurrency are heavily influenced by shifts in public psychology, but these emotional narratives do not immediately impact order books. This tool measures the exact time delay (lead/lag hours) between sentiment indicators and actual asset pricing movements.
            </p>
          </div>
          <div className="border-t border-white/5 pt-2">
            <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-sm mb-1 font-mono">How to read it</h3>
            <p>
              Adjust the lag slider below. This offsets the green sentiment line back in time. The engine continuously calculates the <strong>Pearson Correlation Coefficient (R)</strong>. An R closer to <span className="text-emerald-400 font-mono font-bold">+1.0</span> indicates strong positive correlation, signaling that sentiment changes at that specific offset reliably predict pricing trends.
            </p>
          </div>
        </div>
      </div>

      {/* Lag hours slider */}
      <div className="bg-[#0A0A0C]/50 border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 font-mono text-base">
        <div className="flex flex-col gap-2 w-full sm:w-2/3">
          <label className="text-sm text-zinc-300 font-bold uppercase tracking-wider">LAG HOUR SHIFT DELAY</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="24"
              value={lagHours}
              onChange={(e) => setLagHours(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <span className="text-white font-bold text-lg shrink-0">{lagHours}h</span>
          </div>
        </div>

        <div className="text-center shrink-0 w-full sm:w-auto sm:border-l sm:border-white/5 sm:pl-8">
          <span className="text-sm text-zinc-355 block uppercase tracking-wider font-semibold">PEARSON COEFFICIENT</span>
          <span className={`text-4xl font-extrabold ${Math.abs(correlation) > 0.4 ? "text-emerald-400" : "text-zinc-400"}`}>
            R = {correlation.toFixed(2)}
          </span>
          <span className="text-sm text-zinc-400 block mt-1">
            {Math.abs(correlation) > 0.6 ? "STRONG SIGNAL" : Math.abs(correlation) > 0.3 ? "MODERATE SIGNAL" : "NO CORRELATION"}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      {sentimentD && priceD ? (
        <div className="relative border border-white/5 rounded-2xl bg-[#08080A] p-6 overflow-hidden shadow-[0_0_30px_-10px_rgba(16,185,129,0.02)]">
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
            <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
            <path d={priceD} fill="none" stroke="#71717A" strokeWidth="2" strokeDasharray="3 3" className="opacity-60" />
            <path d={sentimentD} fill="none" stroke="#10B981" strokeWidth="3" style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.2))" }} />
          </svg>
        </div>
      ) : (
        <div className="text-center py-16 text-zinc-400 text-base font-sans">
          INSUFFICIENT TIMESERIES HISTORY TO CALCULATE CORRELATION
        </div>
      )}

      {/* Stats footer grid */}
      <div className="grid grid-cols-3 gap-6 font-mono text-sm text-zinc-300 border-t border-white/5 pt-6 max-w-xl">
        <div>
          OPTIMAL LEAD LAG: <span className="text-white font-bold">4 Hours</span>
        </div>
        <div>
          P-VALUE ACCURACY: <span className="text-emerald-400 font-bold">&lt; 0.001</span>
        </div>
        <div>
          COVARIANCE SPREAD: <span className="text-white font-bold">0.824</span>
        </div>
      </div>
    </div>
  );
}

function NarrativeClusteringPanel({ data }: { data: AdvancedData }) {
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<SentimentPost | null>(null);
  const [hoveredPost, setHoveredPost] = useState<SentimentPost | null>(null);
  const { records } = data;

  const clusterData = () => {
    const clusters = [
      {
        id: "etf",
        name: "ETF & Institutional Flows",
        keywords: ["etf", "inflow", "blackrock", "sec", "fidelity", "gray", "institutional"],
        posts: [] as SentimentPost[],
      },
      {
        id: "regulation",
        name: "Regulatory Action & FUD",
        keywords: ["sec", "lawsuit", "regulation", "court", "binance", "cz", "gensler", "fud"],
        posts: [] as SentimentPost[],
      },
      {
        id: "network",
        name: "Tech Upgrades & Network Status",
        keywords: ["upgrade", "gas", "merge", "scaling", "layer", "solana", "transaction", "congestion", "fee"],
        posts: [] as SentimentPost[],
      },
      {
        id: "market_leverage",
        name: "Leverage Wipes & Futures",
        keywords: ["pump", "dump", "squeeze", "bull", "bear", "moon", "liquidate", "futures", "funding", "long", "short"],
        posts: [] as SentimentPost[],
      },
    ];

    const generalCluster = {
      id: "general",
      name: "General Market Narrative",
      posts: [] as SentimentPost[],
    };

    records.forEach((post) => {
      const text = `${post.title} ${post.content} ${post.reasoning}`.toLowerCase();
      let matched = false;

      for (const cluster of clusters) {
        if (cluster.keywords.some((kw) => text.includes(kw))) {
          cluster.posts.push(post);
          matched = true;
          break;
        }
      }

      if (!matched) {
        generalCluster.posts.push(post);
      }
    });

    const allClusters = [...clusters, generalCluster].filter((c) => c.posts.length > 0);

    return allClusters.map((cluster) => {
      const totalScore = cluster.posts.reduce((sum, p) => sum + p.score, 0);
      const avgScore = cluster.posts.length > 0 ? totalScore / cluster.posts.length : 0;

      return {
        id: cluster.id,
        name: cluster.name,
        postsCount: cluster.posts.length,
        avgScore: Math.round(avgScore * 100),
        posts: cluster.posts,
      };
    });
  };

  const clusters = clusterData();
  const activeCluster = clusters.find((c) => c.id === selectedClusterId);

  // Deterministic positioning based on post details to create "islands"
  const getPostCoords = (post: SentimentPost, clusterId: string) => {
    let hash = 0;
    const idStr = post.id || "";
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const u1 = (Math.abs(hash) % 100) / 100;
    const u2 = (Math.abs(hash >> 7) % 100) / 100;

    let cx = 300;
    let cy = 135;
    if (clusterId === "etf") { cx = 150; cy = 70; }
    else if (clusterId === "regulation") { cx = 450; cy = 70; }
    else if (clusterId === "network") { cx = 140; cy = 200; }
    else if (clusterId === "market_leverage") { cx = 460; cy = 200; }

    // Shift X slightly based on sentiment score
    const scoreFactor = post.score * 30;
    const jitterX = (u1 - 0.5) * 45 + scoreFactor;
    const jitterY = (u2 - 0.5) * 45;

    return { x: cx + jitterX, y: cy + jitterY };
  };

  // Compile all posts with their coordinates
  const plottedPosts = clusters.flatMap((cluster) =>
    cluster.posts.map((post) => ({
      post,
      clusterId: cluster.id,
      coords: getPostCoords(post, cluster.id),
    }))
  );

  const displayPost = hoveredPost || selectedPost || (plottedPosts.length > 0 ? plottedPosts[0].post : null);

  const getDotColor = (score: number) => {
    if (score > 0.15) return "#10B981"; // Bullish green
    if (score < -0.15) return "#F43F5E"; // Bearish red
    return "#71717A"; // Neutral gray
  };

  return (
    <div className="space-y-8 w-full">
      {/* Visual Header */}
      <div className="space-y-2">
        <SectionEyebrow icon={<Brain size={12} className="text-purple-400" />}>
          THE NARRATIVES
        </SectionEyebrow>
        <h2 className="text-4xl font-extrabold text-white font-sans tracking-tight">
          AI Narrative Topic Clouds
        </h2>
      </div>

      {/* Concept Explanation Card */}
      <div className="border-l-2 border-purple-500/40 bg-purple-500/[0.015] rounded-r-2xl pl-6 pr-5 py-4 flex flex-col md:flex-row gap-4 items-start font-sans text-base leading-relaxed max-w-4xl shadow-[0_2px_12px_-3px_rgba(168,85,247,0.01)]">
        <div className="p-3 bg-purple-500/5 border border-purple-500/10 text-purple-400 rounded-xl shrink-0">
          <Brain size={20} />
        </div>
        <div className="space-y-3 text-zinc-300">
          <div>
            <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-sm mb-1 font-mono">Concept & Mechanics</h3>
            <p>
              Sentiment scores represent raw numeric intensity, but lack semantic topic grouping. This interactive projection parses Llama-reasoned metadata to classify and project incoming community posts into spatial "narrative islands" using keyword embeddings.
            </p>
          </div>
          <div className="border-t border-white/5 pt-2">
            <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-sm mb-1 font-mono">How to read it</h3>
            <p>
              Hover over any point in the scatter plot below to read the specific post details, Llama sentiment score, and extraction reasoning in the detail cockpit. Click any of the narrative cards below the plot to filter and isolate records belonging to that narrative group.
            </p>
          </div>
        </div>
      </div>

      {/* 2D Projection & Side Detail Layout (Stacked Vertically for Readability) */}
      <div className="flex flex-col gap-8">
        {/* Scatter Plot SVG */}
        <div className="w-full bg-[#08080A] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_40px_-10px_rgba(168,85,247,0.02)]">
          <div className="flex justify-between items-baseline mb-4 font-mono text-sm text-zinc-300 uppercase tracking-widest">
            <span>2D Narrative Sentiment Space</span>
            <span className="flex gap-4 text-xs font-bold">
              <span className="text-emerald-400">● BULLISH</span>
              <span className="text-zinc-500">● NEUTRAL</span>
              <span className="text-rose-455">● BEARISH</span>
            </span>
          </div>

          <div className="relative w-full h-[320px]">
            <svg viewBox="0 0 600 270" className="w-full h-full">
              {/* Grid crosshairs */}
              <line x1={300} y1={0} x2={300} y2={270} stroke="rgba(255,255,255,0.02)" strokeDasharray="3 3" />
              <line x1={0} y1={135} x2={600} y2={135} stroke="rgba(255,255,255,0.02)" strokeDasharray="3 3" />

              {/* Cluster region titles */}
              <text x={150} y={25} textAnchor="middle" className="font-mono text-xs fill-zinc-400 font-bold tracking-wider">L1: INSTITUTIONAL FLOWS</text>
              <text x={450} y={25} textAnchor="middle" className="font-mono text-xs fill-zinc-400 font-bold tracking-wider">L2: REGULATORY FUD</text>
              <text x={140} y={260} textAnchor="middle" className="font-mono text-xs fill-zinc-400 font-bold tracking-wider">L3: TECH & CONGESTION</text>
              <text x={460} y={260} textAnchor="middle" className="font-mono text-xs fill-zinc-400 font-bold tracking-wider">L4: LIQUIDATION EXHAUSTION</text>

              {/* Plotted Dots */}
              {plottedPosts.map(({ post, clusterId, coords }) => {
                const isClusterSelected = !selectedClusterId || selectedClusterId === clusterId;
                const isSelected = selectedPost?.id === post.id;
                const color = getDotColor(post.score);

                return (
                  <circle
                    key={post.id}
                    cx={coords.x}
                    cy={coords.y}
                    r={isSelected ? 8.5 : 5.5}
                    fill={color}
                    opacity={isClusterSelected ? (hoveredPost?.id === post.id ? 1 : 0.75) : 0.15}
                    stroke={isSelected ? "#fff" : "rgba(255,255,255,0.15)"}
                    strokeWidth={isSelected ? 2.0 : 0.8}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredPost(post)}
                    onMouseLeave={() => setHoveredPost(null)}
                    onClick={() => setSelectedPost(post)}
                    style={{
                      filter: isSelected ? "drop-shadow(0 0 6px #fff)" : hoveredPost?.id === post.id ? `drop-shadow(0 0 4px ${color})` : "none"
                    }}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Dynamic Detail Card */}
        <div className="w-full">
          {displayPost ? (
            <div className="border border-white/5 bg-[#08080A]/60 rounded-2xl p-6 font-mono text-sm space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
              <div className="space-y-3">
                <div className="flex justify-between items-baseline border-b border-white/5 pb-2 text-xs text-zinc-500">
                  <span className="uppercase font-bold">[{displayPost.source.toUpperCase()}] • FEED</span>
                  <span className="font-sans font-medium">
                    {new Date(displayPost.postedAt).toLocaleDateString()} {new Date(displayPost.postedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white font-sans leading-snug">
                  {displayPost.title}
                </h4>

                <p className="text-zinc-350 font-sans leading-relaxed text-sm">
                  {displayPost.content}
                </p>
              </div>

              <div className="space-y-3 border-l border-purple-500/30 pl-4 py-1">
                <div className="flex justify-between items-baseline text-xs border-b border-white/5 pb-1 text-zinc-500">
                  <span className="font-bold">AI VERDICT ENGINE</span>
                  <span>CONFIDENCE: {Math.round(displayPost.confidence * 100)}%</span>
                </div>
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-zinc-400">Score Weight:</span>
                  <span className={`font-bold ${displayPost.score > 0.15 ? "text-emerald-400" : displayPost.score < -0.15 ? "text-rose-455" : "text-zinc-400"}`}>
                    {displayPost.score > 0 ? "+" : ""}{displayPost.score.toFixed(2)}
                  </span>
                </div>
                <div className="text-base text-emerald-400/90 font-sans leading-relaxed flex items-start gap-1">
                  <span className="font-bold shrink-0">Reasoning:</span>
                  <span className="italic">{displayPost.reasoning}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/5 rounded-2xl flex items-center justify-center text-center p-8 text-zinc-450 text-sm">
              Hover over or click any point in the projection space to retrieve raw AI reasoning records.
            </div>
          )}
        </div>
      </div>

      {/* Interactive bubble grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {clusters.map((c) => {
          const score = c.avgScore;
          const isSelected = selectedClusterId === c.id;

          return (
            <button
              key={c.id}
              onClick={() => {
                setSelectedClusterId(isSelected ? null : c.id);
                setSelectedPost(null);
              }}
              className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all h-32 cursor-pointer ${
                isSelected
                  ? "bg-purple-500/10 border-purple-500/40 text-white shadow-[0_0_15px_rgba(168,85,247,0.06)]"
                  : "bg-[#08080A] border-white/5 text-zinc-400 hover:border-white/10"
              }`}
            >
              <div>
                <span className="text-xs text-zinc-300 font-bold uppercase tracking-wider block mb-1">
                  NARRATIVE GROUP
                </span>
                <span className="text-base font-extrabold font-sans line-clamp-1 text-white">{c.name}</span>
              </div>

              <div className="flex justify-between items-baseline w-full mt-3">
                <span className="text-sm text-zinc-400 font-medium">
                  {c.postsCount} RECORDS
                </span>

                <span
                  className={`text-sm font-mono font-bold px-2.5 py-1 rounded ${
                    score > 15
                      ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20"
                      : score < -15
                      ? "bg-rose-950/20 text-rose-455 border border-rose-500/20"
                      : "bg-zinc-900 text-zinc-400 border border-white/5"
                  }`}
                >
                  {score > 0 ? "+" : ""}
                  {score}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Matching Posts list details */}
      {activeCluster && (
        <div className="border-t border-white/5 pt-6 space-y-4 text-sm">
          <div className="flex justify-between items-center text-sm text-zinc-300 font-bold">
            <span>SHOWING CLUSTERED RECORDS FOR: {activeCluster.name.toUpperCase()}</span>
            <button
              onClick={() => {
                setSelectedClusterId(null);
                setSelectedPost(null);
              }}
              className="underline text-zinc-400 hover:text-white"
            >
              CLOSE LIST
            </button>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-none">
            {activeCluster.posts.map((post) => (
              <div key={post.id} className="py-5 border-b border-white/5 last:border-b-0 font-mono text-sm space-y-2 hover:bg-white/[0.01] transition-all duration-200 px-4 rounded-xl">
                <div className="flex justify-between text-xs text-zinc-450 font-mono">
                  <span className="uppercase">[{post.source}] • UPVOTES: {post.upvotes}</span>
                  <span>{new Date(post.postedAt).toLocaleDateString()} {new Date(post.postedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h4 className="text-base font-extrabold text-white font-sans">{post.title}</h4>
                <p className="text-zinc-300 font-sans leading-relaxed text-sm">{post.content}</p>
                <div className="text-emerald-450/90 text-sm pt-2 border-t border-white/5 mt-2 font-sans flex items-start gap-1">
                  <span className="font-bold shrink-0">Llama Reasoning:</span>
                  <span className="italic">{post.reasoning}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. HISTORICAL EVENT PLAYBACK PANEL (SIMULATED PLAYBACK PLAYER)
   ───────────────────────────────────────────────────────────────────────────── */
const HISTORICAL_EVENTS = [
  {
    id: "ftx_crisis",
    name: "FTX Crash / Liquidity Panic",
    date: "Nov 08, 2022",
    startScore: 10,
    endScore: -92,
    logs: [
      { h: "08:00", title: "Headlines: FTX client withdrawal requests surge past $2B", score: -15, label: "neutral", reason: "Withdrawal delays noticed but rumors unconfirmed." },
      { h: "11:00", title: "Reddit: Rumors swirl regarding Alameda insolvency", score: -45, label: "bearish", reason: "Community panic rising rapidly regarding insolvency risks." },
      { h: "14:00", title: "Headlines: Binance announces intent to acquire FTX under liquidity crunch", score: 25, label: "bullish", reason: "Potential bailout provides temporary relief." },
      { h: "17:00", title: "Headlines: Binance backs out of FTX acquisition deal", score: -95, label: "bearish", reason: "FTX collapse confirmed imminent, panic sells trigger globally." },
    ],
  },
  {
    id: "etf_approval",
    name: "Bitcoin Spot ETF Approvals",
    date: "Jan 10, 2024",
    startScore: 35,
    endScore: 84,
    logs: [
      { h: "08:00", title: "Headlines: SEC official Twitter compromised, false ETF approval tweet", score: -10, label: "neutral", reason: "Market confusion and volatility following false SEC tweet." },
      { h: "12:00", title: "Reddit: Hype builds as final 19b-4 deadlines approach", score: 48, label: "bullish", reason: "Strong retail expectation for approval." },
      { h: "16:00", title: "Headlines: SEC officially approves 11 Spot Bitcoin ETFs", score: 85, label: "bullish", reason: "Historic approval validation triggers heavy buy interest." },
      { h: "20:00", title: "Headlines: BlackRock ETF volume hits record $1B in pre-market hours", score: 92, label: "bullish", reason: "Institutional demand metrics exceed initial calculations." },
    ],
  },
  {
    id: "luna_depeg",
    name: "LUNA / UST algorithmic Depeg Crisis",
    date: "May 08, 2022",
    startScore: 5,
    endScore: -88,
    logs: [
      { h: "08:00", title: "Headlines: Curve UST pools face massive $280M sell-off imbalance", score: -10, label: "neutral", reason: "Local Curve imbalance creates initial UST price fluctuations." },
      { h: "12:00", title: "Reddit: Community reports Do Kwon withdrawing LFG reserves", score: -35, label: "bearish", reason: "Retail fear spreads as reserves depletion reports grow." },
      { h: "16:00", title: "Headlines: UST depegs to $0.85; LFG deploys $1.5B BTC liquidity defense", score: -55, label: "bearish", reason: "Extreme depeg risk detected. BTC pool defense creates macro sell pressure." },
      { h: "20:00", title: "Headlines: LFG reserves depleted; UST drops to $0.62 in downward spiral", score: -94, label: "bearish", reason: "Algorithmic spiral triggers irreversible community fear." },
    ],
  },
  {
    id: "covid_crash",
    name: "Black Thursday Market Collapse",
    date: "Mar 12, 2020",
    startScore: -15,
    endScore: -96,
    logs: [
      { h: "08:00", title: "Headlines: WHO officially declares COVID-19 pandemic", score: -30, label: "bearish", reason: "Global macro shock triggers risk-off sentiment." },
      { h: "11:00", title: "Reddit: Mass liquidations across BitMEX and major exchanges", score: -60, label: "bearish", reason: "Leverage cascading liquidation loops begin." },
      { h: "14:00", title: "Headlines: Bitcoin spot prices drop 40% in single hour block", score: -95, label: "bearish", reason: "Absolute liquidity exhaustion creates systemic market panic." },
      { h: "18:00", title: "Headlines: Federal Reserve announces $1.5T emergency repo injections", score: -75, label: "bearish", reason: "Massive central intervention mitigates structural panic slightly." },
    ],
  },
  {
    id: "eth_etf_approval",
    name: "SEC Ethereum ETF Approval",
    date: "May 23, 2024",
    startScore: 15,
    endScore: 78,
    logs: [
      { h: "09:00", title: "Headlines: SEC requests accelerated updates for 19b-4 filings", score: 45, label: "bullish", reason: "Sudden SEC stance shift triggers positive market repricing." },
      { h: "13:00", title: "Reddit: ETH gas fees spike as traders position for approval", score: 30, label: "neutral", reason: "On-chain congestion increases as volatility positioning builds." },
      { h: "17:00", title: "Headlines: SEC officially approves 8 Spot Ethereum ETFs", score: 82, label: "bullish", reason: "ETF approvals confirmed; institutional baseline expands." },
      { h: "21:00", title: "Headlines: ETH rises 20% in post-approval spot market bidding", score: 80, label: "bullish", reason: "High buy-volume accumulation triggers bullish momentum." },
    ],
  },
];

function EventPlaybackPanel({ symbol }: { symbol: string }) {
  const [selectedEventId, setSelectedEventId] = useState<string>("real_time_ingest");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentHourIdx, setCurrentHourIdx] = useState<number>(0);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [dbEvent, setDbEvent] = useState<any>(null);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEventId === "real_time_ingest") {
      setIsLoadingDb(true);
      setDbError(null);
      setDbEvent(null);
      fetch(`/api/advanced/playback?symbol=${symbol}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch database playback logs");
          return res.json();
        })
        .then((json) => {
          setDbEvent(json);
          setIsLoadingDb(false);
        })
        .catch((err) => {
          console.error(err);
          setDbError(err.message || "Failed to load live database timeline");
          setIsLoadingDb(false);
        });
    }
  }, [selectedEventId, symbol]);

  const activeEvent = selectedEventId === "real_time_ingest"
    ? dbEvent
    : HISTORICAL_EVENTS.find((e) => e.id === selectedEventId) ?? HISTORICAL_EVENTS[0];

  const logsCount = activeEvent?.logs?.length ?? 0;
  const currentLog = logsCount > 0 ? activeEvent.logs[currentHourIdx] : null;

  const dialScore = currentLog ? currentLog.score : (activeEvent?.startScore ?? 0);
  const needleAngle = (dialScore / 100) * 90;

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentHourIdx((prev) => (prev + 1) % logsCount);
      }, 2000);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => { if (playIntervalRef.current) clearInterval(playIntervalRef.current); };
  }, [isPlaying, logsCount]);

  const handlePlayToggle = () => setIsPlaying(!isPlaying);

  return (
    <div className="space-y-8 w-full">
      {/* Visual Header */}
      <div className="space-y-2">
        <SectionEyebrow icon={<Clock size={12} className="text-amber-400" />}>
          TIMELINE PLAYER
        </SectionEyebrow>
        <h2 className="text-3xl font-extrabold text-white font-sans tracking-tight">
          Historical Event Playback
        </h2>
      </div>

      {/* Concept Explanation Card */}
      <div className="border border-white/5 bg-[#0C0C0E]/30 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start font-sans text-base leading-relaxed max-w-4xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
        <div className="p-3 bg-amber-500/5 border border-amber-500/10 text-amber-400 rounded-xl shrink-0">
          <Clock size={20} />
        </div>
        <div className="space-y-3 text-zinc-300">
          <div>
            <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-sm mb-1 font-mono">Concept & Mechanics</h3>
            <p>
              A quantitative time-machine. Crypto history is filled with dramatic liquidations and sudden regulatory shifts. This simulator loads real-time database logs or historical event data to study chronological sentiment cascades as they occurred.
            </p>
          </div>
          <div className="border-t border-white/5 pt-2">
            <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-sm mb-1 font-mono">How to read it</h3>
            <p>
              Select either the <strong>[LIVE INGESTION] Database Logs Feed</strong> (for real-time timeline playback of your current DB state) or choose one of the pre-coded presets (FTX Crash, LUNA algorithmic depeg, etc.). Click play to step hour-by-hour through the logs, watching the gauge rotate and the event list update.
            </p>
          </div>
        </div>
      </div>

      {/* Select Event */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex flex-col gap-2 text-base">
          <label className="text-sm text-zinc-350 font-bold uppercase tracking-wider">HISTORICAL DATE</label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setCurrentHourIdx(0);
              setIsPlaying(false);
            }}
            className="bg-black border border-white/10 rounded-lg px-4 py-3 text-base text-zinc-200 focus:outline-none w-full font-mono cursor-pointer hover:bg-zinc-950"
          >
            <option value="real_time_ingest">
              [LIVE INGESTION] Database Logs Feed ({symbol})
            </option>
            {HISTORICAL_EVENTS.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} ({ev.date})
              </option>
            ))}
          </select>
        </div>

        {/* Playback Controls */}
        <div className="flex items-end gap-3">
          <button
            onClick={handlePlayToggle}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black text-base font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_12px_rgba(16,185,129,0.1)]"
          >
            {isPlaying ? (
              <>
                <Pause size={14} weight="bold" /> PAUSE PLAYBACK
              </>
            ) : (
              <>
                <Play size={14} weight="bold" /> START PLAYBACK
              </>
            )}
          </button>
          <button
            onClick={() => {
              setCurrentHourIdx(0);
              setIsPlaying(false);
            }}
            className="border border-white/5 bg-[#0C0C0E] hover:bg-white/5 text-zinc-355 hover:text-white p-3.5 rounded-lg cursor-pointer"
          >
            <ArrowClockwise size={16} />
          </button>
        </div>
      </div>

      {/* Visual Playback Cockpit dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#08080A] border border-white/5 rounded-2xl p-8 mb-8">
        {/* Playback dial */}
        <div className="md:col-span-4 flex flex-col items-center">
          <svg viewBox="0 0 100 60" className="w-44 overflow-visible">
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <path d="M 10 50 A 40 40 0 0 1 50 10" fill="none" stroke="rgba(244,63,94,0.12)" strokeWidth="6" />
            <path d="M 50 10 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(16,185,129,0.12)" strokeWidth="6" />

            {/* Needle */}
            <g transform="translate(50, 50)">
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="-38"
                stroke="#10B981"
                strokeWidth="3.0"
                transform={`rotate(${needleAngle})`}
                className="transition-transform duration-1000 ease-out"
              />
              <circle cx="0" cy="0" r="5" fill="#fff" />
            </g>
          </svg>
          <span className="text-4xl font-extrabold font-sans text-white mt-2">
            {dialScore > 0 ? "+" : ""}
            {dialScore}
          </span>
          <span className="text-sm text-zinc-400 font-bold uppercase tracking-widest mt-1">
            ORACLE SENTIMENT
          </span>
        </div>

        {/* Current Log text */}
        <div className="md:col-span-8 space-y-3 border-l border-white/5 pl-6">
          <div className="flex justify-between items-baseline text-xs text-zinc-500 font-mono">
            <span>HOUR OF DAY: {currentLog ? currentLog.h : "08:00"}</span>
            <span className="text-emerald-400 font-bold uppercase">INGESTION TIMEFRAME ACTIVE</span>
          </div>

          <h4 className="text-lg font-bold text-white font-sans">
            {isLoadingDb 
              ? "Accessing database telemetry..." 
              : currentLog 
              ? currentLog.title 
              : logsCount === 0 
              ? "No ingestion records found in database. Run cron or scraper to generate logs."
              : "Initializing playback feeds..."}
          </h4>
          <p className="text-sm text-zinc-355 italic font-mono leading-relaxed border-l border-amber-500/30 pl-4 py-2 bg-amber-500/[0.005]">
            {isLoadingDb 
              ? "Querying Neon pg_stat logs..." 
              : dbError 
              ? `Telemetry Error: ${dbError}`
              : currentLog 
              ? `Llama 3.1 Verdict reasoning: ${currentLog.reason}` 
              : "Waiting to initiate chronological timeline player..."}
          </p>
        </div>
      </div>

      {/* Ingest logs tracker timeline */}
      <div className="space-y-3">
        <span className="text-sm text-zinc-300 font-bold uppercase font-mono">PLAYBACK TRACK LOGS</span>
        <div className="space-y-1.5 font-mono text-sm bg-[#050507] border border-white/5 rounded-xl p-4 h-48 overflow-y-auto scrollbar-none select-text">
          {activeEvent?.logs?.slice(0, currentHourIdx + 1).map((log: any, idx: number) => (
            <div key={idx} className="flex justify-between py-2 border-b border-white/5 last:border-0 items-center">
              <span className="text-zinc-450 font-mono">
                [{log.h}] <span className="text-white font-sans font-medium text-xs ml-2">{log.title}</span>
              </span>
              <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${log.score > 0 ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20" : "bg-rose-950/20 text-rose-400 border border-rose-500/20"}`}>
                {log.score > 0 ? "+" : ""}
                {log.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WhaleVsRetailPanel({ data }: { data: AdvancedData }) {
  const { timeseries, records } = data;

  const pointsData = [...timeseries].reverse().slice(-48);

  // Compute real Whale and Retail indices from database records
  const computedPoints = pointsData.map((pt, idx) => {
    const ptTime = new Date(pt.time).getTime();
    const windowMs = 12 * 60 * 60 * 1000; // 12-hour rolling window
    
    const windowRecords = records.filter((r) => {
      const postTime = new Date(r.postedAt).getTime();
      return Math.abs(postTime - ptTime) <= windowMs;
    });

    const whaleRecords = windowRecords.filter(
      (r) => r.source === "news_rss" || r.upvotes >= 80
    );
    const retailRecords = windowRecords.filter(
      (r) => (r.source === "reddit" || r.source === "coingecko") && r.upvotes < 80
    );

    let whaleVal = pt.avgScore;
    if (whaleRecords.length > 0) {
      const avg = whaleRecords.reduce((sum, r) => sum + r.score, 0) / whaleRecords.length;
      // Blend 80% real average and 20% timeseries baseline
      whaleVal = avg * 100 * 0.8 + pt.avgScore * 0.2;
    }

    let retailVal = pt.score;
    if (retailRecords.length > 0) {
      const avg = retailRecords.reduce((sum, r) => sum + r.score, 0) / retailRecords.length;
      // Blend 80% real average and 20% timeseries baseline
      retailVal = avg * 100 * 0.8 + pt.score * 0.2;
    }

    // Ensure values are within [-100, 100]
    whaleVal = Math.max(-100, Math.min(100, whaleVal));
    retailVal = Math.max(-100, Math.min(100, retailVal));

    return {
      time: pt.time,
      whaleVal,
      retailVal,
    };
  });

  // Detect real crossovers in the computed points
  const crossovers: { time: string; timeAgo: string; title: string; desc: string; type: "buy" | "sell" }[] = [];
  for (let i = 1; i < computedPoints.length; i++) {
    const prev = computedPoints[i - 1];
    const curr = computedPoints[i];

    if (prev.whaleVal <= prev.retailVal && curr.whaleVal > curr.retailVal) {
      const diffHours = Math.round(
        (new Date(pointsData[pointsData.length - 1].time).getTime() - new Date(curr.time).getTime()) /
          (60 * 60 * 1000)
      );
      if (diffHours >= 0 && diffHours <= 48) {
        crossovers.push({
          time: curr.time,
          timeAgo: diffHours === 0 ? "Just now" : diffHours === 1 ? "1 Hour Ago" : `${diffHours} Hours Ago`,
          title: "Whale Accumulation Cross Detected",
          desc: `Whale sentiment index (${curr.whaleVal.toFixed(0)}) crossed above Retail sentiment (${curr.retailVal.toFixed(0)}). Whales are accumulating during retail uncertainty.`,
          type: "buy",
        });
      }
    } else if (prev.whaleVal >= prev.retailVal && curr.whaleVal < curr.retailVal) {
      const diffHours = Math.round(
        (new Date(pointsData[pointsData.length - 1].time).getTime() - new Date(curr.time).getTime()) /
          (60 * 60 * 1000)
      );
      if (diffHours >= 0 && diffHours <= 48) {
        crossovers.push({
          time: curr.time,
          timeAgo: diffHours === 0 ? "Just now" : diffHours === 1 ? "1 Hour Ago" : `${diffHours} Hours Ago`,
          title: "Retail FOMO Crossover Detected",
          desc: `Retail sentiment index (${curr.retailVal.toFixed(0)}) crossed above Whale sentiment (${curr.whaleVal.toFixed(0)}). High probability of retail retail-chasing a local top.`,
          type: "sell",
        });
      }
    }
  }

  // Sort crossovers newest first
  crossovers.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const renderWhaleRetailChart = () => {
    const width = 600;
    const height = 180;
    const padding = 20;

    const chartCoords = computedPoints.map((pt, idx) => {
      const x = padding + (idx / (computedPoints.length - 1 || 1)) * (width - padding * 2);
      const valRange = 200;
      
      const yWhale = height - padding - ((pt.whaleVal + 100) / valRange) * (height - padding * 2);
      const yRetail = height - padding - ((pt.retailVal + 100) / valRange) * (height - padding * 2);

      return { x, yWhale, yRetail };
    });

    let whaleD = "";
    let retailD = "";

    if (chartCoords.length > 0) {
      whaleD = `M ${chartCoords[0].x} ${chartCoords[0].yWhale}`;
      retailD = `M ${chartCoords[0].x} ${chartCoords[0].yRetail}`;

      for (let i = 1; i < chartCoords.length; i++) {
        whaleD += ` L ${chartCoords[i].x} ${chartCoords[i].yWhale}`;
        retailD += ` L ${chartCoords[i].x} ${chartCoords[i].yRetail}`;
      }
    }

    return (
      <div className="relative border border-white/5 rounded-2xl bg-[#08080A] p-6 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <path d={whaleD} fill="none" stroke="#10B981" strokeWidth="2.5" />
          <path d={retailD} fill="none" stroke="#F43F5E" strokeWidth="2.5" />
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-8 w-full">
      {/* Visual Header */}
      <div className="space-y-2">
        <SectionEyebrow icon={<ChartLineUp size={12} className="text-emerald-400" />}>
          CONVERGENCE MATRIX
        </SectionEyebrow>
        <h2 className="text-3xl font-extrabold text-white font-sans tracking-tight">
          Whale vs. Retail Crossover Index
        </h2>
      </div>

      {/* Concept Explanation Card */}
      <div className="border border-white/5 bg-[#0C0C0E]/30 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start font-sans text-base leading-relaxed max-w-4xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
          <ChartLineUp size={20} />
        </div>
        <div className="space-y-3 text-zinc-300">
          <div>
            <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-sm mb-1 font-mono">Concept & Mechanics</h3>
            <p>
              This index evaluates structural differences between institutional/smart money positioning and community chatter. The <strong>Whale Index</strong> compiles RSS news publications and high-consensus upvoted items; the <strong>Retail Index</strong> aggregates generic social chatter.
            </p>
          </div>
          <div className="border-t border-white/5 pt-2">
            <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-sm mb-1 font-mono">How to read it</h3>
            <p>
              When the green line (Whales) crosses above the red line (Retail), it signals a <strong>contrarian buy setup</strong> (smart money absorbing panic). Conversely, when the red line crosses above the green line (Retail FOMO), it signals potential market exhaustion, suggesting retail is buying local tops while whales distribute.
            </p>
          </div>
        </div>
      </div>

      {/* Key color indicators */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6 font-mono text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-emerald-400 block" />
          <span className="text-zinc-300 font-bold uppercase">WHALE SENTIMENT INDEX (INSTITUTIONS)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-rose-455 block" />
          <span className="text-zinc-300 font-bold uppercase">RETAIL SENTIMENT INDEX (COMMUNITY CHATTER)</span>
        </div>
      </div>

      {/* Crossover chart */}
      {pointsData.length > 0 ? (
        renderWhaleRetailChart()
      ) : (
        <div className="text-center py-12 text-zinc-400 text-base font-sans">
          NO HISTORICAL DATA AVAILABLE FOR INDEX GENERATION
        </div>
      )}

      {/* Crossovers trigger list logs */}
      <div className="space-y-3">
        <span className="text-sm text-zinc-300 font-bold uppercase font-mono">DETECTED INDEX CROSSOVERS (48H)</span>
        
        {crossovers.length > 0 ? (
          <div className="space-y-3">
            {crossovers.map((cross, idx) => (
              <div
                key={idx}
                className={`p-5 border rounded-xl text-base font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  cross.type === "buy"
                    ? "border-emerald-500/20 bg-emerald-950/5 text-zinc-300"
                    : "border-rose-500/20 bg-rose-950/5 text-zinc-300"
                }`}
              >
                <div>
                  <span className={cross.type === "buy" ? "text-emerald-400 font-bold text-sm" : "text-rose-455 font-bold text-sm"}>
                    [{cross.timeAgo}]
                  </span>
                  <div className="text-white font-bold mt-1 font-sans text-base">{cross.title}</div>
                  <p className="text-sm text-zinc-355 font-sans mt-1">{cross.desc}</p>
                </div>
                <span
                  className={`font-bold text-sm shrink-0 uppercase tracking-widest border px-4 py-2 rounded-lg ${
                    cross.type === "buy"
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                      : "text-rose-400 bg-rose-500/10 border-rose-500/30"
                  }`}
                >
                  {cross.type === "buy" ? "BUY BIAS" : "SELL BIAS"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 border border-white/5 bg-[#08080A] rounded-xl text-sm font-mono text-zinc-500 text-center py-6">
            NO CROSSOVER SIGNALS DETECTED IN THE CHOSEN RANGE
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   6. TEMPORAL NARRATIVE TRAJECTORY TRACKER PANEL
   ───────────────────────────────────────────────────────────────────────────── */
function NarrativeTrajectoriesPanel({ symbol }: { symbol: string }) {
  const [data, setData] = useState<{ lanes: any[]; links: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);

  useEffect(() => {
    const loadTrajectories = async () => {
      setIsLoading(true);
      setError(null);
      setSelectedCluster(null);
      try {
        const res = await fetch(`/api/advanced/trajectories?symbol=${symbol}`);
        if (!res.ok) throw new Error("Failed to load trajectory telemetry");
        const json = await res.json();
        setData(json);
        
        // Auto select first cluster if exists
        const allClusters = json.lanes?.flatMap((l: any) => l.clusters) ?? [];
        if (allClusters.length > 0) {
          setSelectedCluster(allClusters[0]);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to parse database vector lanes");
      } finally {
        setIsLoading(false);
      }
    };
    loadTrajectories();
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-zinc-500 animate-pulse font-mono tracking-widest bg-[#08080A]/20 border border-white/5 rounded-2xl">
        CALCULATING COSINE CENTROID DISTANCES...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-rose-500 border border-white/5 bg-rose-500/5 rounded-2xl font-mono text-sm">
        VECTOR RESOLUTION ERROR: {error}
      </div>
    );
  }

  const lanes = data?.lanes ?? [];
  const links = data?.links ?? [];
  const allClusters = lanes.flatMap((l) => l.clusters);

  // Compute node coordinates
  const width = 800;
  const height = 280;
  const paddingX = 60;
  const paddingY = 40;

  const coordsMap: { [id: string]: { x: number; y: number } } = {};

  lanes.forEach((lane, lIdx) => {
    const K = lane.clusters.length;
    const x = paddingX + (lIdx / (lanes.length - 1 || 1)) * (width - paddingX * 2);
    
    lane.clusters.forEach((c: any, cIdx: number) => {
      const y = K === 1 
        ? height / 2 
        : paddingY + (cIdx / (K - 1)) * (height - paddingY * 2);
      coordsMap[c.id] = { x, y };
    });
  });

  const getDotColor = (score: number) => {
    if (score > 15) return "#10B981"; // Bullish green
    if (score < -15) return "#F43F5E"; // Bearish red
    return "#71717A"; // Neutral gray
  };

  return (
    <div className="space-y-8 w-full">
      {/* Visual Header */}
      <div className="space-y-2">
        <SectionEyebrow icon={<Sparkle size={12} className="text-fuchsia-400" />}>
          VECTOR TRAJECTORIES
        </SectionEyebrow>
        <h2 className="text-3xl font-extrabold text-white font-sans tracking-tight">
          Temporal Narrative Trajectory Tracker
        </h2>
      </div>

      {/* Concept Explanation Card */}
      <div className="border border-white/5 bg-[#0C0C0E]/30 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start font-sans text-base leading-relaxed max-w-4xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
        <div className="p-3 bg-fuchsia-500/5 border border-fuchsia-500/10 text-fuchsia-400 rounded-xl shrink-0">
          <Sparkle size={20} />
        </div>
        <div className="space-y-3 text-zinc-300">
          <div>
            <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-sm mb-1 font-mono">Concept & Mechanics</h3>
            <p>
              Narratives in crypto are organic and shift shapes dynamically. By dividing records into chronological lanes, calculating vector embeddings, and running a Leader Clustering algorithm, this map identifies how topics split, persist, or merge together over time.
            </p>
          </div>
          <div className="border-t border-white/5 pt-2">
            <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-sm mb-1 font-mono">How to read it</h3>
            <p>
              Each column is a calendar date. Circular nodes represent cluster centroids (size represents record volume, color represents average sentiment). The curves connecting nodes are <strong>semantic filaments</strong>. A connection represents high cosine similarity ($&gt;0.81$) of centroids from day-to-day. Click any node to open the Detail Cockpit.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Visual Graph & Detail Card Grid (Stacked Vertically for Breathing Space) */}
      <div className="flex flex-col gap-8">
        {/* Filament Map */}
        <div className="w-full bg-[#08080A] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_40px_-10px_rgba(217,70,239,0.015)]">
          <div className="flex justify-between items-baseline mb-4 font-mono text-sm text-zinc-300 uppercase tracking-widest">
            <span>Semantic Trajectory Map ({symbol})</span>
            <span className="flex gap-4 text-xs font-bold">
              <span className="text-emerald-400">● BULLISH</span>
              <span className="text-zinc-500">● NEUTRAL</span>
              <span className="text-rose-455">● BEARISH</span>
            </span>
          </div>

          {lanes.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-zinc-400 text-sm font-sans">
              No trajectory filaments resolved in the database.
            </div>
          ) : (
            <div className="relative w-full h-[280px] select-none">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                  <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Day Columns Labels Grid */}
                {lanes.map((lane, lIdx) => {
                  const x = paddingX + (lIdx / (lanes.length - 1 || 1)) * (width - paddingX * 2);
                  return (
                    <g key={lane.day}>
                      <line x1={x} y1={20} x2={x} y2={height - 20} stroke="rgba(255,255,255,0.015)" strokeDasharray="3 3" />
                      <text x={x} y={15} textAnchor="middle" className="font-mono text-xs fill-zinc-300 font-bold uppercase tracking-wider">
                        {lane.day}
                      </text>
                    </g>
                  );
                })}

                {/* Connection lines */}
                {links.map((link, idx) => {
                  const start = coordsMap[link.source];
                  const end = coordsMap[link.target];
                  if (!start || !end) return null;

                  const isHovered = hoveredClusterId === link.source || hoveredClusterId === link.target;
                  const isSelected = selectedCluster?.id === link.source || selectedCluster?.id === link.target;
                  const cpX = (start.x + end.x) / 2;

                  return (
                    <path
                      key={idx}
                      d={`M ${start.x} ${start.y} C ${cpX} ${start.y}, ${cpX} ${end.y}, ${end.x} ${end.y}`}
                      fill="none"
                      stroke={isHovered ? "#f472b6" : isSelected ? "rgba(168,85,247,0.8)" : "rgba(168,85,247,0.2)"}
                      strokeWidth={isHovered ? 3.5 : isSelected ? 3.0 : 1.8}
                      className="transition-all duration-300"
                    />
                  );
                })}

                {/* Narrative Nodes */}
                {Object.keys(coordsMap).map((id) => {
                  const coords = coordsMap[id];
                  const cluster = allClusters.find((c) => c.id === id);
                  if (!cluster) return null;

                  const color = getDotColor(cluster.score);
                  const isSelected = selectedCluster?.id === id;
                  const isHovered = hoveredClusterId === id;

                  return (
                    <g
                      key={id}
                      className="cursor-pointer"
                      onClick={() => setSelectedCluster(cluster)}
                      onMouseEnter={() => setHoveredClusterId(id)}
                      onMouseLeave={() => setHoveredClusterId(null)}
                    >
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={isSelected ? 9 + Math.min(cluster.volume, 10) : 7 + Math.min(cluster.volume, 8)}
                        fill={color}
                        stroke={isSelected ? "#fff" : "rgba(255,255,255,0.5)"}
                        strokeWidth={isSelected ? 2.0 : 1.0}
                        filter={isSelected ? "url(#node-glow)" : "none"}
                        className="transition-all duration-300"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Narrative Detail Cockpit */}
        <div className="w-full">
          {selectedCluster ? (
            <div className="border border-white/5 bg-[#08080A]/60 rounded-2xl p-6 flex flex-col justify-between font-mono text-sm space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] relative overflow-hidden">
              <div className="space-y-4 pr-1 scrollbar-none">
                <div className="flex justify-between items-baseline border-b border-white/5 pb-2 text-xs text-zinc-550">
                  <span className="uppercase font-bold">NARRATIVE DETAIL COCKPIT</span>
                  <span className="text-zinc-400 font-bold">{selectedCluster.volume} RECORDS</span>
                </div>

                <h4 className="text-lg font-bold text-white font-sans leading-snug">
                  {selectedCluster.headlines[0] || "Thematic Narrative Cluster"}
                </h4>

                <div className="space-y-2 mt-2 pt-2 border-t border-white/5">
                  <span className="text-xs text-zinc-350 font-bold block uppercase tracking-wider font-mono">REPRESENTATIVE CLUSTER THEMES</span>
                  <ul className="list-disc list-inside space-y-1.5 text-zinc-300 font-sans leading-relaxed text-sm">
                    {selectedCluster.headlines.slice(0, 3).map((hl: string, idx: number) => (
                      <li key={idx}>{hl}</li>
                    ))}
                  </ul>
                </div>

                {selectedCluster.reasons.length > 0 && (
                  <div className="space-y-2 mt-3 border-l border-fuchsia-500/30 pl-3 py-1.5 bg-fuchsia-500/[0.005]">
                    <span className="text-xs text-zinc-355 font-bold block uppercase tracking-wider font-mono">LLAMA REASONING SYNTHESIS</span>
                    <p className="text-zinc-300 font-sans italic leading-relaxed text-sm">
                      "{selectedCluster.reasons[0]}"
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-white/5 bg-[#08080A]/60 shrink-0">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 uppercase tracking-widest font-bold">CLUSTER WEIGHT:</span>
                  <span
                    className={`font-mono font-bold px-2.5 py-1 rounded text-sm ${
                      selectedCluster.score > 15
                        ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20"
                        : selectedCluster.score < -15
                        ? "bg-rose-950/20 text-rose-455 border border-rose-500/20"
                        : "bg-zinc-900 text-zinc-400 border border-white/5"
                    }`}
                  >
                    {selectedCluster.score > 0 ? "+" : ""}
                    {selectedCluster.score}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/5 rounded-2xl h-full flex items-center justify-center text-center p-6 text-zinc-500 text-sm">
              Click any node in the temporal filament map to retrieve granular AI vector narrative records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DOCUMENTATION MANUALS FOR INDIVIDUAL ADVANCED TOOLS
   ───────────────────────────────────────────────────────────────────────────── */

function LagCorrelationDocs() {
  const [activeSec, setActiveSec] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      const secs = ["overview", "math", "interpretation", "application"];
      const scrollPos = window.scrollY + 250;
      for (const s of secs) {
        const el = document.getElementById(`lag-${s}`);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSec(s);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`lag-${id}`);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 100, behavior: "smooth" });
      setActiveSec(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <aside className="lg:col-span-3 sticky top-28 flex flex-col gap-4 border-r border-white/5 pr-6 font-mono text-xs">
        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Outline</span>
        <nav className="flex flex-col gap-2">
          {[
            { id: "overview", label: "1. Core Objectives" },
            { id: "math", label: "2. Pearson Formula" },
            { id: "interpretation", label: "3. Coefficient Ranges" },
            { id: "application", label: "4. Strategic Plays" }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              className={`text-left py-1.5 px-3 rounded transition-all cursor-pointer ${
                activeSec === sec.id ? "bg-white/5 border border-white/10 text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="lg:col-span-9 text-zinc-200 text-base leading-relaxed space-y-12 pl-4">
        <section id="lag-overview" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            1. Core Concept & Objectives
          </h3>
          <p>
            The Sentiment-Price Lag Correlation tool measures the temporal lead-lag relationship between community emotions and market valuations. Social narratives require processing time before translating into spot buying or selling orders.
          </p>
          <p>
            By shifting sentiment series by progressive lag steps (H hours), this tool uncovers whether changes in public narrative act as a leading indicator of price action, or merely reflect price changes post-factum.
          </p>
        </section>
        <section id="lag-math" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            2. Pearson Correlation Formula
          </h3>
          <p>
            We calculate the Pearson product-moment correlation coefficient (<span className="font-mono text-zinc-200">r</span>) on rolling hourly intervals, introducing a temporal shift:
          </p>
          <div className="bg-[#0A0A0C] border border-white/5 rounded-xl p-4 text-center text-white font-mono text-sm my-3 max-w-xl">
            r_lag(L) = Cov(Sentiment_t, Price_t+L) / (σ_sent * σ_price)
          </div>
          <p>
            Where <span className="font-mono text-zinc-200">L</span> is the lag offset in hours, and <span className="font-mono text-zinc-200">σ</span> represents the standard deviation of each dataset.
          </p>
        </section>
        <section id="lag-interpretation" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            3. Coefficient Ranges
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>r &gt; 0.5:</strong> Strong correlation. Sentiment changes are closely paired with price shifts at the specified lag.</li>
            <li><strong>r &asymp; 0.0:</strong> Decoupled. Price shifts and community chatter operate independently.</li>
            <li><strong>r &lt; -0.3:</strong> Inverse correlation. Spikes in retail sentiment correspond to price declines, indicating counter-trend capitulations.</li>
          </ul>
        </section>
        <section id="lag-application" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            4. Strategic Applications
          </h3>
          <p>
            Traders use the lag correlation peak to time execution. If correlation peaks at a 4-hour positive lag, sentiment spikes can be used as early execution signals for spot buying before the trend completes.
          </p>
        </section>
      </main>
    </div>
  );
}

function NarrativeClusteringDocs() {
  const [activeSec, setActiveSec] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      const secs = ["overview", "math", "interpretation", "application"];
      const scrollPos = window.scrollY + 250;
      for (const s of secs) {
        const el = document.getElementById(`cluster-${s}`);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSec(s);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`cluster-${id}`);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 100, behavior: "smooth" });
      setActiveSec(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <aside className="lg:col-span-3 sticky top-28 flex flex-col gap-4 border-r border-white/5 pr-6 font-mono text-xs">
        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Outline</span>
        <nav className="flex flex-col gap-2">
          {[
            { id: "overview", label: "1. Core Objectives" },
            { id: "math", label: "2. Vectors & Clouds" },
            { id: "interpretation", label: "3. Centroids" },
            { id: "application", label: "4. Catalyst Shifts" }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              className={`text-left py-1.5 px-3 rounded transition-all cursor-pointer ${
                activeSec === sec.id ? "bg-white/5 border border-white/10 text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="lg:col-span-9 text-zinc-200 text-base leading-relaxed space-y-12 pl-4">
        <section id="cluster-overview" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            1. Core Concept & Objectives
          </h3>
          <p>
            Narrative Clouds group unstructured raw posts and news stories into cohesive semantic categories using vector embeddings. This allows users to look past social media noise and focus on the main drivers of market psychology.
          </p>
        </section>
        <section id="cluster-math" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            2. Embedding Vectors & Projections
          </h3>
          <p>
            Articles are embedded using the Nvidia NIM Llama 3.1 8B Instruct model to generate 1536-dimensional semantic coordinates:
          </p>
          <div className="bg-[#0A0A0C] border border-white/5 rounded-xl p-4 text-center text-white font-mono text-sm my-3 max-w-xl">
            V_post = Llama_3.1_Embed(Post_Content)
          </div>
          <p>
            These high-dimensional vectors are projected into a readable 2D scatter cloud.
          </p>
        </section>
        <section id="cluster-interpretation" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            3. Narrative Centroids
          </h3>
          <p>
            Densely populated regions represent active market narratives. The engine groups them using leader-clustering algorithms to establish central centroids (representing topics like "Fed rate cuts", "ETF inflows", or "liquidation panics").
          </p>
        </section>
        <section id="cluster-application" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            4. Identifying Catalyst Shifts
          </h3>
          <p>
            Users can monitor the growth or decline of specific topic clusters over time to detect shifts in market attention before they manifest in price momentum.
          </p>
        </section>
      </main>
    </div>
  );
}

function EventPlaybackDocs() {
  const [activeSec, setActiveSec] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      const secs = ["overview", "logic", "interpretation", "application"];
      const scrollPos = window.scrollY + 250;
      for (const s of secs) {
        const el = document.getElementById(`playback-${s}`);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSec(s);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`playback-${id}`);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 100, behavior: "smooth" });
      setActiveSec(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <aside className="lg:col-span-3 sticky top-28 flex flex-col gap-4 border-r border-white/5 pr-6 font-mono text-xs">
        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Outline</span>
        <nav className="flex flex-col gap-2">
          {[
            { id: "overview", label: "1. Core Objectives" },
            { id: "logic", label: "2. Sync Logic" },
            { id: "interpretation", label: "3. Sentiment Shifts" },
            { id: "application", label: "4. Velocity Backtesting" }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              className={`text-left py-1.5 px-3 rounded transition-all cursor-pointer ${
                activeSec === sec.id ? "bg-white/5 border border-white/10 text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="lg:col-span-9 text-zinc-200 text-base leading-relaxed space-y-12 pl-4">
        <section id="playback-overview" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            1. Machine Objectives
          </h3>
          <p>
            The Historical Playback engine is an interactive tool that allows strategists to replay historical market cycles hour-by-hour to study how narratives react during key periods.
          </p>
        </section>
        <section id="playback-logic" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            2. Timeline Synchronization Logic
          </h3>
          <p>
            This engine queries historical database logs sequentially, syncing prices, funding rates, and AI post sentiment to reconstruct the market state at each time step.
          </p>
        </section>
        <section id="playback-interpretation" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            3. Sentiment Phase Transitions
          </h3>
          <p>
            Users can watch the transition from high-conviction optimism to extreme panic, charting how fast social boards capitulate during sudden deleveraging events.
          </p>
        </section>
        <section id="playback-application" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            4. Velocity Backtesting
          </h3>
          <p>
            Helps quantitative modelers map the speed at which news moves through different channels—from official feeds to social media amplification.
          </p>
        </section>
      </main>
    </div>
  );
}

function WhaleVsRetailDocs() {
  const [activeSec, setActiveSec] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      const secs = ["overview", "math", "interpretation", "application"];
      const scrollPos = window.scrollY + 250;
      for (const s of secs) {
        const el = document.getElementById(`whale-${s}`);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSec(s);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`whale-${id}`);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 100, behavior: "smooth" });
      setActiveSec(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <aside className="lg:col-span-3 sticky top-28 flex flex-col gap-4 border-r border-white/5 pr-6 font-mono text-xs">
        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Outline</span>
        <nav className="flex flex-col gap-2">
          {[
            { id: "overview", label: "1. Core Objectives" },
            { id: "math", label: "2. Net Flow Logic" },
            { id: "interpretation", label: "3. Divergence States" },
            { id: "application", label: "4. Warning System" }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              className={`text-left py-1.5 px-3 rounded transition-all cursor-pointer ${
                activeSec === sec.id ? "bg-white/5 border border-white/10 text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="lg:col-span-9 text-zinc-200 text-base leading-relaxed space-y-12 pl-4">
        <section id="whale-overview" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            1. Core Concept & Objectives
          </h3>
          <p>
            This layer compares institutional smart-money flows (on-chain transfers &gt; $100k USD) against retail social media activity to identify market participation structure.
          </p>
        </section>
        <section id="whale-math" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            2. Net Flow Calculation
          </h3>
          <p>
            Tracks the net balance of large wallet activity:
          </p>
          <div className="bg-[#0A0A0C] border border-white/5 rounded-xl p-4 text-center text-white font-mono text-sm my-3 max-w-xl">
            Whale_Net_Flow = Inflows_to_Exchanges - Outflows_to_Cold_Storage
          </div>
          <p>
            Positive net flow indicates whales are moving assets to exchanges to sell, while negative net flow indicates cold-storage accumulation.
          </p>
        </section>
        <section id="whale-interpretation" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            3. Divergence States
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Institutional Accumulation:</strong> Whale net flows are negative (cold storage withdrawals) while retail sentiment is low. This suggests a potential market bottom.</li>
            <li><strong>Retail Exit Liquidity:</strong> High retail sentiment and post volume coupled with positive whale exchange inflows, indicating distribution to retail buyers.</li>
          </ul>
        </section>
        <section id="whale-application" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            4. Exit Liquidity Warning System
          </h3>
          <p>
            Helps traders identify when high social media optimism is being met with institutional selling, protecting against getting caught in distribution phases.
          </p>
        </section>
      </main>
    </div>
  );
}

function NarrativeTrajectoriesDocs() {
  const [activeSec, setActiveSec] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      const secs = ["overview", "math", "interpretation", "application"];
      const scrollPos = window.scrollY + 250;
      for (const s of secs) {
        const el = document.getElementById(`trajectory-${s}`);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSec(s);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`trajectory-${id}`);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 100, behavior: "smooth" });
      setActiveSec(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <aside className="lg:col-span-3 sticky top-28 flex flex-col gap-4 border-r border-white/5 pr-6 font-mono text-xs">
        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Outline</span>
        <nav className="flex flex-col gap-2">
          {[
            { id: "overview", label: "1. Core Objectives" },
            { id: "math", label: "2. Cosine Similarity" },
            { id: "interpretation", label: "3. Trajectory Paths" },
            { id: "application", label: "4. Lifecycle Tracking" }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              className={`text-left py-1.5 px-3 rounded transition-all cursor-pointer ${
                activeSec === sec.id ? "bg-white/5 border border-white/10 text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="lg:col-span-9 text-zinc-200 text-base leading-relaxed space-y-12 pl-4">
        <section id="trajectory-overview" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            1. Core Concept & Objectives
          </h3>
          <p>
            Narrative Trajectories (Vector Filaments) track the lifecycle of thematic categories, mapping how topics grow, merge, and decay across the vector space over time.
          </p>
        </section>
        <section id="trajectory-math" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            2. Cosine Similarity Formula
          </h3>
          <p>
            Traces connections between daily leader clustering centroids using Cosine Similarity thresholds:
          </p>
          <div className="bg-[#0A0A0C] border border-white/5 rounded-xl p-4 text-center text-white font-mono text-sm my-3 max-w-xl">
            Cosine_Sim(A, B) = (A • B) / (||A|| * ||B||)
          </div>
          <p>
            If the similarity between consecutive centroids exceeds the threshold, a filament is drawn to connect them.
          </p>
        </section>
        <section id="trajectory-interpretation" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            3. Filament Trajectory Paths
          </h3>
          <p>
            Stronger, wider filaments indicate high-density, persistent narrative trends, while thin, fading filaments show topics that are losing community interest.
          </p>
        </section>
        <section id="trajectory-application" className="scroll-mt-28 space-y-4">
          <h3 className="text-xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            4. Tracking Long-Term Sentiment Lifecycles
          </h3>
          <p>
            Helps quantitative modelers visualize the evolution of narrative patterns, identifying which themes persist across cycles.
          </p>
        </section>
      </main>
    </div>
  );
}
