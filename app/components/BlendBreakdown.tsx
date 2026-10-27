"use client";

import React from "react";
import Link from "next/link";

// The composite score taken apart: one row per signal layer, each a bar
// growing left (bearish) or right (bullish) from a shared zero line by the
// points that layer adds to the blend (layer score × weight). The rows add up
// to the total under them. Monochrome with one accent: pushes up are orange,
// pushes down are white. Rows open that layer's explainer.

export type BlendRow = {
  tag: string;
  name: string;
  color: string;
  /** Share of the blend, 0..1 */
  weight: number;
  /** Layer score, -100..+100 */
  score: number;
};

const ORANGE = "#F28C45";
const fmt1 = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;
const fmt0 = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(Math.round(v))}`;

/** A small half-dial for the composite: ticks every 25, an orange arc from 0 to the score, a needle. */
function MiniGauge({ score, shown }: { score: number; shown: boolean }) {
  const R = 46, cx = 60, cy = 56;
  const v = Math.max(-100, Math.min(100, score));
  // -100 → 180° (left), 0 → 90° (top), +100 → 0° (right)
  const ang = (val: number) => ((100 - val) / 200) * Math.PI;
  const pt = (val: number, r: number) => [cx + r * Math.cos(ang(val)), cy - r * Math.sin(ang(val))] as const;
  const arc = (a: number, b: number, r: number) => {
    const [x0, y0] = pt(a, r), [x1, y1] = pt(b, r);
    return `M${x0},${y0} A${r},${r} 0 0 ${b > a ? 1 : 0} ${x1},${y1}`;
  };
  const needle = shown ? v : 0;
  const [nx, ny] = pt(needle, R - 12);
  return (
    <svg viewBox="0 0 120 66" className="w-[120px] h-[66px] shrink-0" aria-hidden>
      <path d={arc(-100, 100, R)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round" />
      {v !== 0 && (
        <path
          d={arc(0, needle || 0.01, R)}
          fill="none"
          stroke="#F28C45"
          strokeWidth="5"
          strokeLinecap="round"
          style={{ transition: "d 0.9s cubic-bezier(.4,0,.2,1)" }}
        />
      )}
      {[-100, -75, -50, -25, 0, 25, 50, 75, 100].map((t) => {
        const [x0, y0] = pt(t, R + 6), [x1, y1] = pt(t, R + (t % 50 === 0 ? 11 : 9));
        return <line key={t} x1={x0} y1={y0} x2={x1} y2={y1} stroke={t === 0 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)"} strokeWidth="1" />;
      })}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="#f5f5f5"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transition: "x2 0.9s cubic-bezier(.4,0,.2,1), y2 0.9s cubic-bezier(.4,0,.2,1)" }}
      />
      <circle cx={cx} cy={cy} r="4.5" fill="#131314" stroke="rgba(255,255,255,0.35)" />
      <text x={cx - R} y={cy + 9} textAnchor="middle" className="fill-[var(--ed-fg-30)] font-mono text-[7px]">−100</text>
      <text x={cx + R} y={cy + 9} textAnchor="middle" className="fill-[var(--ed-fg-30)] font-mono text-[7px]">+100</text>
    </svg>
  );
}

export default function BlendBreakdown({
  score,
  label,
  rows,
  onOpen,
}: {
  score: number;
  label: string;
  rows: BlendRow[];
  onOpen?: (tag: string) => void;
}) {
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const id = window.setTimeout(() => setShown(true), 60);
    return () => clearTimeout(id);
  }, []);

  const parts = rows.map((r) => ({ ...r, pts: r.score * r.weight }));
  const total = parts.reduce((s, p) => s + p.pts, 0);
  // a shared scale so rows compare honestly, padded so the largest bar never touches the edge
  const span = Math.max(5, ...parts.map((p) => Math.abs(p.pts))) * 1.2;
  const verdict = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-end gap-3">
        <span className="font-display text-[5.5rem] leading-[0.8] tracking-tight tabular-nums text-white">{fmt0(score)}</span>
        <MiniGauge score={score} shown={shown} />
        <span className="ed-tag mb-1.5 ml-auto">
          <span className="ed-square" style={{ background: score > 20 ? ORANGE : score < -20 ? "#e5e5e5" : "rgba(255,255,255,0.35)" }} />
          {verdict}
        </span>
      </div>
      <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ed-fg-55)]">
        Out of ±100. Each layer below pushes the score up or down by its own reading times its weight.
      </p>

      <div className="mt-6 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ed-fg-30)]">
        <span className="pl-[38%]">← bearish</span>
        <span>bullish →</span>
      </div>

      <ul className="mt-2 relative">
        {/* the shared zero line, through every row */}
        <span aria-hidden className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: "calc(38% + (100% - 38% - 3.5rem) / 2)" }} />
        {parts.map((p, i) => {
          const w = (Math.abs(p.pts) / span) * 50;
          return (
            <li key={p.tag}>
              <button
                onClick={() => onOpen?.(p.tag)}
                className="group w-full grid grid-cols-[38%_1fr_3.5rem] items-center gap-0 py-2.5 border-t border-[var(--ed-border)] first:border-t-0 text-left cursor-pointer rounded-md hover:bg-white/[0.025] transition-colors duration-300"
                aria-label={`${p.name}: ${fmt1(p.pts)} points (score ${fmt0(p.score)} × ${Math.round(p.weight * 100)}%). Open explainer`}
              >
                <span className="flex items-center gap-2 min-w-0 pl-1">
                  <span className="ed-square shrink-0" style={{ background: p.color }} />
                  <span className="truncate text-[13.5px] text-[var(--ed-fg-90)] group-hover:text-white transition-colors">{p.name}</span>
                  <span className="font-mono text-[10.5px] text-[var(--ed-fg-30)]">{Math.round(p.weight * 100)}%</span>
                </span>
                <span className="relative h-2.5" aria-hidden>
                  <span className="absolute inset-y-0 left-0 right-0 rounded-full bg-white/[0.03]" />
                  <span
                    className="absolute inset-y-0 rounded-[2px] transition-[width] duration-700 ease-[cubic-bezier(.4,0,.2,1)]"
                    style={{
                      width: shown ? `${w}%` : "0%",
                      transitionDelay: `${i * 60}ms`,
                      background: p.pts >= 0 ? ORANGE : "rgba(255,255,255,0.75)",
                      ...(p.pts >= 0 ? { left: "50%" } : { right: "50%" }),
                    }}
                  />
                </span>
                <span className="text-right font-mono text-[12.5px] tabular-nums text-[var(--ed-fg-90)]">{fmt1(p.pts)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 pt-3 border-t border-[var(--ed-border)] flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-[var(--ed-fg-55)]">
          Total <span className="font-mono text-white tabular-nums">{fmt1(total)}</span>
          {Math.round(total) === Math.round(score) && <span> · shown as {fmt0(score)}</span>}
        </span>
        <Link href="/methodology" className="text-[var(--ed-fg-70)] hover:text-white transition-colors duration-150">
          How it&apos;s calculated →
        </Link>
      </div>
    </div>
  );
}
