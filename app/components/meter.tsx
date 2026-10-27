"use client";

import React, { useEffect, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useSpring } from "motion/react";
import Link from "next/link";

// Machined segment gauge (void-ui Gauge language): an arc of short segments
// around a recessed face. Segments between 0 and the score rise to a raised
// near-white finish, and the leading one runs long in the sentiment colour as
// the needle. The arc sweeps from 0 on mount.

export interface MeterProps {
  /** Numerical sentiment score (typically -100 to +100) */
  score: number;
  /** Label describing current sentiment (e.g. "neutral", "bullish", "bearish") */
  label?: string;
  /** Eyebrow above the readout (default: "Blended sentiment") */
  title?: string;
  /** Optional extra text beside the status chip */
  statusTag?: string;
  /** Breakdown text under the readout */
  weightingText?: string;
  /** Methodology link destination (default: "/methodology") */
  methodologyUrl?: string;
  /** Methodology link text */
  methodologyText?: string;
  /** Labelled scale values (default: [-100, -50, 0, 50, 100]) */
  ticks?: number[];
  /** Minimum score boundary (default: -100) */
  minScore?: number;
  /** Maximum score boundary (default: +100) */
  maxScore?: number;
  /** Optional custom container CSS classes */
  className?: string;
}

export function getSentimentColorClass(score: number) {
  if (score > 20) return "text-emerald-500";
  if (score < -20) return "text-rose-500";
  return "text-zinc-400";
}

export function getSentimentStroke(score: number) {
  if (score > 20) return "#10B981";
  if (score < -20) return "#F43F5E";
  return "#71717A";
}

// Geometry: 270° sweep with the gap at the bottom, centred on (100, 100)
const SEGMENTS = 41; // odd, so one segment sits exactly on 0
const SWEEP = 270;
const R_IN = 70;
const R_OUT = 84;
const R_NEEDLE_IN = 58;
const R_NEEDLE_OUT = 90;

const angleFor = (v: number, min: number, max: number) => -90 + ((v - min) / (max - min) - 0.5) * SWEEP;
const polar = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad) };
};

export function Meter({
  score,
  label = "neutral",
  title = "Blended sentiment",
  statusTag,
  weightingText = "News 45 · Reddit 35 · Funding 15 · Fear & Greed 5",
  methodologyUrl = "/methodology",
  methodologyText = "How it's calculated →",
  ticks = [-100, -50, 0, 50, 100],
  minScore = -100,
  maxScore = 100,
  className = "",
}: MeterProps) {
  const clamped = Math.max(minScore, Math.min(maxScore, score));
  const stroke = getSentimentStroke(score);
  const reduceMotion = useReducedMotion();

  // Sweep the arc from 0 to the score; jump straight there for reduced motion
  const spring = useSpring(0, { stiffness: 90, damping: 18, mass: 0.8 });
  const [shown, setShown] = useState(0);
  useMotionValueEvent(spring, "change", (v) => setShown(v));
  useEffect(() => {
    if (reduceMotion) spring.jump(clamped);
    else spring.set(clamped);
  }, [clamped, reduceMotion, spring]);

  const step = (maxScore - minScore) / (SEGMENTS - 1);
  // Index of the segment nearest the animated value = the needle
  const lead = Math.round((shown - minScore) / step);
  const zero = Math.round((0 - minScore) / step);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-center w-full ${className}`}>
      <div className="relative w-52 h-52 mx-auto">
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible" role="img" aria-label={`${title}: ${score}`}>
          <defs>
            <radialGradient id="meterFace" cx="50%" cy="38%" r="65%">
              <stop offset="0%" stopColor="#111113" />
              <stop offset="100%" stopColor="#09090a" />
            </radialGradient>
          </defs>

          {/* Recessed face: dark well with an inner hairline and a lit lower lip */}
          <circle cx="100" cy="100" r="60" fill="url(#meterFace)" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth="3" />
          <circle cx="100" cy="100" r="61.5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

          {/* Machined segments */}
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const v = minScore + i * step;
            const a = angleFor(v, minScore, maxScore);
            const isLead = i === lead;
            const lit = lead >= zero ? i >= zero && i < lead : i <= zero && i > lead;
            const p1 = polar(a, isLead ? R_NEEDLE_IN : R_IN);
            const p2 = polar(a, isLead ? R_NEEDLE_OUT : R_OUT);
            return (
              <line
                key={i}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                strokeLinecap="round"
                strokeWidth={isLead ? 3.2 : 2.4}
                stroke={isLead ? stroke : lit ? "#e9e9ea" : "rgba(255,255,255,0.08)"}
                style={isLead ? { filter: `drop-shadow(0 0 3px ${stroke})` } : undefined}
              />
            );
          })}

          {/* Scale labels outside the arc */}
          {ticks.map((t) => {
            const p = polar(angleFor(t, minScore, maxScore), 98);
            return (
              <text
                key={t}
                x={p.x}
                y={p.y + 3}
                textAnchor="middle"
                fontSize="8"
                fill="oklch(98.5% 0 0 / 0.4)"
                style={{ fontFamily: "var(--font-grotesk)" }}
              >
                {t > 0 ? `+${t}` : t}
              </text>
            );
          })}
        </svg>

        {/* Score in the face, extruded */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="ed-display ed-accent text-[3.4rem] leading-none tabular-nums">
            {score > 0 ? "+" : ""}
            {score}
          </span>
          <span className="ed-micro text-[9px] mt-1 text-[var(--ed-fg-50)]">of ±100</span>
        </div>
      </div>

      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <span className="ed-eyebrow">{title}</span>
        <div className="flex items-center gap-2 mt-3">
          <span className="ed-tag text-[11px]">
            <span className="ed-square" style={{ background: stroke }} />
            {label}
          </span>
          {statusTag && <span className="text-[13px] text-[var(--ed-fg-55)]">{statusTag}</span>}
        </div>
        {weightingText && (
          <p className="mt-5 pt-4 border-t border-[var(--ed-border)] max-w-[220px] text-[13px] leading-relaxed text-[var(--ed-fg-55)]">
            {weightingText}
          </p>
        )}
        {methodologyUrl && methodologyText && (
          <Link href={methodologyUrl} className="mt-2 text-[13px] text-[var(--ed-fg-70)] hover:text-white transition-colors duration-150">
            {methodologyText}
          </Link>
        )}
      </div>
    </div>
  );
}

export default Meter;
