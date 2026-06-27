"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Albert_Sans, Source_Serif_4, Instrument_Serif } from "next/font/google";
import {
  ArrowRight,
  Gauge,
  Cpu,
  Coins,
  Pulse,
  Database,
  Sliders,
  Clock,
  Brain,
  MathOperations,
} from "@phosphor-icons/react";
import HorizontalScale from "./components/HorizontalScale";
import GlowCard from "./components/GlowCard";
import SectionEyebrow from "./components/SectionEyebrow";
import ObsidianDotGrid from "./components/ObsidianDotGrid";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "./components/magicui/animated-beam";
import { AvatarCircles } from "./components/magicui/avatar-circles";
import { DottedMap } from "./components/magicui/dotted-map";
import { BentoGrid } from "./components/magicui/bento-grid";

const MOCK_SCAN_EVENTS = [
  { ticker: "BTC", source: "Reddit AI", label: "BULLISH", score: "+0.82", time: "1s ago", color: "text-emerald-400 border-emerald-950/40 bg-emerald-950/20" },
  { ticker: "ETH", source: "CoinGecko", label: "BEARISH", score: "-0.45", time: "4s ago", color: "text-rose-450 border-rose-950/40 bg-rose-950/20" },
  { ticker: "SOL", source: "RSS Oracle", label: "NEUTRAL", score: "+0.05", time: "12s ago", color: "text-zinc-400 border-zinc-900 bg-zinc-900/40" },
  { ticker: "BTC", source: "Binance Rates", label: "BULLISH", score: "+0.31", time: "30s ago", color: "text-emerald-400 border-emerald-950/40 bg-emerald-950/20" },
  { ticker: "ETH", source: "Reddit AI", label: "BULLISH", score: "+0.68", time: "1m ago", color: "text-emerald-400 border-emerald-950/40 bg-emerald-950/20" },
];

const WHALE_AVATARS = [
  "https://avatars.githubusercontent.com/u/1023472?v=4",
  "https://avatars.githubusercontent.com/u/810438?v=4",
  "https://avatars.githubusercontent.com/u/16860528?v=4",
  "https://avatars.githubusercontent.com/u/59228569?v=4",
];


const albert = Albert_Sans({
  weight: ["100", "200", "300", "400", "500", "700", "800"],
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: "variable",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
});

const fadeUp = {
  initial: { opacity: 0, y: 24, filter: "blur(4px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as unknown as "linear" },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true, amount: 0.2 },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as unknown as "linear" },
  },
  viewport: { once: true },
};

export default function LandingPage() {
  const cockpitContainerRef = React.useRef<HTMLDivElement>(null);
  const redditNodeRef = React.useRef<HTMLDivElement>(null);
  const newsNodeRef = React.useRef<HTMLDivElement>(null);
  const binanceNodeRef = React.useRef<HTMLDivElement>(null);
  const blendedNodeRef = React.useRef<HTMLDivElement>(null);

  const [gridSymbols, setGridSymbols] = React.useState<{ char: string; type: string }[]>([]);

  React.useEffect(() => {
    const symbolTypes = [
      { char: "▲", type: "up" },
      { char: "▼", type: "down" },
      { char: "+", type: "plus" },
      { char: "-", type: "minus" },
      { char: "Ø", type: "neutral" },
      { char: "₿", type: "crypto" },
      { char: "Ξ", type: "crypto" },
      { char: "◎", type: "crypto" },
    ];
    const items = Array.from({ length: 140 }).map(() => {
      return symbolTypes[Math.floor(Math.random() * symbolTypes.length)];
    });
    setGridSymbols(items);
  }, []);

  const feelAnimWord = () => {
    const chars = [..."Mood"];
    return (
      <motion.span
        whileHover="hover"
        initial="initial"
        className="cursor-default select-none inline-block"
      >
        {chars.map((char, index) => (
          <motion.span
            key={`${char}-${index}`}
            variants={{
              initial: { y: 0, fontWeight: 300, color: "#e4e4e7" },
              hover: {
                y: -10,
                fontWeight: 700,
                color: "#ffffff",
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 10,
                  delay: index * 0.06,
                },
              },
            }}
            className={cn(
              "inline-block tracking-tighter px-0.5 transition-all duration-300",
              instrumentSerif.className
            )}
          >
            {char}
          </motion.span>
        ))}
      </motion.span>
    );
  };

  return (
    <div className="w-full flex flex-col items-center select-none overflow-hidden pb-20 bg-[#050505]">
      {/* ── HERO SECTION WITH DOME HORIZON ── */}
      <section className="relative w-full min-h-screen flex flex-col justify-center items-center pt-36 pb-24 px-6 md:px-12 -mt-[120px]">
        {/* Dome Horizon Background Glow */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
          <Gradient />
          <Arc />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center mt-[120px]">
          <h1
            className={cn(
              "text-[8vw] sm:text-6xl md:text-7xl lg:text-8xl tracking-tight py-4 text-white leading-[1.08] font-extrabold max-w-5xl mt-3 text-center whitespace-nowrap",
              albert.className
            )}
          >
            Map the{" "}
            <span className="relative inline-block pr-8 sm:pr-10 md:pr-12">
              {feelAnimWord()}
              <span className="absolute -top-3 sm:-top-5 -right-3 sm:-right-4 text-[5vw] sm:text-3xl md:text-4xl select-none transform rotate-[-35deg] text-zinc-500 font-normal">
                ☜
              </span>
            </span>
          </h1>

          <p
            className={cn(
              "max-w-md mx-auto mt-8 text-zinc-400 text-sm md:text-base font-mono leading-relaxed px-4 text-center",
              albert.className
            )}
          >
            MoodMetrics surfaces what&apos;s next, what&apos;s real, and what the crowd is missing. We parse social consensus, whale flows, and news records into simple visual indexes.
          </p>

          <Link href="/dashboard" className="mt-12 group inline-block">
            <button
              className={cn(
                "relative px-8 py-4 bg-gradient-to-b from-zinc-850 to-zinc-900 hover:from-zinc-750 hover:to-zinc-850 text-zinc-200 hover:text-white border-t border-white/10 border-x border-zinc-700/40 border-b-[5px] border-zinc-950 rounded-[12px] active:border-b-[1px] active:translate-y-[4px] transition-all duration-150 ease-out font-mono text-xs font-bold tracking-widest flex items-center gap-3 cursor-pointer select-none shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:shadow-none",
                albert.className
              )}
            >
              {/* Mechanical Switch LED Indicator */}
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-emerald-400 transition-colors duration-300 shadow-[0_0_4px_rgba(52,211,153,0.4)]" />
              
              LAUNCH DASHBOARD
              
              <ArrowRight size={12} className="text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
            </button>
          </Link>
        </div>
      </section>

      {/* ── HORIZONTAL DIVIDER ── */}
      <HorizontalScale />

      {/* ── FEATURES BENTO GRID (8 TOOLS WITH MICROINTERACTIONS & PREVIEWS) ── */}
      <motion.section
        {...staggerContainer}
        className="w-full max-w-5xl px-6 py-24 flex flex-col items-start z-10"
      >
        <SectionEyebrow icon={<Pulse size={10} className="text-zinc-400" />}>
          QUANTITATIVE SYSTEM MATRIX
        </SectionEyebrow>
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-12">
          De-Noise Crowds. Map Systemic Momentum.
        </h2>

        <BentoGrid>
          {/* Card 1: AI Records Matrix (Tall leftmost block, spans 2 rows, 1 col - Sword Illustration) */}
          <motion.div
            {...staggerItem}
            className="col-span-1 md:col-span-1 md:row-span-2 flex flex-col justify-between h-full"
          >
            <Link href="/records" className="h-full block">
              <GlowCard
                accent="zinc"
                className="p-0 flex items-center justify-center min-h-[30rem] hover:-translate-y-0.5 transition-all duration-300 h-full group relative overflow-hidden"
              >
                {/* Background ambient glow behind the sword */}
                <div className="absolute w-44 h-44 rounded-full bg-zinc-800/10 blur-[80px] pointer-events-none z-0" />
                
                {/* Sword Image with radial mask */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/sword.png"
                    alt="Sword Illustration"
                    className="w-full h-full object-cover select-none transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-110"
                    style={{
                      maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)",
                      WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)",
                    }}
                  />
                </div>

                {/* Smooth Vignette Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{
                    background: "radial-gradient(circle, transparent 40%, rgba(9, 9, 11, 0.85) 100%)",
                  }}
                />
              </GlowCard>
            </Link>
          </motion.div>

          {/* Card 2: Blended Sentiment Cockpit (Wide top-middle block, spans 1 row, 2 cols) */}
          <motion.div
            {...staggerItem}
            className="col-span-1 md:col-span-2 md:row-span-1 flex flex-col justify-between h-full"
          >
            <Link href="/dashboard" className="h-full block">
              <GlowCard
                accent="emerald"
                className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-300 h-full group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/bento_grid_1.jpg')] bg-cover bg-center opacity-10 pointer-events-none mix-blend-overlay" />
                
                <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between h-full items-center">
                  <div className="flex-1">
                    <Gauge
                      size={24}
                      className="text-emerald-500 mb-3 group-hover:scale-105 transition-all duration-300"
                    />
                    <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-1.5">
                      Blended Sentiment Cockpit
                    </h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-sans max-w-sm">
                      Monitor our real-time blending oracle aggregating funding skews, social threads, and media indexes into a unified coefficient.
                    </p>
                  </div>

                  {/* Interactive Animated Beam Flow Container */}
                  <div ref={cockpitContainerRef} className="relative flex w-[180px] h-[110px] items-center justify-between overflow-hidden p-3 bg-zinc-950/40 rounded-xl border border-zinc-900/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)] z-10">
                    <div className="flex flex-col gap-2 z-10">
                      <div ref={redditNodeRef} className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/90 text-zinc-400">
                        <Database size={11} />
                      </div>
                      <div ref={newsNodeRef} className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/90 text-zinc-400">
                        <Clock size={11} />
                      </div>
                      <div ref={binanceNodeRef} className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/90 text-zinc-400">
                        <Coins size={11} />
                      </div>
                    </div>
                    
                    <div className="z-10">
                      <div ref={blendedNodeRef} className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-900/40 bg-emerald-950/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        <Gauge size={16} className="animate-pulse" />
                      </div>
                    </div>

                    <AnimatedBeam
                      containerRef={cockpitContainerRef}
                      fromRef={redditNodeRef}
                      toRef={blendedNodeRef}
                      curvature={-18}
                      pathWidth={1.2}
                      gradientStartColor="#3b82f6"
                      gradientStopColor="#10b981"
                      duration={2.5}
                    />
                    <AnimatedBeam
                      containerRef={cockpitContainerRef}
                      fromRef={newsNodeRef}
                      toRef={blendedNodeRef}
                      curvature={0}
                      pathWidth={1.2}
                      gradientStartColor="#a855f7"
                      gradientStopColor="#10b981"
                      duration={2.5}
                      delay={0.4}
                    />
                    <AnimatedBeam
                      containerRef={cockpitContainerRef}
                      fromRef={binanceNodeRef}
                      toRef={blendedNodeRef}
                      curvature={18}
                      pathWidth={1.2}
                      gradientStartColor="#f59e0b"
                      gradientStopColor="#10b981"
                      duration={2.5}
                      delay={0.8}
                    />
                  </div>
                </div>
              </GlowCard>
            </Link>
          </motion.div>

          {/* Card 3: Strategy Backtester (Square top-right block, spans 1 row, 1 col) */}
          <motion.div
            {...staggerItem}
            className="col-span-1 md:col-span-1 md:row-span-1 flex flex-col justify-between h-full"
          >
            <Link href="/backtester" className="h-full block">
              <GlowCard
                accent="zinc"
                className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-300 h-full group"
              >
                <div>
                  <Sliders
                    size={24}
                    className="text-zinc-400 mb-3 group-hover:scale-105 group-hover:text-zinc-200 transition-all duration-300"
                  />
                  <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-1.5">
                    Strategy Backtester
                  </h3>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                    Test contrarian rules against spot price history to analyze return distributions.
                  </p>
                </div>
                <span className="text-[10px] text-zinc-450 font-mono mt-4 flex items-center gap-1 group-hover:text-white transition-colors">
                  Explore tool <ArrowRight size={10} className="transform transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </GlowCard>
            </Link>
          </motion.div>

          {/* Card 4: Historical Playback (Square middle-second block, spans 1 row, 1 col) */}
          <motion.div
            {...staggerItem}
            className="col-span-1 md:col-span-1 md:row-span-1 flex flex-col justify-between h-full"
          >
            <Link href="/advanced?tab=playback" className="h-full block">
              <GlowCard
                accent="zinc"
                className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-300 h-full group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/bento_grid_4.jpg')] bg-cover bg-center opacity-10 pointer-events-none mix-blend-overlay" />
                
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <Clock
                      size={24}
                      className="text-zinc-400 mb-3 group-hover:scale-105 transition-all duration-300"
                    />
                    <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-1.5">
                      Historical Playback
                    </h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-sans max-w-md">
                      Replay critical market events hour-by-hour, syncing spot prices, leverage rates, and AI classified feed streams.
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-450 font-mono mt-4 flex items-center gap-1 group-hover:text-white transition-colors">
                    Explore tool <ArrowRight size={10} className="transform transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </GlowCard>
            </Link>
          </motion.div>

          {/* Card 5: Whale Crossover Skew (Wide middle-right block, spans 1 row, 2 cols) */}
          <motion.div
            {...staggerItem}
            className="col-span-1 md:col-span-2 md:row-span-1 flex flex-col justify-between h-full"
          >
            <Link href="/advanced?tab=crossovers" className="h-full block">
              <GlowCard
                accent="zinc"
                className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-300 h-full group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/bento_grid_3.jpg')] bg-cover bg-center opacity-10 pointer-events-none mix-blend-overlay" />
                
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <Coins
                      size={24}
                      className="text-zinc-400 mb-3 group-hover:scale-105 transition-all duration-300"
                    />
                    <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-1.5">
                      Whale Crossover Skew
                    </h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-sans max-w-md">
                      Correlate institutional movements against retail consensus logs to detect major buy/sell divergences.
                    </p>
                  </div>

                  {/* Monitored Entities Avatars */}
                  <div className="flex items-center gap-3 mt-4">
                    <AvatarCircles avatarUrls={WHALE_AVATARS} numPeople={84} />
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Active institutional clusters monitored
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-450 font-mono mt-4 flex items-center gap-1 group-hover:text-white transition-colors">
                    Explore tool <ArrowRight size={10} className="transform transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </GlowCard>
            </Link>
          </motion.div>

          {/* Card 6: Pearson Correlation (Square bottom-left block, spans 1 row, 1 col) */}
          <motion.div
            {...staggerItem}
            className="col-span-1 md:col-span-1 md:row-span-1 flex flex-col justify-between h-full"
          >
            <Link href="/advanced?tab=correlation" className="h-full block">
              <GlowCard
                accent="zinc"
                className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-300 h-full group"
              >
                <div>
                  <MathOperations
                    size={24}
                    className="text-zinc-400 mb-3 group-hover:scale-105 group-hover:text-zinc-200 transition-all duration-300"
                  />
                  <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-1.5">
                    Pearson Correlation
                  </h3>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                    Calculate time-shifted lag coefficients between social signals and price moves.
                  </p>
                </div>
                <span className="text-[10px] text-zinc-450 font-mono mt-4 flex items-center gap-1 group-hover:text-white transition-colors">
                  Explore tool <ArrowRight size={10} className="transform transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </GlowCard>
            </Link>
          </motion.div>

          {/* Card 7: Global Ingestion Nodes (Wide bottom-middle block, spans 1 row, 2 cols - Full map background) */}
          <motion.div
            {...staggerItem}
            className="col-span-1 md:col-span-2 md:row-span-1 flex flex-col justify-between h-full"
          >
            <GlowCard
              accent="zinc"
              className="min-h-[14rem] hover:-translate-y-0.5 transition-all duration-300 h-full group relative overflow-hidden flex flex-col justify-center items-center p-6 text-center"
            >
              {/* Dotted Map scaled to cover the full card background */}
              <div className="absolute inset-0 w-full h-full opacity-35 pointer-events-none z-0">
                <DottedMap />
              </div>

              {/* Centered Overlay Heading and details */}
              <div className="relative z-10 flex flex-col items-center justify-center max-w-sm">
                <Cpu
                  size={26}
                  className="text-zinc-400 mb-2.5 group-hover:scale-105 transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
                />
                <h3 className="font-mono text-[9px] text-zinc-450 uppercase tracking-widest mb-1">
                  Active Node Telemetry
                </h3>
                <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white mb-2 font-mono">
                  GLOBAL INGESTION NETWORK
                </h2>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-sans px-4">
                  Synchronizing active social threads, news RSS feeds, and Binance perp indices across 32 global oracles.
                </p>
              </div>
            </GlowCard>
          </motion.div>

          {/* Card 8: AI Narrative Clouds (Square bottom-right block, spans 1 row, 1 col) */}
          <motion.div
            {...staggerItem}
            className="col-span-1 md:col-span-1 md:row-span-1 flex flex-col justify-between h-full"
          >
            <Link href="/advanced?tab=clouds" className="h-full block">
              <GlowCard
                accent="zinc"
                className="p-6 flex flex-col justify-between min-h-[14rem] hover:-translate-y-0.5 transition-all duration-300 h-full group"
              >
                <div>
                  <Brain
                    size={24}
                    className="text-zinc-400 mb-3 group-hover:scale-105 group-hover:text-zinc-200 transition-all duration-300"
                  />
                  <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-1.5">
                    AI Narrative Clouds
                  </h3>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                    Map semantic clusters using daily document embeddings in a 2D projection.
                  </p>
                </div>
                <span className="text-[10px] text-zinc-450 font-mono mt-4 flex items-center gap-1 group-hover:text-white transition-colors">
                  Explore tool <ArrowRight size={10} className="transform transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </GlowCard>
            </Link>
          </motion.div>
        </BentoGrid>
      </motion.section>

      {/* ── HORIZONTAL DIVIDER ── */}
      <HorizontalScale />

      {/* ── GUESTBOOK BOARD SECTION (LET ME KNOW YOU WERE HERE) ── */}
      <motion.section
        {...fadeUp}
        className="w-full max-w-5xl px-6 py-24 flex flex-col items-start z-10"
      >
        <SectionEyebrow icon={<Pulse size={10} className="text-zinc-400" />}>
          VISITOR NETWORK BOARD
        </SectionEyebrow>
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Let Me Know You Were Here
        </h2>
        <p className="text-xs text-zinc-500 font-mono leading-relaxed max-w-2xl mb-8">
          Drop a pin on our network grid! Leave a greeting, project feedback, or general praise. Your note dynamically links to the visitor array.
        </p>

        <ObsidianDotGrid />
      </motion.section>
    </div>
  );
}

const Arc = () => {
  return (
    <div className="absolute top-[296px] left-1/2 aspect-square -translate-x-1/2 rounded-full bg-[#050505] w-[150vmax]" />
  );
};

const Gradient = () => {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.02] top-[calc(60vmax+296px)] w-[200vmax] h-[200vmax] blur-[40px] opacity-35 pointer-events-none select-none"
      style={{
        background:
          "radial-gradient(100vmax, rgba(0,0,0,0) 54.81%, rgb(255,172,227) 60.098%, rgba(255,241,172,0.5) 62.983%, rgb(121,201,255) 68.5%, rgb(74,96,209) 80%, rgb(80,146,199) 90%, rgb(60,106,255) 93%, rgb(86,86,86) 97%, rgba(0,0,0,0) 100%)",
      }}
    />
  );
};
