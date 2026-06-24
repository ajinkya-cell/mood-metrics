"use client";

import React, { useRef, useState } from "react";
import { motion } from "motion/react";

type TimeseriesPoint = {
  time: string;
  score: number;
  posts: number;
};

type SentimentChartProps = {
  data: TimeseriesPoint[];
};

export default function SentimentChart({ data }: SentimentChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-base text-zinc-500 font-mono">
        NO CHRONOLOGICAL DATA AVAILABLE
      </div>
    );
  }

  const chartData = [...data].reverse();
  const width = 500;
  const height = 150;
  const paddingY = 20;

  const getCoords = (index: number, score: number) => {
    const x = (index / (chartData.length - 1 || 1)) * width;
    const yRange = height - paddingY * 2;
    const y = height - paddingY - ((score + 100) / 200) * yRange;
    return { x, y };
  };

  let pathD = "";
  let areaD = "";
  const points = chartData.map((pt, i) => getCoords(i, pt.score));

  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }
    areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const pct = clientX / rect.width;
    const idx = Math.min(
      Math.max(Math.round(pct * (chartData.length - 1)), 0),
      chartData.length - 1
    );
    setHoverIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoveredPoint = hoverIndex !== null ? chartData[hoverIndex] : null;
  const hoveredCoord = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div ref={containerRef} className="w-full select-none">
      <div className="flex justify-between items-baseline mb-4 font-mono h-12">
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider block">
            HISTORICAL TIMELINE (24H)
          </span>
          <span className="text-sm text-zinc-400">
            {hoveredPoint
              ? new Date(hoveredPoint.time).toLocaleString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Hover chart to scrub data"}
          </span>
        </div>

        {hoveredPoint ? (
          <div className="text-right">
            <span className="text-sm text-zinc-500">SCORE / VOL: </span>
            <span
              className={`text-lg font-bold ${
                hoveredPoint.score > 20
                  ? "text-emerald-500"
                  : hoveredPoint.score < -20
                  ? "text-rose-500"
                  : "text-zinc-300"
              }`}
            >
              {hoveredPoint.score > 0 ? "+" : ""}
              {hoveredPoint.score}
            </span>
            <span className="text-sm text-zinc-400">
              {" "}
              ({hoveredPoint.posts} posts)
            </span>
          </div>
        ) : (
          <div className="text-right">
            <span className="text-sm text-zinc-500">AVERAGE: </span>
            <span className="text-base font-semibold text-zinc-400">
              {Math.round(
                chartData.reduce((acc, curr) => acc + curr.score, 0) /
                  (chartData.length || 1)
              )}
            </span>
          </div>
        )}
      </div>

      <div className="relative border border-white/5 bg-zinc-950/20 rounded-xl overflow-hidden p-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="100%"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair overflow-visible"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          <line
            x1="0"
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4 4"
          />
          <line
            x1="0"
            y1={paddingY}
            x2={width}
            y2={paddingY}
            stroke="rgba(255,255,255,0.03)"
            strokeDasharray="2 2"
          />
          <line
            x1="0"
            y1={height - paddingY}
            x2={width}
            y2={height - paddingY}
            stroke="rgba(255,255,255,0.03)"
            strokeDasharray="2 2"
          />

          {areaD && (
            <path d={areaD} fill="url(#areaGrad)" className="pointer-events-none" />
          )}

          {pathD && (
            <motion.path
              d={pathD}
              fill="none"
              stroke="url(#glowGrad)"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="pointer-events-none"
              style={{ filter: "drop-shadow(0 0 6px rgba(16,185,129,0.4))" }}
            />
          )}

          {hoveredCoord && hoveredPoint && (
            <g className="pointer-events-none">
              <line
                x1={hoveredCoord.x}
                y1={0}
                x2={hoveredCoord.x}
                y2={height}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={hoveredCoord.x}
                cy={hoveredCoord.y}
                r="6"
                fill="#10B981"
                stroke="#fff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
