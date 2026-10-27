"use client";

// Mini previews for the landing page's tool bento: each card shows a small,
// illustrative version of what its tool draws. Obsidian greys with one
// burnished-orange accent, matching the hero's Hairline figure. All data here
// is static sample data, generated from a fixed seed so SSR and client agree.
// Charts render in their final state; only three things move: the records
// stream, the playback playhead and the source belts.

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { RedditLogo, Newspaper, Lightning, Gauge, Waves, Rss } from "@phosphor-icons/react";
import { Marquee } from "./magicui/marquee";

const ORANGE = "#F28C45";
const AMBER = "#FFB15C";

// Deterministic pseudo-random numbers (mulberry32)
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Two decimals: server and browser can differ in the last digit of trig results
const r2 = (n: number) => Math.round(n * 100) / 100;

const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");

// Maps values onto [top, bottom] of a plot, highest value at the top
function fitY(values: number[], top: number, bottom: number) {
  const lo = Math.min(...values), hi = Math.max(...values);
  return (v: number) => r2(bottom - ((v - lo) / (hi - lo || 1)) * (bottom - top));
}

// ── 01 Records: verdicts streaming in ────────────────────────────────────────

const RECORDS = [
  { t: "BTC", src: "r/Bitcoin", v: "bull", s: "+0.82" },
  { t: "ETH", src: "CoinDesk", v: "bear", s: "−0.45" },
  { t: "SOL", src: "r/solana", v: "bull", s: "+0.64" },
  { t: "BTC", src: "The Block", v: "neut", s: "+0.05" },
  { t: "ETH", src: "r/ethtrader", v: "bull", s: "+0.38" },
  { t: "SOL", src: "Decrypt", v: "bear", s: "−0.27" },
  { t: "BTC", src: "r/CryptoCurrency", v: "bull", s: "+0.51" },
  { t: "ETH", src: "Cointelegraph", v: "neut", s: "−0.02" },
  { t: "SOL", src: "r/SolanaTrading", v: "bull", s: "+0.47" },
];
const SHOWN = 10;
const ROW = 46, GAP = 8; // fixed row pitch, so a tick is one clean translate

export function RecordsPreview() {
  const reduce = useReducedMotion();
  const [head, setHead] = React.useState(0);
  React.useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setHead((h) => h + 1), 2400);
    return () => clearInterval(id);
  }, [reduce]);
  // Newest first. Each tick the list remounts one row higher and slides down
  // into place, so every old row lands exactly where it was and only the new
  // top row fades in; nothing is measured, so nothing can jump.
  const rows = Array.from({ length: SHOWN }, (_, i) => head - i).map((n) => ({ n, ...RECORDS[((n % RECORDS.length) + RECORDS.length) % RECORDS.length] }));
  return (
    <div className="relative w-full self-stretch overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
      <motion.ul
        key={head}
        className="flex flex-col"
        style={{ gap: GAP }}
        initial={head === 0 ? false : { y: -(ROW + GAP) }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
        {rows.map((r, i) => (
          <motion.li
            key={r.n}
            initial={i === 0 && head > 0 ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="ed-tray flex shrink-0 items-center gap-2.5 !rounded-xl px-3"
            style={{ height: ROW }}
          >
            <span className="ed-tag w-11 justify-center !px-0">{r.t}</span>
            <span className="flex-1 truncate text-[13px] text-[var(--ed-fg-70)]">{r.src}</span>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: r.v === "bull" ? ORANGE : r.v === "bear" ? "#8a8a91" : "#3a3a3f" }}
            />
            <span className={`w-11 text-right font-mono text-[12px] tabular-nums ${i === 0 ? "text-white" : "text-[var(--ed-fg-70)]"}`}>{r.s}</span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

// ── 02 Dashboard: four layers blended into one gauge ─────────────────────────

const LAYERS = [
  { name: "Reddit", weight: 35, score: 0.42 },
  { name: "News", weight: 30, score: 0.18 },
  { name: "Funding", weight: 20, score: -0.12 },
  { name: "Fear & Greed", weight: 15, score: 0.3 },
];

export function BlendPreview() {
  const value = 0.24; // −1 … +1
  const lit = Math.round(((value + 1) / 2) * 24);
  return (
    <div className="grid w-full grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
      <ul className="space-y-3">
        {LAYERS.map((l, i) => (
          <li key={l.name} className="grid grid-cols-[5.5rem_1fr_2.75rem] items-center gap-3 text-[12px]">
            <span className="text-[var(--ed-fg-55)]">{l.name}</span>
            <span className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${l.weight * 2.5}%`, background: i === 0 ? ORANGE : "rgba(255,255,255,0.28)" }}
              />
            </span>
            <span className="text-right font-mono tabular-nums text-[var(--ed-fg-70)]">
              {l.score > 0 ? "+" : "−"}
              {Math.abs(l.score).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
      <div className="relative mx-auto w-[9.5rem]">
        <svg viewBox="0 0 120 70" className="w-full">
          {Array.from({ length: 25 }, (_, i) => {
            const a = Math.PI * (1 - i / 24), c = Math.cos(a), s = Math.sin(a);
            return (
              <line
                key={i}
                x1={r2(60 + c * 44)}
                y1={r2(62 - s * 44)}
                x2={r2(60 + c * 54)}
                y2={r2(62 - s * 54)}
                strokeWidth={3}
                strokeLinecap="round"
                stroke={i <= lit ? (i === lit ? AMBER : ORANGE) : "rgba(255,255,255,0.1)"}
                opacity={i <= lit ? r2(0.35 + (0.65 * i) / lit) : 1}
              />
            );
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <div className="ed-display text-[2.1rem] leading-none text-white">+24</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--ed-fg-55)]">Mildly bullish</div>
        </div>
      </div>
    </div>
  );
}

// ── 03 Backtest: strategy vs. holding ────────────────────────────────────────

const BT = (() => {
  const r = seeded(7);
  let s = 0, h = 0;
  const strat: number[] = [], hold: number[] = [];
  for (let i = 0; i <= 40; i++) {
    const m = (r() - 0.46) * 5;
    h += m;
    // the strategy sits out part of each drawdown, so it compounds away from holding
    s += m < 0 ? m * 0.35 : m * 0.9;
    strat.push(s);
    hold.push(h);
  }
  const y = fitY([...strat, ...hold], 4, 60);
  return { strat: strat.map((v, i) => [i * 5, y(v)] as [number, number]), hold: hold.map((v, i) => [i * 5, y(v)] as [number, number]) };
})();

export function BacktestPreview() {
  return (
    <div className="w-full">
      <svg viewBox="0 0 200 64" className="h-28 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bt-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={ORANGE} stopOpacity="0.16" />
            <stop offset="1" stopColor={ORANGE} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path(BT.strat)}L200,64L0,64Z`} fill="url(#bt-fill)" />
        <path d={path(BT.hold)} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="1.2" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        <path d={path(BT.strat)} fill="none" stroke={ORANGE} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-3 flex gap-5 text-[12px]">
        <span className="flex items-center gap-2 text-[var(--ed-fg-55)]">
          <span className="h-0.5 w-3 rounded-full" style={{ background: ORANGE }} />
          Strategy <b className="font-mono font-normal text-white">+18.4%</b>
        </span>
        <span className="flex items-center gap-2 text-[var(--ed-fg-55)]">
          <span className="w-3 border-t border-dashed border-white/40" />
          Hold <b className="font-mono font-normal text-[var(--ed-fg-70)]">+9.7%</b>
        </span>
      </div>
    </div>
  );
}

// ── 04 Playback: a playhead sweeping hourly candles ──────────────────────────

const CANDLES = (() => {
  const r = seeded(21);
  let p = 0;
  const raw = Array.from({ length: 24 }, () => {
    const o = p, c = p + (r() - 0.47) * 6;
    p = c;
    return { o, c, hi: Math.max(o, c) + r() * 2.5, lo: Math.min(o, c) - r() * 2.5 };
  });
  const y = fitY(raw.flatMap((k) => [k.hi, k.lo]), 3, 57);
  return raw.map((k) => ({ up: k.c >= k.o, o: y(k.o), c: y(k.c), hi: y(k.hi), lo: y(k.lo) }));
})();

export function PlaybackPreview() {
  const reduce = useReducedMotion();
  return (
    <div className="w-full">
      <div className="relative">
        <svg viewBox="0 0 192 60" className="h-28 w-full" preserveAspectRatio="none">
          {CANDLES.map((k, i) => {
            const x = i * 8 + 4, col = k.up ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.22)";
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={k.hi} y2={k.lo} stroke={col} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <rect x={x - 2.4} width={4.8} y={Math.min(k.o, k.c)} height={r2(Math.max(1.2, Math.abs(k.c - k.o)))} rx="0.8" fill={col} />
              </g>
            );
          })}
        </svg>
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-px"
          style={{ background: ORANGE, boxShadow: `0 0 12px ${ORANGE}` }}
          initial={{ left: "62%" }}
          animate={reduce ? { left: "62%" } : { left: ["4%", "96%"] }}
          transition={reduce ? { duration: 0 } : { duration: 8, ease: "linear", repeat: Infinity, repeatDelay: 0.6 }}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-[var(--ed-fg-30)]">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

// ── 05 Whales: net flow bars against the retail line ─────────────────────────

const FLOW = (() => {
  const r = seeded(5);
  return Array.from({ length: 36 }, (_, i) => ({
    whale: r2(Math.sin(i / 4.2) * 0.7 + (r() - 0.5) * 0.5),
    retail: r2(Math.sin(i / 5 + 2.1) * 0.6 + (r() - 0.5) * 0.15),
  }));
})();

export function WhalePreview() {
  const W = 360, H = 90, mid = H / 2, step = W / FLOW.length;
  const retail = path(FLOW.map((f, i) => [i * step + step / 2, mid - f.retail * 34]));
  const peak = FLOW.reduce((best, f, i) => (Math.abs(f.whale - f.retail) > Math.abs(FLOW[best].whale - FLOW[best].retail) ? i : best), 0);
  return (
    <div className="w-full">
      <div className="relative pt-6">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full" preserveAspectRatio="none">
          <line x1="0" x2={W} y1={mid} y2={mid} stroke="rgba(255,255,255,0.08)" vectorEffect="non-scaling-stroke" />
          {FLOW.map((f, i) => {
            const h = r2(Math.max(1, Math.abs(f.whale) * 38));
            return (
              <rect
                key={i}
                x={r2(i * step + 2)}
                width={r2(step - 4)}
                y={f.whale > 0 ? r2(mid - h) : mid}
                height={h}
                rx="1.5"
                fill={i === peak ? ORANGE : f.whale > 0 ? "rgba(242,140,69,0.38)" : "rgba(255,255,255,0.15)"}
              />
            );
          })}
          <path d={retail} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        </svg>
        <span
          className="ed-tag absolute top-0 -translate-x-1/2 !text-white"
          style={{ left: `${r2(((peak + 0.5) / FLOW.length) * 100)}%`, background: "#131314" }}
        >
          <span className="ed-square" style={{ background: ORANGE }} />
          Divergence
        </span>
      </div>
      <div className="mt-3 flex gap-5 text-[12px] text-[var(--ed-fg-55)]">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm" style={{ background: ORANGE }} />Whale net flow</span>
        <span className="flex items-center gap-2"><span className="w-3 border-t border-dashed border-white/60" />Retail sentiment</span>
      </div>
    </div>
  );
}

// ── 06 Correlation: r by lag, peak highlighted ───────────────────────────────

const LAGS = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((lag) => ({
  lag,
  r: r2(0.06 + 0.35 * Math.exp(-((lag - 2) ** 2) / 5) + (lag % 3 === 0 ? 0.03 : 0)),
}));

export function CorrelationPreview() {
  const peak = LAGS.reduce((a, b) => (b.r > a.r ? b : a));
  return (
    <div className="w-full">
      <div className="flex h-24 items-end gap-[3px]">
        {LAGS.map((l) => (
          <div
            key={l.lag}
            className="flex-1 rounded-t-[3px]"
            style={{
              height: `${r2((l.r / peak.r) * 100)}%`,
              background: l === peak ? ORANGE : l.lag === 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.13)",
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-[var(--ed-fg-30)]">
        <span>−6h</span>
        <span>0</span>
        <span>+6h</span>
      </div>
      <p className="mt-2 text-[12px] text-[var(--ed-fg-55)]">
        Peak <span className="font-mono text-white">r = {peak.r.toFixed(2)}</span> at{" "}
        <span className="font-mono" style={{ color: ORANGE }}>+{peak.lag}h</span>
      </p>
    </div>
  );
}

// ── 07 Ingestion: every source, on two conveyor belts ────────────────────────

const SOURCES: [string, React.ElementType][] = [
  ["r/Bitcoin", RedditLogo], ["CoinDesk", Newspaper], ["Binance perps", Lightning], ["r/ethereum", RedditLogo],
  ["Fear & Greed", Gauge], ["The Block", Rss], ["Whale flows", Waves], ["r/solana", RedditLogo],
  ["Decrypt", Newspaper], ["r/CryptoCurrency", RedditLogo], ["Cointelegraph", Rss], ["Funding rates", Lightning],
];

function SourceChip({ name, Icon }: { name: string; Icon: React.ElementType }) {
  return (
    <span className="ed-chip inline-flex items-center gap-2 whitespace-nowrap px-3.5 py-2 text-[13px] text-[var(--ed-fg-70)]">
      <Icon size={14} className="text-[var(--ed-fg-55)]" />
      {name}
    </span>
  );
}

export function IngestionPreview() {
  const half = SOURCES.length / 2;
  return (
    <div className="relative -mx-6 w-[calc(100%+3rem)] [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
      <Marquee pauseOnHover className="[--duration:38s] [--gap:0.6rem]">
        {SOURCES.slice(0, half).map(([n, I]) => <SourceChip key={n} name={n} Icon={I} />)}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:44s] [--gap:0.6rem]">
        {SOURCES.slice(half).map(([n, I]) => <SourceChip key={n} name={n} Icon={I} />)}
      </Marquee>
    </div>
  );
}

// ── 08 Narratives: embedding clusters ────────────────────────────────────────

const CLUSTERS = [
  { label: "ETF flows", cx: 62, cy: 40, n: 18, hot: true },
  { label: "L2 fees", cx: 150, cy: 30, n: 12, hot: false },
  { label: "Memecoins", cx: 128, cy: 76, n: 14, hot: false },
];
const DOTS = (() => {
  const r = seeded(11);
  return CLUSTERS.flatMap((c, k) =>
    Array.from({ length: c.n }, () => {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 16;
      return { k, x: r2(c.cx + Math.cos(a) * d * 1.35), y: r2(c.cy + Math.sin(a) * d * 0.8) };
    }),
  );
})();

export function NarrativesPreview() {
  return (
    <svg viewBox="22 6 160 92" className="w-full">
      {CLUSTERS.filter((c) => c.hot).map((c) => (
        <ellipse key={c.label} cx={c.cx} cy={c.cy} rx={28} ry={18} fill="rgba(242,140,69,0.06)" stroke={ORANGE} strokeOpacity="0.5" strokeDasharray="2 2.5" />
      ))}
      {DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={CLUSTERS[d.k].hot ? 2.1 : 1.8} fill={CLUSTERS[d.k].hot ? ORANGE : "rgba(255,255,255,0.32)"} />
      ))}
      {CLUSTERS.map((c) => (
        <text
          key={c.label}
          x={c.cx}
          y={c.cy - (c.hot ? 22 : 18)}
          textAnchor="middle"
          fontSize="7"
          letterSpacing="0.4"
          fill={c.hot ? "#fff" : "rgba(255,255,255,0.45)"}
          fontFamily="var(--font-grotesk)"
        >
          {c.label}
        </text>
      ))}
    </svg>
  );
}
