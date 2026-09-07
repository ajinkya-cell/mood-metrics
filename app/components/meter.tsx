"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export interface MeterProps {
  /** Numerical sentiment score (typically -100 to +100) */
  score: number;
  /** Label describing current sentiment (e.g. "NEUTRAL", "BULLISH", "BEARISH") */
  label?: string;
  /** Title text above score (default: "BLENDED SENTIMENT") */
  title?: string;
  /** Sub-status badge text next to label (default: "COCKPIT GREEN") */
  statusTag?: string;
  /** Breakdown text (default: "Blended components weighted: 45/35/15/5") */
  weightingText?: string;
  /** Methodology link destination (default: "/methodology") */
  methodologyUrl?: string;
  /** Methodology link text (default: "METHODOLOGY READ MORE →") */
  methodologyText?: string;
  /** Scale tick marks (default: [-100, -50, 0, 50, 100]) */
  ticks?: number[];
  /** Minimum score boundary (default: -100) */
  minScore?: number;
  /** Maximum score boundary (default: +100) */
  maxScore?: number;
  /** Optional custom container CSS classes */
  className?: string;
}

export function getNeedleCoordinates(
  score: number,
  minScore = -100,
  maxScore = 100
) {
  // Normalize score between minScore and maxScore to -100..100 scale for geometry math
  const clamped = Math.max(minScore, Math.min(maxScore, score));
  const normalizedScore =
    ((clamped - minScore) / (maxScore - minScore)) * 200 - 100;

  const angleInDegrees = -90 + (normalizedScore / 100) * 135;
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  const radius = 52;
  const cx = 90;
  const cy = 90;
  const x = cx + radius * Math.cos(angleInRadians);
  const y = cy + radius * Math.sin(angleInRadians);
  return { x, y };
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

export function Meter({
  score,
  label = "NEUTRAL",
  title = "BLENDED SENTIMENT",
  statusTag = "COCKPIT GREEN",
  weightingText = "Blended components weighted: 45/35/15/5",
  methodologyUrl = "/methodology",
  methodologyText = "METHODOLOGY READ MORE →",
  ticks = [-100, -50, 0, 50, 100],
  minScore = -100,
  maxScore = 100,
  className = "",
}: MeterProps) {
  const sentimentColor = getSentimentColorClass(score);
  const strokeColor = getSentimentStroke(score);
  const needleCoords = getNeedleCoordinates(score, minScore, maxScore);

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-center w-full ${className}`}
    >
      {/* Left: The clean, uncluttered dial gauge */}
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <svg
          viewBox="0 0 180 180"
          className="w-full h-full transform -rotate-15 overflow-visible"
        >
          {/* Background Dial Track */}
          <path
            d="M 40.5 139.5 A 70 70 0 1 1 139.5 139.5"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Colored Active Sentiment Track Outline */}
          <path
            d="M 40.5 139.5 A 70 70 0 1 1 139.5 139.5"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeOpacity="0.25"
            strokeLinecap="round"
          />

          {/* Dial Scale Tick Marks & Numbers */}
          {ticks.map((val) => {
            const normalizedVal =
              ((val - minScore) / (maxScore - minScore)) * 200 - 100;
            const angle = -90 + (normalizedVal / 100) * 135;
            const rad = (angle * Math.PI) / 180;

            // Ticks coordinates
            const tx1 = 90 + 64 * Math.cos(rad);
            const ty1 = 90 + 64 * Math.sin(rad);
            const tx2 = 90 + 72 * Math.cos(rad);
            const ty2 = 90 + 72 * Math.sin(rad);

            // Numbers placement
            const lx = 90 + 84 * Math.cos(rad);
            const ly = 90 + 84 * Math.sin(rad);

            return (
              <g
                key={val}
                className="font-mono text-[8.5px] fill-zinc-500 select-none"
              >
                <line
                  x1={tx1}
                  y1={ty1}
                  x2={tx2}
                  y2={ty2}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1.2"
                />
                <text x={lx} y={ly + 3} textAnchor="middle">
                  {val > 0 ? `+${val}` : val}
                </text>
              </g>
            );
          })}

          {/* Animated Spring Needle */}
          <motion.line
            x1="90"
            y1="90"
            initial={{ x2: 90, y2: 38 }}
            animate={{ x2: needleCoords.x, y2: needleCoords.y }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              mass: 0.8,
            }}
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 3px currentColor)" }}
          />
          <circle
            cx="90"
            cy="90"
            r="5"
            fill="#0C0C0E"
            stroke="#71717A"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Right: The big, score metrics & labels */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left justify-center font-mono">
        {title && (
          <span className="text-xs text-zinc-500 tracking-[0.2em] uppercase">
            {title}
          </span>
        )}

        <motion.span
          key={score}
          initial={{ x: -15, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className={`text-6xl md:text-7xl font-bold tracking-tighter ${sentimentColor} my-1`}
        >
          {score > 0 ? "+" : ""}
          {score}
        </motion.span>

        <div className="flex items-center gap-2 mt-1">
          {label && (
            <span
              className={`text-xs uppercase font-bold px-2.5 py-1 rounded bg-white/5 border border-white/5 ${sentimentColor}`}
            >
              {label}
            </span>
          )}
          {statusTag && (
            <span className="text-xs text-zinc-500">{statusTag}</span>
          )}
        </div>

        {/* Short subtext breakdown */}
        {weightingText && (
          <span className="text-xs text-zinc-500 mt-6 max-w-[200px] leading-relaxed border-t border-white/5 pt-3">
            {weightingText}
          </span>
        )}

        {methodologyUrl && methodologyText && (
          <Link
            href={methodologyUrl}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-bold mt-2 font-mono tracking-wider transition-colors duration-200"
          >
            {methodologyText}
          </Link>
        )}
      </div>
    </div>
  );
}

export default Meter;
