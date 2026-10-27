"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CaretUp,
  CaretDown,
  CaretRight,
  ArrowClockwise,
  ChartLineUp,
  ShieldCheck,
  ArrowSquareOut,
  Newspaper,
  RedditLogo,
  Coins,
} from "@phosphor-icons/react";
import SentimentChart from "./SentimentChart";
import SentimentLoader from "./SentimentLoader";
import { getSentimentColorClass, getSentimentStroke } from "./meter";
import HairlineFigure from "./HairlineFigure";
import WhaleTide from "./WhaleTide";
import LayerInfoModal from "./LayerInfoModal";
import BlendBreakdown from "./BlendBreakdown";

// Obsidian + burnished orange strokes for the dashboard's coin Hairline figure
const COIN_PALETTE = {
  "--hairline-plate": "#131314",
  "--hairline-hi": "#F28C45",
  "--hairline-edge": "#77736E",
  "--hairline-mid": "#4a4643",
  "--hairline-lo": "#2e2c2a",
} as React.CSSProperties;
import { PageShell, Hatch, Reveal, SectionHeading, StatCell, GlassSegmented, EASE } from "./editorial";

const COINS = ["BTC", "ETH", "SOL"] as const;
type Coin = (typeof COINS)[number];

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
  const [openLayer, setOpenLayer] = useState<string | null>(null);
  const closeLayer = React.useCallback(() => setOpenLayer(null), []);
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
    return <SentimentLoader symbol={activeSymbol} />;
  }

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  const s = data?.sentiment;
  const dataAge = data?.meta.lastFlashScrapeAt ? getRelativeTime(data.meta.lastFlashScrapeAt) : null;

  // The four signal layers: card content plus the plain-language explainer each one opens
  const layers =
    data && s
      ? [
      {
        tag: "L1",
        name: "Flash news",
        weight: "45%",
        color: "#34d399",
        score: s.flashScore,
        icon: <Newspaper size={15} className="text-[var(--ed-fg-55)]" />,
        source: "CoinGecko + RSS",
        detail: "Real-time news ingestion",
        info: {
          what: "What the news is saying about this coin right now. Headlines move fast and often move the price first, so this layer carries the most weight.",
          how: [
            "Every CoinGecko news item and article from 15 RSS feeds that mentions the coin in the last 48 hours is collected.",
            "The AI reads each one and scores it from −1 (very bearish) to +1 (very bullish).",
            "The layer score is the plain average of those scores, shown ×100. If there's no news in 48 hours it borrows the Reddit score instead.",
          ],
          formula: "flash = average(AI score of each news item, last 48h) × 100",
          now: [
            { label: "Items scored (48h)", value: `${data.meta.flashPostsUsed}` },
            { label: "Last news fetch", value: data.meta.lastFlashScrapeAt ? getRelativeTime(data.meta.lastFlashScrapeAt) : "—" },
            { label: "Refreshes", value: "about every hour" },
          ],
          read: "Above 0 means the news is net positive, below 0 net negative. Around ±20 or less is mostly noise; past ±50 the coverage is strongly one-sided.",
        },
        stats: [
          { label: "Feed", value: <Freshness lastAt={data.meta.lastFlashScrapeAt} maxHours={2} freshLabel="Fresh" /> },
          { label: "Used", value: <span className="font-mono text-[var(--ed-fg-90)]">{data.meta.flashPostsUsed} items</span> },
        ],
      },
      {
        tag: "L2",
        name: "Historic Reddit",
        weight: "35%",
        color: "#38bdf8",
        score: s.historicScore,
        icon: <RedditLogo size={15} className="text-[var(--ed-fg-55)]" />,
        source: "Subreddit discussions",
        detail: "AI-analyzed via Arctic Shift",
        info: {
          what: "What crypto Reddit has been saying about this coin over the last day. It's slower than news but shows what ordinary traders actually think.",
          how: [
            "Posts from 12+ crypto subreddits are pulled through Arctic Shift (a Reddit archive).",
            "The AI scores each post from −1 to +1.",
            "Posts are grouped by hour. Each hour's score weights newer posts, more credible sources and well-upvoted posts a little more (upvotes on a log scale, so one viral post can't dominate).",
            "The layer score is the average of the last 24 hourly buckets, shown ×100.",
          ],
          formula: "reddit = average(last 24 hourly weighted scores) × 100",
          now: [
            { label: "Posts analyzed (7d)", value: s.totalPostsAnalyzed.toLocaleString() },
            { label: "Last Reddit fetch", value: data.meta.lastRedditScrapeAt ? getRelativeTime(data.meta.lastRedditScrapeAt) : "—" },
            { label: "Refreshes", value: "about every 6 hours" },
          ],
          read: "A steady reading here is a mood, not a reaction. When it disagrees with flash news, the crowd hasn't caught up with the headlines yet, or doesn't believe them.",
        },
        stats: [
          { label: "Feed", value: <Freshness lastAt={data.meta.lastRedditScrapeAt} maxHours={12} freshLabel="Arctic Shift" /> },
          { label: "Analyzed", value: <span className="font-mono text-[var(--ed-fg-90)]">{s.totalPostsAnalyzed} posts</span> },
        ],
      },
      {
        tag: "L3",
        name: "Funding rates",
        weight: "15%",
        color: "#fbbf24",
        score: s.fundingScore,
        icon: <ChartLineUp size={15} className="text-[var(--ed-fg-55)]" />,
        source: "Binance futures",
        detail: "Perpetual leverage positioning",
        info: {
          what: "How traders using borrowed money are betting. On futures exchanges, the side that's more crowded pays the other side a small fee every 8 hours: the funding rate.",
          how: [
            "The latest 8-hour funding rate for the coin's perpetual future is read from Binance.",
            "A positive rate means longs (betting up) are paying shorts, so more traders are leveraged long. Negative means the opposite.",
            "The rate is scaled so +0.10% per 8h = +100 and −0.10% = −100, capped at both ends.",
          ],
          formula: "funding = clamp(rate ÷ 0.001, −1, +1) × 100",
          now: [
            { label: "Funding rate (8h)", value: `${(s.fundingRate.rate * 100).toFixed(4)}%` },
            { label: "Classification", value: s.fundingRate.label.replace(/_/g, " ") },
          ],
          read: "Mildly positive is normal in a healthy market. Very high readings mean many traders are over-leveraged long, which can unwind sharply, so extremes are a warning sign as much as a bullish one.",
        },
        stats: [
          { label: "Rate (8h)", value: <span className="font-mono text-[var(--ed-fg-90)]">{(s.fundingRate.rate * 100).toFixed(4)}%</span> },
          { label: "Class", value: <span className="ed-tag">{s.fundingRate.label.replace(/_/g, " ")}</span> },
        ],
      },
      {
        tag: "L4",
        name: "Fear & greed",
        weight: "5%",
        color: "#a78bfa",
        score: s.fearGreedScore,
        icon: <ShieldCheck size={15} className="text-[var(--ed-fg-55)]" />,
        source: "Market sentiment",
        detail: "Alternative.me index",
        info: {
          what: "A single 0–100 gauge of the whole crypto market's emotion, published daily by Alternative.me. It's market-wide, not specific to this coin.",
          how: [
            "Alternative.me combines volatility, trading volume, social media, Bitcoin dominance and search trends into one number from 0 (extreme fear) to 100 (extreme greed).",
            "We take the latest value and recentre it so 50 (neutral) = 0, 0 = −100 and 100 = +100.",
          ],
          formula: "fear & greed = (index − 50) ÷ 50 × 100",
          now: [
            { label: "Index", value: `${s.fearGreed.value} / 100` },
            { label: "State", value: s.fearGreed.label },
            { label: "Updates", value: "once a day" },
          ],
          read: "It only gets 5% of the blend because it's slow and market-wide. Extreme fear has historically been a better time to buy than extreme greed, so treat the extremes as context, not a signal on their own.",
        },
        stats: [
          { label: "Index", value: <span className="font-mono text-[var(--ed-fg-90)]">{s.fearGreed.value}/100</span> },
          { label: "State", value: <span className="ed-tag">{s.fearGreed.label}</span> },
        ],
      },
        ]
      : [];
  const openInfo = layers.find((l) => l.tag === openLayer);

  return (
    <PageShell>
        {/* ── HERO ── */}
        <section className="px-5 md:px-8 pt-12 md:pt-16 pb-10 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 items-end">
          <div>
            <p className="ed-micro">
              Quantitative telemetry · {data?.ticker.name ?? activeSymbol}
              {dataAge && ` · Data ${dataAge}`}
            </p>
            <h1 className="ed-display text-5xl md:text-7xl mt-4">
              <span className="sr-only">MoodMetrics sentiment dashboard: </span>
              The market&apos;s <span className="ed-accent">mood</span>,
              <br />
              read in real time.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed tracking-[0.01em] text-[var(--ed-fg-70)]">
              News, Reddit, leverage and fear &amp; greed, scored by AI and blended into one number. Whale flows on the side.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            {/* The selected asset as a coin, its mark in relief; leans toward the pointer */}
            <HairlineFigure
              key={activeSymbol}
              name="mint"
              autoplay={false}
              coin={activeSymbol.toLowerCase()}
              className="w-[260px] md:w-[340px] aspect-[5/4] -mt-10 -mb-8 md:-mr-8"
              style={COIN_PALETTE}
            />
            <span className="ed-micro">Select asset</span>
            <div className="flex items-center gap-2">
              <GlassSegmented options={COINS} value={activeSymbol as Coin} onChange={setActiveSymbol} layoutId="coinIndicator" />
              <button
                onClick={triggerForceRefresh}
                disabled={refreshing}
                aria-label="Refresh data"
                className="ed-chip ed-press flex items-center gap-2 px-4 py-2 text-[13.5px] font-medium text-white cursor-pointer disabled:opacity-40"
              >
                <ArrowClockwise size={13} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Syncing" : "Sync"}
              </button>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mx-5 md:mx-8 mb-6 ed-bento px-5 py-3.5 flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2.5 text-[var(--ed-fg-90)]">
                <span className="ed-square bg-rose-500" />
                {error}
              </span>
              <button onClick={() => setError(null)} aria-label="Dismiss" className="ed-press text-[var(--ed-fg-50)] hover:text-white cursor-pointer">
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {data && s && (
          <>
            {/* ── STATUS STRIP ── */}
            <section className="grid grid-cols-2 md:grid-cols-4 border-t border-[var(--ed-border)]">
              <StatCell
                color="#34d399"
                label="Price"
                value={data.price ? `$${data.price.usd.toLocaleString()}` : "N/A"}
                sub="USD · CoinGecko spot"
              />
              <StatCell
                color={data.price && data.price.change24hPercent < 0 ? "#fb7185" : "#34d399"}
                label="24h change"
                value={
                  data.price ? (
                    <span className={`inline-flex items-center gap-1.5 ${data.price.change24hPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {data.price.change24hPercent >= 0 ? <CaretUp size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                      {Math.abs(data.price.change24hPercent).toFixed(2)}%
                    </span>
                  ) : (
                    "N/A"
                  )
                }
                sub="Versus this time yesterday"
                className="border-l border-[var(--ed-border)]"
              />
              <StatCell
                color="#38bdf8"
                label="Blended score"
                value={
                  <span className={getSentimentColorClass(s.score)}>
                    {s.score > 0 ? "+" : ""}
                    {s.score}
                  </span>
                }
                sub={`${s.label.charAt(0).toUpperCase()}${s.label.slice(1)} · 45 / 35 / 15 / 5 blend`}
                className="border-t md:border-t-0 md:border-l border-[var(--ed-border)]"
              />
              <StatCell
                color="#a78bfa"
                label="Posts analyzed"
                value={s.totalPostsAnalyzed.toLocaleString()}
                sub="Reddit + news · last 7 days"
                className="border-t md:border-t-0 border-l border-[var(--ed-border)]"
              />
            </section>

            <Hatch />

            {/* ── COMPOSITE + LAYERS ── */}
            <section className="p-4 md:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3">
              <Reveal className="lg:col-span-5">
                <div className="ed-bento ed-iso h-full p-6 md:p-7 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <span className="ed-eyebrow">{data.ticker.name} · Composite</span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <BlendBreakdown
                      score={s.score}
                      label={s.label}
                      rows={layers.map((l) => ({ tag: l.tag, name: l.name, color: l.color, weight: parseFloat(l.weight) / 100, score: l.score }))}
                      onOpen={setOpenLayer}
                    />
                  </div>
                </div>
              </Reveal>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {layers.map((layer, i) => (
                  <Reveal key={layer.tag} delay={0.06 * (i + 1)}>
                    <LayerCard {...layer} onOpen={() => setOpenLayer(layer.tag)} />
                  </Reveal>
                ))}
              </div>
            </section>

            <Hatch />

            {/* ── TIMELINE + INGESTION LOG ── */}
            <SectionHeading
              eyebrow="Timeline"
              lead="Sentiment,"
              accent="hour by hour"
              aside="Hourly volume-weighted score from every analyzed post, alongside the latest signals the AI has read."
            />
            <section className="px-4 md:px-5 pb-5 grid grid-cols-1 lg:grid-cols-12 gap-3">
              <Reveal className="lg:col-span-7">
                <div className="ed-bento h-full p-6 md:p-7 flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <span className="ed-eyebrow">Blended timeline · hourly</span>
                    <span className="ed-tag">{data.timeseries.length} buckets</span>
                  </div>
                  <div className="flex-1">
                    <SentimentChart data={data.timeseries} />
                  </div>

                  <details className="group mt-6 rounded-xl shadow-[0_0_0_1px_var(--ed-border)] overflow-hidden">
                    <summary className="flex justify-between items-center px-4 py-3 cursor-pointer select-none list-none">
                      <span className="ed-eyebrow">How is this calculated?</span>
                      <CaretDown size={12} className="text-[var(--ed-fg-50)] transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <div className="px-4 pb-4 pt-1 text-[14px] leading-relaxed text-[var(--ed-fg-70)] space-y-4">
                      <p>
                        The line plots hourly sentiment from −100 to +100. Volume bars split each hour into{" "}
                        <span className="text-emerald-400">bullish</span>, <span className="text-rose-400">bearish</span> and{" "}
                        <span className="text-zinc-300">neutral</span> posts.
                      </p>
                      <p>
                        Each post is weighted by source credibility (news 1.0, CoinGecko 0.9, Reddit 0.7), a log upvote boost and a 12-hour recency decay.
                      </p>
                      <pre className="font-mono text-[11px] text-[var(--ed-fg-90)] bg-black/40 rounded-lg p-3 overflow-x-auto shadow-[0_0_0_1px_var(--ed-border)]">
                        {"score = Σ(post × source × upvotes × recency) / posts"}
                      </pre>
                    </div>
                  </details>
                </div>
              </Reveal>

              <Reveal className="lg:col-span-5" delay={0.06}>
                <div className="ed-bento h-full p-6 flex flex-col min-h-[460px] max-h-[640px]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="ed-eyebrow">Ingestion log</span>
                    <span className="ed-tag">
                      <span className="ed-square bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto ed-scroll -mx-2 pr-1">
                    {data.recentSignals.map((sig, i) => {
                      const isExpanded = expandedIndex === i;
                      const scoreVal = parseFloat(sig.score);
                      return (
                        <div
                          key={i}
                          className={`rounded-lg transition-colors duration-300 ${isExpanded ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"}`}
                        >
                          <button
                            onClick={() => setExpandedIndex(isExpanded ? null : i)}
                            aria-expanded={isExpanded}
                            className="w-full text-left px-2 py-2.5 flex items-center gap-3 cursor-pointer"
                          >
                            <motion.span
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                              className="shrink-0 text-[var(--ed-fg-50)]"
                            >
                              <CaretRight size={10} />
                            </motion.span>
                            <span className="ed-tag shrink-0">{sig.source.replace("_", " ")}</span>
                            <span className="flex-1 min-w-0 truncate text-[14px] text-[var(--ed-fg-90)]">{sig.title}</span>
                            <span
                              className={`shrink-0 font-mono text-xs tabular-nums ${
                                sig.label === "bullish" ? "text-emerald-400" : sig.label === "bearish" ? "text-rose-400" : "text-[var(--ed-fg-55)]"
                              }`}
                            >
                              {scoreVal > 0 ? "+" : ""}
                              {scoreVal.toFixed(2)}
                            </span>
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0, filter: "blur(4px)" }}
                                animate={{ height: "auto", opacity: 1, filter: "blur(0px)" }}
                                exit={{ height: 0, opacity: 0, filter: "blur(4px)" }}
                                transition={{ duration: 0.3, ease: EASE }}
                                className="overflow-hidden"
                              >
                                <div className="mb-3 mr-2 ml-7 pl-3 border-l border-[var(--ed-blue-label)] text-[13.5px] leading-relaxed text-[var(--ed-fg-70)]">
                                  {sig.reasoning || "No explanation provided."}
                                  <div className="flex justify-between items-center mt-2 font-mono text-[11px] text-[var(--ed-fg-50)]">
                                    <span>
                                      {new Date(sig.postedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    {sig.url && (
                                      <a
                                        href={sig.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-white transition-colors duration-150"
                                      >
                                        Source <ArrowSquareOut size={10} />
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
              </Reveal>
            </section>

            <Hatch />

            {/* ── WHALES ── */}
            <SectionHeading
              eyebrow="On-chain · L5"
              lead="Where the"
              accent="whales"
              tail="move"
              aside="Large-address flows to and from exchanges over the last 24 hours. Shown for context, not part of the blend."
            />
            <section className="px-4 md:px-5 pb-5">
              <Reveal>
                <div className="ed-bento group">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1.25fr] border-b border-[var(--ed-border)]">
                    {/* Summary: extruded score + label chip on one baseline, then aligned key/value rows */}
                    <div className="p-5 md:p-6 flex flex-col">
                      <span className="ed-eyebrow flex items-center gap-2">
                        <Coins size={14} />
                        Net exchange flow
                      </span>
                      <div className="mt-5 flex items-end gap-3 flex-wrap">
                        <span className="ed-display ed-accent text-7xl leading-[0.8] tabular-nums">
                          {s.whaleScore > 0 ? "+" : ""}
                          {s.whaleScore}
                        </span>
                        <span className="ed-tag mb-1">
                          <span className="ed-square" style={{ background: getSentimentStroke(s.whaleScore) }} />
                          {s.whaleLabel.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-4 text-[14px] leading-relaxed text-[var(--ed-fg-70)]">
                        {s.whaleScore > 0
                          ? "Big holders moved more coins off exchanges than onto them. Coins in cold storage aren't for sale, so this usually reads as holding."
                          : s.whaleScore < 0
                            ? "Big holders moved more coins onto exchanges than off them. Coins on an exchange are ready to sell, so this usually reads as selling pressure."
                            : "Big holders moved about as much onto exchanges as off them: no clear signal."}
                      </p>
                      <dl className="mt-4 text-[14px] divide-y divide-[var(--ed-border)] border-t border-[var(--ed-border)]">
                        {[
                          {
                            k: "Net flow",
                            v: `${s.whaleNetFlowUsd >= 0 ? "+" : "−"}$${Math.abs(s.whaleNetFlowUsd / 1e6).toFixed(2)}M`,
                          },
                          {
                            k: "Direction",
                            v: s.whaleScore > 0 ? "Off exchanges · accumulating" : s.whaleScore < 0 ? "Onto exchanges · distributing" : "Balanced",
                          },
                          { k: "Transactions · 24h", v: String(s.whaleTransactions.length) },
                        ].map(({ k, v }) => (
                          <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                            <dt className="text-[var(--ed-fg-55)]">{k}</dt>
                            <dd className="font-mono text-[13px] tabular-nums text-[var(--ed-fg-90)] text-right">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div className="ed-iso border-t md:border-t-0 md:border-l border-[var(--ed-border)]">
                      <WhaleTide score={s.whaleScore} />
                    </div>
                  </div>

                  <div className="p-4 md:p-5">
                    <span className="ed-eyebrow px-2">Recent movement · 24h</span>
                    <div className="mt-3 max-h-56 overflow-y-auto ed-scroll">
                      {s.whaleTransactions.length > 0 ? (
                        s.whaleTransactions.map((tx, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.025] transition-colors duration-300"
                          >
                            <div className="min-w-0">
                              <span className="block truncate text-[14px] text-[var(--ed-fg-90)] max-w-[180px] sm:max-w-[340px]">
                                {tx.fromAddress} → {tx.toAddress}
                              </span>
                              <span className="font-mono text-[11px] text-[var(--ed-fg-50)]">{getRelativeTime(tx.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="hidden sm:inline font-mono text-xs text-[var(--ed-fg-70)] tabular-nums">
                                {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {activeSymbol} · ${(tx.amountUsd / 1e6).toFixed(2)}M
                              </span>
                              <span className="ed-tag">
                                <span
                                  className={`ed-square ${tx.type === "outflow" ? "bg-[rgb(126_190_152)]" : tx.type === "inflow" ? "bg-[rgb(229_115_115)]" : "bg-white/30"}`}
                                />
                                {tx.type}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="px-2 py-6 text-center text-sm text-[var(--ed-fg-50)]">No significant whale activity in this window.</p>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>
          </>
        )}
      <LayerInfoModal
        layer={
          openInfo
            ? { ...openInfo.info, tag: openInfo.tag, name: openInfo.name, color: openInfo.color, score: openInfo.score, weight: parseFloat(openInfo.weight) / 100 }
            : null
        }
        onClose={closeLayer}
      />
    </PageShell>
  );
}

// ── Dashboard-only primitives ─────────────────────────────────────────────

function Freshness({ lastAt, maxHours, freshLabel }: { lastAt: string | null; maxHours: number; freshLabel: string }) {
  const age = staleAge(lastAt, maxHours);
  return age ? (
    <span className="ed-tag" style={{ color: "#fcd34d" }}>
      <span className="ed-square bg-amber-400" />
      Stale · {age}
    </span>
  ) : (
    <span className="ed-tag">
      <span className="ed-square bg-emerald-400" />
      {freshLabel}
    </span>
  );
}

function LayerCard({
  tag,
  name,
  weight,
  color,
  score,
  icon,
  source,
  detail,
  stats,
  onOpen,
}: {
  tag: string;
  name: string;
  weight: string;
  color: string;
  score: number;
  icon: React.ReactNode;
  source: string;
  detail: string;
  stats: { label: string; value: React.ReactNode }[];
  onOpen?: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-label={`${name}: what it is and how it's calculated`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.();
        }
      }}
      className="group ed-bento ed-press h-full p-5 flex flex-col justify-between min-h-[13.5rem] cursor-pointer outline-none focus-visible:shadow-[0_0_0_1px_rgba(255,255,255,0.4)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="ed-eyebrow flex items-center gap-2">
          <span className="ed-square" style={{ background: color }} />
          {tag} · {name}
        </span>
        <span className="flex items-center gap-2">
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.12em] text-[var(--ed-fg-30)] transition-colors duration-300 group-hover:text-[#F28C45]">
            What&apos;s this?
          </span>
          <span className="ed-tag">{weight} wt</span>
        </span>
      </div>

      <div className="flex items-end justify-between gap-3 mt-6">
        <span className={`font-display text-6xl leading-none tracking-tight tabular-nums ${getSentimentColorClass(score)}`}>
          {score > 0 ? "+" : ""}
          {score}
        </span>
        <div className="text-right min-w-0">
          <span className="flex items-center justify-end gap-1.5 text-[15px] font-medium tracking-[-0.02em] text-[var(--ed-fg-90)]">
            {icon}
            {source}
          </span>
          <span className="block text-[13px] text-[var(--ed-fg-55)] mt-0.5">{detail}</span>
        </div>
      </div>

      <div className="mt-5 pt-3.5 border-t border-[var(--ed-border)] flex items-center justify-between gap-2 text-[13px]">
        {stats.map((st) => (
          <span key={st.label} className="flex items-center gap-2 min-w-0">
            <span className="text-[var(--ed-fg-50)]">{st.label}</span>
            {st.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="ed-page min-h-[100dvh] w-full pt-20">
      <div className="max-w-7xl mx-auto ed-frame animate-pulse">
        <div className="px-5 md:px-8 pt-16 pb-10 space-y-4">
          <div className="h-3 w-56 rounded bg-white/[0.06]" />
          <div className="h-16 w-full max-w-xl rounded-lg bg-white/[0.05]" />
          <div className="h-16 w-full max-w-md rounded-lg bg-white/[0.05]" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-[var(--ed-border)]">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 px-7 py-6 border-l first:border-l-0 border-[var(--ed-border)]">
              <div className="h-3 w-20 rounded bg-white/[0.06]" />
              <div className="h-8 w-28 rounded bg-white/[0.05] mt-4" />
            </div>
          ))}
        </div>
        <div className="ed-hatch" />
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 h-[26rem] ed-bento" />
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[13.5rem] ed-bento" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
