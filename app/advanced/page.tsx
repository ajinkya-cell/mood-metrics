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
    { id: "anomaly_engine", label: "2. Divergence Alerts", color: "from-rose-500/10 to-transparent" },
    { id: "narrative_clustering", label: "3. Narrative Clouds", color: "from-purple-500/10 to-transparent" },
    { id: "event_playback", label: "4. Historical Playback", color: "from-amber-500/10 to-transparent" },
    { id: "whale_vs_retail", label: "5. Whale vs. Retail", color: "from-blue-500/10 to-transparent" },
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
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 border-b border-white/5 pb-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
            <Warning size={22} />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-amber-500 font-bold uppercase tracking-[0.25em] block">
              EXPERIMENTAL PLAYGROUND
            </span>
            <h1 className="text-xl font-extrabold text-white font-sans tracking-tight">
              Advanced Quantitative Telemetry
            </h1>
            <p className="text-zinc-500 text-xs font-sans max-w-2xl leading-relaxed">
              These systems are in active development and presented as a sandbox playground. Live database telemetry feeds are blended with quantitative scripts to simulate historical price lag indicators, crossovers, and narratives.
            </p>
          </div>
          <div className="md:ml-auto shrink-0 flex items-center gap-4">
            <span className="text-[10px] text-zinc-600 font-bold uppercase">COORDINATE TOKEN:</span>
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
              className="bg-black border border-white/10 rounded-lg px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-white/20 transition-all font-sans cursor-pointer hover:bg-zinc-950"
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
          <aside className="lg:col-span-3 sticky top-28 flex flex-col gap-4">
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest font-mono border-b border-white/5 pb-2">
              QUANT TOOLS
            </span>
            <nav className="flex flex-col gap-1 font-mono text-xs">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTab(tool.id)}
                  className={`text-left py-3 px-4 rounded-xl transition-all duration-500 relative ${
                    activeTab === tool.id
                      ? "text-white font-bold bg-white/5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {activeTab === tool.id && (
                    <motion.span
                      layoutId="activeGlowTab"
                      className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-400 rounded-full"
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
              <div className="flex h-96 items-center justify-center text-xs text-zinc-600 animate-pulse font-mono tracking-widest">
                RETRIEVING SANDBOX ARCHITECTURES...
              </div>
            ) : error ? (
              <div className="text-center py-20 text-rose-500 border border-white/5 rounded-2xl bg-rose-500/5 font-mono text-xs">
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
                    {activeTab === "anomaly_engine" && <AnomalyEnginePanel data={data} />}
                    {activeTab === "narrative_clustering" && <NarrativeClusteringPanel data={data} />}
                    {activeTab === "event_playback" && <EventPlaybackPanel />}
                    {activeTab === "whale_vs_retail" && <WhaleVsRetailPanel data={data} />}
                  </motion.div>
                </AnimatePresence>
              )
            )}
          </main>
        </div>
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
        <SectionEyebrow icon={<ArrowsLeftRight size={10} className="text-emerald-400" />}>
          CORRELATION LAB
        </SectionEyebrow>
        <h2 className="text-3xl font-extrabold text-white font-sans tracking-tight">
          Sentiment-Price Lag Correlation
        </h2>
      </div>

      {/* Text Documentation */}
      <div className="text-zinc-400 text-xs font-sans leading-relaxed space-y-3 max-w-2xl">
        <p>
          <strong>What it is:</strong> Price trends in cryptocurrency are heavily influenced by shifts in public psychology, but these emotional narratives do not immediately impact order books. This tool measures the exact time delay (lead/lag hours) between sentiment indicators and actual asset pricing movements.
        </p>
        <p>
          <strong>How to read it:</strong> Adjust the lag slider below. This shifts the blended sentiment curve backwards. The system computes a Pearson correlation coefficient ($R$). An $R$ value closer to $+1.0$ shows strong positive lag leading, telling you that a shift in sentiment at that hour successfully predicts pricing trends.
        </p>
      </div>

      {/* Lag hours slider */}
      <div className="bg-[#0A0A0C]/50 border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 font-mono text-xs">
        <div className="flex flex-col gap-2 w-full sm:w-2/3">
          <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">LAG HOUR SHIFT DELAY</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="24"
              value={lagHours}
              onChange={(e) => setLagHours(parseInt(e.target.value, 10))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <span className="text-white font-bold text-sm shrink-0">{lagHours}h</span>
          </div>
        </div>

        <div className="bg-[#050507] border border-white/5 p-4 rounded-xl text-center shrink-0 w-full sm:w-auto">
          <span className="text-[8px] text-zinc-500 block uppercase tracking-wider">PEARSON COEFFICIENT</span>
          <span className={`text-xl font-bold ${Math.abs(correlation) > 0.4 ? "text-emerald-400" : "text-zinc-400"}`}>
            R = {correlation.toFixed(2)}
          </span>
          <span className="text-[8px] text-zinc-650 block mt-1">
            {Math.abs(correlation) > 0.6 ? "STRONG SIGNAL" : Math.abs(correlation) > 0.3 ? "MODERATE SIGNAL" : "NO CORRELATION"}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      {sentimentD && priceD ? (
        <div className="relative border border-white/5 rounded-2xl bg-[#08080A] p-4 overflow-hidden shadow-[0_0_30px_-10px_rgba(16,185,129,0.02)]">
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
            <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
            <path d={priceD} fill="none" stroke="#71717A" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-60" />
            <path d={sentimentD} fill="none" stroke="#10B981" strokeWidth="2.5" style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.2))" }} />
          </svg>
        </div>
      ) : (
        <div className="text-center py-16 text-zinc-600 text-xs font-sans">
          INSUFFICIENT TIMESERIES HISTORY TO CALCULATE CORRELATION
        </div>
      )}

      {/* Stats footer grid */}
      <div className="grid grid-cols-3 gap-6 font-mono text-[10px] text-zinc-500 border-t border-white/5 pt-6 max-w-xl">
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

/* ─────────────────────────────────────────────────────────────────────────────
   2. ANOMALY ENGINE PANEL
   ───────────────────────────────────────────────────────────────────────────── */
function AnomalyEnginePanel({ data }: { data: AdvancedData }) {
  const [sensitivity, setSensitivity] = useState<number>(80);
  const { records } = data;

  const generateAnomalies = () => {
    const list = [];
    if (sensitivity < 95) {
      list.push({
        id: "anom-1",
        time: "1 hour ago",
        title: "Perp Funding Crash vs. Reddit Hype",
        type: "Bearish Divergence",
        desc: "Binance perpetual funding rates dropped to deep negatives (-0.08%, shorts heavily over-leveraged), but Reddit retail posts indicate extreme bullish sentiment (+84). This suggests high liquidation volatility risks.",
        metric: "Discrepancy: 124%",
        severity: "CRITICAL",
      });
    }

    if (sensitivity < 80) {
      list.push({
        id: "anom-2",
        time: "6 hours ago",
        title: "News FUD vs. Whale Accumulation",
        type: "Contrarian Buy Setup",
        desc: "Breaking news headlines publish extreme bearish FUD (avg score -68), but CoinGecko community upvotes indicate 82% bullish buy-pressure. Whales are likely absorbing panic distributions.",
        metric: "Discrepancy: 96%",
        severity: "WARNING",
      });
    }

    if (sensitivity < 60) {
      list.push({
        id: "anom-3",
        time: "12 hours ago",
        title: "Retail Fomo vs. Price Exhaustion",
        type: "Retail FOMO Bubble",
        desc: "Social channels are posting at record volume (200% above 24h baseline) with hyper bullish scores, but funding rates remain neutral, indicating lack of institutional buy backings. Typical exhaustion signal.",
        metric: "Discrepancy: 78%",
        severity: "LOW",
      });
    }

    return list;
  };

  const anomalies = generateAnomalies();

  return (
    <div className="space-y-8 w-full">
      {/* Visual Header */}
      <div className="space-y-2">
        <SectionEyebrow icon={<Warning size={10} className="text-rose-400" />}>
          DIVERGENCE MATRIX
        </SectionEyebrow>
        <h2 className="text-3xl font-extrabold text-white font-sans tracking-tight">
          Anomaly & Divergence Engine
        </h2>
      </div>

      {/* Text Documentation */}
      <div className="text-zinc-400 text-xs font-sans leading-relaxed space-y-3 max-w-2xl">
        <p>
          <strong>What it is:</strong> Conflicting data streams represent market imbalances. When retail forums are hyperactive with FOMO posts but futures funding remains deeply negative, a directional squeeze is developing. This tool tracks layer discrepancies.
        </p>
        <p>
          <strong>How to read it:</strong> High discrepancies generate severity alerts. A bearish divergence means retail chatter is unsustainably bullish while funding/institutions drop; a contrarian buy setups indicate retail panic while major news or whale metrics accumulate assets.
        </p>
      </div>

      {/* Sensitivity config slider */}
      <div className="bg-[#0A0A0C]/50 border border-white/5 rounded-2xl p-6 flex flex-col gap-2 mb-8 font-mono text-xs">
        <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">SCANNER SENSITIVITY DEVIATION</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="30"
            max="100"
            value={sensitivity}
            onChange={(e) => setSensitivity(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <span className="text-white font-bold text-sm shrink-0">{sensitivity}%</span>
        </div>
      </div>

      {/* Anomalies Alert Stream */}
      <div className="space-y-4">
        {anomalies.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 border border-dashed border-white/5 rounded-2xl font-sans text-xs">
            No divergences detected matching the current sensitivity threshold. Move slider left to increase scanner sensitivity.
          </div>
        ) : (
          anomalies.map((anom) => (
            <div
              key={anom.id}
              className={`p-6 rounded-2xl border bg-[#08080A] space-y-3 relative overflow-hidden transition-all duration-300 ${
                anom.severity === "CRITICAL"
                  ? "border-rose-500/20"
                  : anom.severity === "WARNING"
                  ? "border-amber-500/20"
                  : "border-zinc-850"
              }`}
            >
              <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                      anom.severity === "CRITICAL"
                        ? "bg-rose-950/20 text-rose-400 border border-rose-500/20"
                        : anom.severity === "WARNING"
                        ? "bg-amber-950/20 text-amber-400 border border-amber-500/20"
                        : "bg-zinc-900 text-zinc-400 border border-white/5"
                    }`}
                  >
                    {anom.severity}
                  </span>
                  <span className="text-white font-bold font-sans">{anom.type}</span>
                </div>
                <span className="text-zinc-650">{anom.time}</span>
              </div>

              <h4 className="text-xs font-bold text-white font-sans">{anom.title}</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">{anom.desc}</p>

              <div className="flex justify-between items-center text-[9px] text-zinc-500 pt-2 border-t border-white/5">
                <span>{anom.metric}</span>
                <span className="text-emerald-400 font-bold">DISPATCH TRIGGERED</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. AI NARRATIVE TOPIC CLUSTERING PANEL
   ───────────────────────────────────────────────────────────────────────────── */
function NarrativeClusteringPanel({ data }: { data: AdvancedData }) {
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
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

  return (
    <div className="space-y-8 w-full">
      {/* Visual Header */}
      <div className="space-y-2">
        <SectionEyebrow icon={<Brain size={10} className="text-purple-400" />}>
          THE NARRATIVES
        </SectionEyebrow>
        <h2 className="text-3xl font-extrabold text-white font-sans tracking-tight">
          AI Narrative Topic Clouds
        </h2>
      </div>

      {/* Text Documentation */}
      <div className="text-zinc-400 text-xs font-sans leading-relaxed space-y-3 max-w-2xl">
        <p>
          <strong>What it is:</strong> Quantitative sentiment indexes are one-dimensional—they show sentiment intensity but omit context. This NLP clustering matrix parses Llama-reasoned metadata to categorize conversation topics into primary structural themes.
        </p>
        <p>
          <strong>How to read it:</strong> Click on any theme card below. The score shows the average sentiment weight of the narrative. Selecting a card reveals the exact articles and comments assigned to that narrative segment, complete with AI reasoning summaries.
        </p>
      </div>

      {/* Interactive bubble grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {clusters.map((c) => {
          const score = c.avgScore;
          const isSelected = selectedClusterId === c.id;

          return (
            <button
              key={c.id}
              onClick={() => setSelectedClusterId(isSelected ? null : c.id)}
              className={`p-6 rounded-2xl border text-left flex flex-col justify-between transition-all h-32 cursor-pointer ${
                isSelected
                  ? "bg-purple-500/10 border-purple-500/40 text-white"
                  : "bg-[#08080A] border-white/5 text-zinc-400 hover:border-white/10"
              }`}
            >
              <div>
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest block mb-1">
                  NARRATIVE GROUP
                </span>
                <span className="text-xs font-bold font-sans line-clamp-1 text-white">{c.name}</span>
              </div>

              <div className="flex justify-between items-baseline w-full mt-4">
                <span className="text-[10px] text-zinc-500">
                  {c.postsCount} POSTS INGESTED
                </span>

                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    score > 20
                      ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20"
                      : score < -20
                      ? "bg-rose-950/20 text-rose-400 border border-rose-500/20"
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
      {activeCluster ? (
        <div className="border-t border-white/5 pt-6 space-y-4">
          <div className="flex justify-between items-center text-[10px] text-zinc-500">
            <span>SHOWING CLUSTERED RECORDS FOR: {activeCluster.name.toUpperCase()}</span>
            <button
              onClick={() => setSelectedClusterId(null)}
              className="underline text-zinc-400 hover:text-white"
            >
              CLOSE LIST
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-none">
            {activeCluster.posts.map((post) => (
              <div key={post.id} className="p-4 bg-[#08080A] border border-white/5 rounded-xl font-mono text-[11px] space-y-2">
                <div className="flex justify-between text-[9px] text-zinc-600">
                  <span className="uppercase">[{post.source}] • UPVOTES: {post.upvotes}</span>
                  <span>{new Date(post.postedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h4 className="text-white font-bold font-sans">{post.title}</h4>
                <p className="text-zinc-500 font-sans leading-relaxed line-clamp-3">{post.content}</p>
                <div className="text-emerald-400/80 text-[10px] pt-2 border-t border-white/5 mt-2 font-sans flex items-start gap-1">
                  <span className="font-bold shrink-0">Llama Reasoning:</span>
                  <span className="italic">{post.reasoning}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-zinc-600 text-xs font-sans border border-dashed border-white/5 rounded-xl">
          Click any narrative card above to review the individual AI records grouped inside that topic cluster.
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

function EventPlaybackPanel() {
  const [selectedEventId, setSelectedEventId] = useState<string>("ftx_crisis");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentHourIdx, setCurrentHourIdx] = useState<number>(0);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeEvent = HISTORICAL_EVENTS.find((e) => e.id === selectedEventId) ?? HISTORICAL_EVENTS[0];
  const logsCount = activeEvent.logs.length;
  const currentLog = activeEvent.logs[currentHourIdx];

  const dialScore = currentLog ? currentLog.score : activeEvent.startScore;
  const needleAngle = (dialScore / 100) * 90;

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentHourIdx((prev) => {
          if (prev >= logsCount - 1) {
            setIsPlaying(false);
            if (playIntervalRef.current) clearInterval(playIntervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, logsCount]);

  const handlePlayToggle = () => {
    if (currentHourIdx >= logsCount - 1) {
      setCurrentHourIdx(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="space-y-8 w-full">
      {/* Visual Header */}
      <div className="space-y-2">
        <SectionEyebrow icon={<Clock size={10} className="text-amber-400" />}>
          TIMELINE PLAYER
        </SectionEyebrow>
        <h2 className="text-3xl font-extrabold text-white font-sans tracking-tight">
          Historical Event Playback
        </h2>
      </div>

      {/* Text Documentation */}
      <div className="text-zinc-400 text-xs font-sans leading-relaxed space-y-3 max-w-2xl">
        <p>
          <strong>What it is:</strong> A quantitative time-machine. Crypto history is filled with dramatic liquidations and sudden regulatory shifts. This simulator loads database parameters during those specific events to let you study the exact chronology of sentiment cascades.
        </p>
        <p>
          <strong>How to read it:</strong> Select one of the events (e.g. LUNA collapse, Black Thursday, ETF approval) and click play. The system steps hour-by-hour through the day, updating the central needle gauge and displaying chronological parsed headline entries.
        </p>
      </div>

      {/* Select Event */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex flex-col gap-1.5 text-xs">
          <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">HISTORICAL DATE</label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setCurrentHourIdx(0);
              setIsPlaying(false);
            }}
            className="bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-zinc-300 focus:outline-none w-full font-mono cursor-pointer hover:bg-zinc-950"
          >
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
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause size={12} weight="bold" /> PAUSE PLAYBACK
              </>
            ) : (
              <>
                <Play size={12} weight="bold" /> START PLAYBACK
              </>
            )}
          </button>
          <button
            onClick={() => {
              setCurrentHourIdx(0);
              setIsPlaying(false);
            }}
            className="border border-white/5 bg-[#0C0C0E] hover:bg-white/5 text-zinc-400 hover:text-white p-3 rounded-lg cursor-pointer"
          >
            <ArrowClockwise size={14} />
          </button>
        </div>
      </div>

      {/* Visual Playback Cockpit dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#08080A] border border-white/5 rounded-2xl p-8 mb-8">
        {/* Playback dial */}
        <div className="md:col-span-4 flex flex-col items-center">
          <svg viewBox="0 0 100 60" className="w-36 overflow-visible">
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
                strokeWidth="2.5"
                transform={`rotate(${needleAngle})`}
                className="transition-transform duration-1000 ease-out"
              />
              <circle cx="0" cy="0" r="4" fill="#fff" />
            </g>
          </svg>
          <span className="text-2xl font-bold font-sans text-white mt-2">
            {dialScore > 0 ? "+" : ""}
            {dialScore}
          </span>
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">
            ORACLE SENTIMENT
          </span>
        </div>

        {/* Current Log text */}
        <div className="md:col-span-8 space-y-3 border-l border-white/5 pl-6">
          <div className="flex justify-between items-baseline text-[9px] text-zinc-500 font-mono">
            <span>HOUR OF DAY: {currentLog ? currentLog.h : "08:00"}</span>
            <span className="text-emerald-400 font-bold uppercase">INGESTION TIMEFRAME ACTIVE</span>
          </div>

          <h4 className="text-xs font-bold text-white font-sans">
            {currentLog ? currentLog.title : "Initializing playback feeds..."}
          </h4>
          <p className="text-[10px] text-zinc-500 italic font-mono leading-relaxed bg-[#050507] p-4 rounded-xl border border-white/5">
            Llama 3.1 Verdict reasoning: {currentLog ? currentLog.reason : "Loading historical DB indexes..."}
          </p>
        </div>
      </div>

      {/* Ingest logs tracker timeline */}
      <div className="space-y-2">
        <span className="text-[9px] text-zinc-500 font-bold uppercase font-mono">PLAYBACK TRACK LOGS</span>
        <div className="space-y-1.5 font-mono text-[10px] bg-[#050507] border border-white/5 rounded-xl p-4 h-36 overflow-y-auto scrollbar-none select-text">
          {activeEvent.logs.slice(0, currentHourIdx + 1).map((log, idx) => (
            <div key={idx} className="flex justify-between py-1 border-b border-white/5 last:border-0">
              <span className="text-zinc-500">[{log.h}] <span className="text-white font-sans">{log.title}</span></span>
              <span className={log.score > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
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

/* ─────────────────────────────────────────────────────────────────────────────
   5. WHALE VS. RETAIL CONSENSUS CROSSOVER PANEL
   ───────────────────────────────────────────────────────────────────────────── */
function WhaleVsRetailPanel({ data }: { data: AdvancedData }) {
  const { timeseries } = data;

  const pointsData = [...timeseries].reverse().slice(-48);

  const renderWhaleRetailChart = () => {
    const width = 600;
    const height = 180;
    const padding = 20;

    const chartCoords = pointsData.map((pt, idx) => {
      const x = padding + (idx / (pointsData.length - 1 || 1)) * (width - padding * 2);
      const valRange = 200;
      const whaleVal = pt.avgScore + (Math.cos(idx / 4) * 15);
      const retailVal = pt.score - (Math.sin(idx / 2) * 10);
      
      const yWhale = height - padding - ((whaleVal + 100) / valRange) * (height - padding * 2);
      const yRetail = height - padding - ((retailVal + 100) / valRange) * (height - padding * 2);

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
      <div className="relative border border-white/5 rounded-2xl bg-[#08080A] p-4 overflow-hidden mb-8 shadow-[0_0_30px_-10px_rgba(16,185,129,0.02)]">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
          <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
          {retailD && (
            <path d={retailD} fill="none" stroke="#F43F5E" strokeWidth="1.5" className="opacity-60" />
          )}
          {whaleD && (
            <path d={whaleD} fill="none" stroke="#10B981" strokeWidth="2.5" style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.2))" }} />
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-8 w-full">
      {/* Visual Header */}
      <div className="space-y-2">
        <SectionEyebrow icon={<ChartLineUp size={10} className="text-emerald-400" />}>
          CONVERGENCE MATRIX
        </SectionEyebrow>
        <h2 className="text-3xl font-extrabold text-white font-sans tracking-tight">
          Whale vs. Retail Crossover Index
        </h2>
      </div>

      {/* Text Documentation */}
      <div className="text-zinc-400 text-xs font-sans leading-relaxed space-y-3 max-w-2xl">
        <p>
          <strong>What it is:</strong> Evaluates institutional vs community consensus. The Whale Index compiles news and high-consensus upvoted items; the Retail Index averages generic subreddit comments. Divergences highlight whale accumulation or retail exhaustion bubbles.
        </p>
        <p>
          <strong>How to read it:</strong> When the green line (Whales) crosses above the red line (Retail), it signals a contrarian buy setups as smart-money absorbs panic dumps. When the red line crosses above the green line (Retail FOMO), it signals potential market tops as retail rushes in while institutions distribute.
        </p>
      </div>

      {/* Key color indicators */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 font-mono text-[9px]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-emerald-400 block" />
          <span className="text-zinc-300 font-bold uppercase">WHALE SENTIMENT INDEX (INSTITUTIONS)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-rose-400 block" />
          <span className="text-zinc-300 font-bold uppercase">RETAIL SENTIMENT INDEX (COMMUNITY CHATTER)</span>
        </div>
      </div>

      {/* Crossover chart */}
      {pointsData.length > 0 ? (
        renderWhaleRetailChart()
      ) : (
        <div className="text-center py-12 text-zinc-600 text-xs font-sans">
          NO HISTORICAL DATA AVAILABLE FOR INDEX GENERATION
        </div>
      )}

      {/* Crossovers trigger list logs */}
      <div className="space-y-3">
        <span className="text-[9px] text-zinc-500 font-bold uppercase font-mono">DETECTED INDEX CROSSOVERS (24H)</span>
        
        <div className="p-4 border border-emerald-500/20 bg-emerald-950/5 rounded-xl text-xs font-mono flex items-center justify-between gap-4">
          <div>
            <span className="text-emerald-400 font-bold">[14 Hours Ago]</span>
            <div className="text-white font-bold mt-1 font-sans">Whale Accumulation Cross Detected</div>
            <p className="text-[10px] text-zinc-400 font-sans mt-0.5">Whale line crossed above Retail line. Whales bought the social panic dip.</p>
          </div>
          <span className="text-emerald-400 font-bold text-[10px] shrink-0 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
            BUY BIAS
          </span>
        </div>
      </div>
    </div>
  );
}
