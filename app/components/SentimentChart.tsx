"use client";

import React from "react";
import { ChartTray } from "./charts/ChartCard";
import { ChartTooltip } from "./charts/ChartTooltip";
import { useActiveIndex, useTween, useWidth } from "./charts/hooks";
import { areaPath, smoothPath, type Pt } from "./charts/scale";

type TimeseriesPoint = {
  time: string;
  score: number;
  posts: number;
};

type SentimentChartProps = {
  data: TimeseriesPoint[];
};

// Hourly blended sentiment in the design-bh language: monochrome at rest, one
// burnished-orange accent. The y-axis is zoomed to the data (symmetric round
// zero) so the line has shape. The main line is a rolling-mean trend over a
// thin raw hourly line; the wash under the trend is warm above zero, a faint
// white below. Post volume sits in its own strip underneath (its own scale, never a
// second axis on the plot). The line draws itself in the first time it scrolls
// into view; a crosshair, a pearl and the tooltip follow the pointer or arrow keys.

const ORANGE = "#F28C45";
// `smooth` is the trend line's rolling window, in buckets
const RANGES = [
  { key: "24h", label: "24H", hours: 24, smooth: 3 },
  { key: "3d", label: "3D", hours: 72, smooth: 6 },
  { key: "7d", label: "7D", hours: 168, smooth: 9 },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

const PLOT_H = 200;
const VOL_H = 34;
const PAD = { l: 34, r: 12, t: 18, b: 6 };
const fmt = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(Math.round(v))}`;

/** A domain symmetric round zero: at least ±10, at most ±100 (the score's own bounds), in steps of 10 or 50. */
function domain(values: number[]) {
  const peak = Math.max(10, ...values.map((v) => Math.abs(v)));
  const step = peak > 40 ? 50 : 10;
  const m = Math.min(100, Math.ceil((peak * 1.08) / step) * step);
  return { m, ticks: [m, m / 2, 0, -m / 2, -m] };
}

/** A centred rolling mean, shrinking at the ends. */
function rolling(values: number[], w: number) {
  const h = Math.floor(w / 2);
  return values.map((_, i) => {
    const a = Math.max(0, i - h), b = Math.min(values.length, i + h + 1);
    let sum = 0;
    for (let k = a; k < b; k++) sum += values[k];
    return sum / (b - a);
  });
}

// A callback ref, so the observer attaches whenever the plot's node mounts
// (the chart can first render its empty state, before that node exists)
function useInView<T extends Element>() {
  const [seen, setSeen] = React.useState(false);
  const [node, setNode] = React.useState<T | null>(null);
  React.useEffect(() => {
    if (!node || seen) return;
    // Already on screen when it mounts (e.g. data arrived while scrolled here): draw in right away
    const r = node.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.9 && r.bottom > window.innerHeight * 0.1) {
      const id = window.setTimeout(() => setSeen(true), 30);
      return () => clearTimeout(id);
    }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.35 });
    io.observe(node);
    return () => io.disconnect();
  }, [node, seen]);
  return [setNode, seen] as const;
}

export default function SentimentChart({ data }: SentimentChartProps) {
  const [range, setRange] = React.useState<RangeKey>("7d");
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [plotRef, width] = useWidth<HTMLDivElement>();
  const [viewRef, seen] = useInView<HTMLDivElement>();

  // API returns newest first; plot oldest → newest, trimmed to the chosen range
  const all = React.useMemo(() => [...(data ?? [])].reverse().map((p) => ({ ...p, t: new Date(p.time).getTime() })), [data]);
  const points = React.useMemo(() => {
    if (!all.length) return all;
    const hours = RANGES.find((r) => r.key === range)!.hours;
    const cutoff = all[all.length - 1].t - hours * 3600_000;
    const sliced = all.filter((p) => p.t >= cutoff);
    return sliced.length >= 2 ? sliced : all.slice(-2);
  }, [all, range]);

  const n = points.length;
  const scores = points.map((p) => p.score);
  const trend = rolling(scores, RANGES.find((r) => r.key === range)!.smooth);
  const shownRaw = useTween(scores, false, 0.6);
  const shown = useTween(trend, false, 0.6);
  const { active, setActive, focusProps } = useActiveIndex(n);

  if (!all.length) {
    return (
      <div className="flex h-48 items-center justify-center text-[14px] text-[var(--ed-fg-55)]">
        No timeline data yet.
      </div>
    );
  }

  const avg = scores.reduce((s, v) => s + v, 0) / n;
  const change = trend[n - 1] - trend[0];
  const { m, ticks } = domain(scores);
  const maxPosts = Math.max(1, ...points.map((p) => p.posts));
  const hi = scores.indexOf(Math.max(...scores));
  const lo = scores.indexOf(Math.min(...scores));

  const iw = Math.max(1, width - PAD.l - PAD.r);
  const xAt = (i: number) => PAD.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const yAt = (v: number) => PAD.t + ((m - v) / (2 * m)) * (PLOT_H - PAD.t - PAD.b);
  const y0 = yAt(0);
  const pts: Pt[] = shown.map((v, i) => [xAt(i), yAt(v)]);
  const line = smoothPath(pts);
  const rawLine = smoothPath(shownRaw.map((v, i) => [xAt(i), yAt(v)] as Pt));
  const area = areaPath(pts, y0, true);
  const barW = Math.max(1, iw / n - 2);

  const when = (t: number, withHour = true) =>
    new Date(t).toLocaleString([], withHour ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" });
  const xTicks = n > 1 ? [0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1] : [0];

  const onPointer = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left) / rect.width) * (n - 1));
    setActive(Math.min(Math.max(i, 0), n - 1));
  };
  const a = active ?? n - 1;

  // A peak/trough call-out: a short leader and a micro-label, kept inside the plot
  const callout = (i: number, kind: "Peak" | "Low") => {
    const x = xAt(i), y = yAt(scores[i]), up = kind === "Peak";
    const ly = up ? Math.max(10, y - 16) : Math.min(PLOT_H - 4, y + 22);
    const anchor = x > width - 70 ? "end" : x < PAD.l + 40 ? "start" : "middle";
    return (
      <g key={kind} className="transition-opacity duration-500" style={{ opacity: seen && active == null ? 1 : 0 }} aria-hidden>
        <line x1={x} x2={x} y1={y + (up ? -4 : 4)} y2={ly + (up ? 3 : -9)} stroke="rgba(255,255,255,0.25)" strokeDasharray="2 2" />
        <text x={x} y={ly} textAnchor={anchor} className="fill-[var(--ed-fg-55)] font-mono text-[9.5px] uppercase tracking-[0.18em]">
          {kind} {fmt(scores[i])}
        </text>
      </g>
    );
  };

  return (
    <div ref={viewRef}>
      {/* Read-out row: the headline number, its change, and the range tabs */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[34px] leading-none tabular-nums text-white">{fmt(avg)}</span>
          <span className="flex flex-col gap-1">
            <span className="ed-micro !tracking-[0.2em]">{RANGES.find((r) => r.key === range)!.label} average</span>
            <span className="font-mono text-[12px] tabular-nums text-[var(--ed-fg-70)]">
              {change >= 0 ? "▲" : "▼"} {fmt(change)} pts trend over range
            </span>
          </span>
        </div>
        <div className="flex items-center gap-6">
        <div aria-hidden className="hidden sm:flex items-center gap-4 text-[10px] uppercase tracking-[0.1em] text-[var(--ed-fg-50)]">
          <span className="flex items-center gap-1.5"><span className="h-[2px] w-3.5 rounded-full bg-[#f5f5f5]" />Trend</span>
          <span className="flex items-center gap-1.5"><span className="h-px w-3.5 bg-white/30" />Hourly</span>
        </div>
        <div role="tablist" aria-label="Time range" className="flex items-center gap-4">
          {RANGES.map((r) => {
            const on = r.key === range;
            return (
              <button
                key={r.key}
                role="tab"
                aria-selected={on}
                onClick={() => { setRange(r.key); setActive(null); }}
                className="ed-press flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] cursor-pointer transition-colors duration-150"
                style={{ color: on ? "#fff" : "var(--ed-fg-50)" }}
              >
                <span className="size-[5px]" style={on ? { background: ORANGE } : { boxShadow: "inset 0 0 0 1px currentColor" }} />
                {r.label}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      <ChartTray ref={plotRef} style={{ height: PLOT_H + VOL_H + 26 }} role="img" aria-label={`Hourly sentiment, ${RANGES.find((r) => r.key === range)!.label}: average ${fmt(avg)}, change ${fmt(change)} points`} {...focusProps}>
        {width > 0 && (
          <svg width={width} height={PLOT_H + VOL_H + 26} className="absolute inset-0 block overflow-visible">
            <defs>
              {/* Faint isometric grid, the bento cards' texture (design-bh §5.6) */}
              <pattern id={`${uid}-iso`} width="36" height="18" patternUnits="userSpaceOnUse">
                <path d="M0 9 L18 0 L36 9 M0 9 L18 18 L36 9" fill="none" stroke="#fff" strokeOpacity="0.045" strokeWidth="0.6" />
              </pattern>
              <linearGradient id={`${uid}-up`} x1="0" y1={PAD.t} x2="0" y2={y0} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={ORANGE} stopOpacity="0.38" />
                <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`${uid}-dn`} x1="0" y1={y0} x2="0" y2={PLOT_H} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0.09" />
              </linearGradient>
              <clipPath id={`${uid}-above`}><rect x="0" y="0" width={width} height={y0} /></clipPath>
              <clipPath id={`${uid}-below`}><rect x="0" y={y0} width={width} height={PLOT_H - y0} /></clipPath>
            </defs>
            <rect x="0" y="0" width={width} height={PLOT_H + VOL_H + 26} fill={`url(#${uid}-iso)`} rx="16" />

            {/* y grid: recessive, zero is the one line that reads */}
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.l} x2={width - PAD.r} y1={yAt(t)} y2={yAt(t)}
                  stroke={t === 0 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.05)"}
                  strokeDasharray={t === 0 ? "3 3" : undefined}
                />
                <text x={PAD.l - 8} y={yAt(t) + 3} textAnchor="end" className="fill-[var(--ed-fg-30)] font-mono text-[9.5px] tabular-nums">{fmt(t)}</text>
              </g>
            ))}

            {/* the wash, split at zero: warm above, faint white below */}
            <g className="transition-opacity duration-700" style={{ opacity: seen ? 1 : 0 }}>
              <path d={area} fill={`url(#${uid}-up)`} clipPath={`url(#${uid}-above)`} />
              <path d={area} fill={`url(#${uid}-dn)`} clipPath={`url(#${uid}-below)`} />
            </g>

            {/* the raw hourly score: thin and recessive, the texture under the trend */}
            <path
              d={rawLine}
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1"
              strokeLinejoin="round"
              className="transition-opacity duration-700"
              style={{ opacity: seen ? 1 : 0 }}
            />

            {/* the trend line draws itself in, once */}
            <path
              key={range}
              d={line}
              pathLength={1}
              fill="none"
              stroke="#f5f5f5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1 1"
              strokeDashoffset={seen ? 0 : 1}
              style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
            />

            {n > 2 && hi !== lo && [callout(hi, "Peak"), callout(lo, "Low")]}

            {/* post volume: its own strip and scale, the hovered hour in orange */}
            <line x1={PAD.l} x2={width - PAD.r} y1={PLOT_H + VOL_H + 0.5} y2={PLOT_H + VOL_H + 0.5} stroke="rgba(255,255,255,0.08)" />
            <text x={PAD.l - 8} y={PLOT_H + VOL_H - 2} textAnchor="end" className="fill-[var(--ed-fg-30)] font-mono text-[8.5px] uppercase tracking-[0.12em]">vol</text>
            {points.map((p, i) => {
              const h = Math.max(1, (p.posts / maxPosts) * (VOL_H - 6));
              return (
                <rect
                  key={i}
                  x={xAt(i) - barW / 2}
                  y={PLOT_H + VOL_H - h}
                  width={barW}
                  height={h}
                  rx={Math.min(1.5, barW / 2)}
                  fill={i === active ? ORANGE : "rgba(255,255,255,0.16)"}
                />
              );
            })}

            {/* x labels */}
            {xTicks.map((i, k) => (
              <text
                key={i}
                x={xAt(i)}
                y={PLOT_H + VOL_H + 17}
                textAnchor={k === 0 ? "start" : k === xTicks.length - 1 ? "end" : "middle"}
                className="fill-[var(--ed-fg-30)] font-mono text-[9.5px] uppercase tracking-[0.08em]"
              >
                {when(points[i].t, range === "24h")}
              </text>
            ))}

            {/* crosshair + pearl, or a resting pearl on the latest hour */}
            {active != null && (
              <line x1={Math.round(xAt(active)) + 0.5} x2={Math.round(xAt(active)) + 0.5} y1={PAD.t - 6} y2={PLOT_H + VOL_H} stroke="rgba(255,255,255,0.14)" />
            )}
            <g aria-hidden className="transition-opacity duration-500" style={{ opacity: seen ? 1 : 0 }}>
              <circle cx={xAt(a)} cy={yAt(shown[a])} r="6" fill="#0c0c0d" />
              <circle cx={xAt(a)} cy={yAt(shown[a])} r="3.5" fill={active != null ? ORANGE : "#f5f5f5"} />
            </g>

            <rect
              x={PAD.l} y={0} width={iw} height={PLOT_H + VOL_H}
              fill="transparent"
              onPointerMove={onPointer}
              onPointerDown={onPointer}
              onPointerLeave={() => setActive(null)}
            />
          </svg>
        )}
        {width > 0 && (
          <ChartTooltip
            open={active != null}
            x={xAt(a)}
            y={yAt(shown[a] ?? 0)}
            bound={width}
            title={when(points[a]?.t ?? 0)}
            rows={[
              { label: "Trend", value: fmt(trend[a] ?? 0), tone: 0 },
              { label: "Hour", value: fmt(points[a]?.score ?? 0), tone: 1 },
              { label: "Posts", value: points[a]?.posts ?? 0, tone: 2, mark: "dot" },
            ]}
          />
        )}
      </ChartTray>

      {/* table view for screen readers */}
      <table className="sr-only">
        <caption>Hourly sentiment</caption>
        <thead><tr><th>Hour</th><th>Sentiment</th><th>Posts</th></tr></thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.t}><td>{when(p.t)}</td><td>{fmt(p.score)}</td><td>{p.posts}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
