"use client";

import React, { useState } from "react";
import { Sliders } from "@phosphor-icons/react";
import DoubleBezel from "../components/DoubleBezel";

type SimulatePoint = {
  time: string;
  flash: number;
  historic: number;
  funding: number;
  fearGreed: number;
};

// Seed 24h data coordinates with randomized offsets for realistic wave shifts
const generateBaselineTimeline = (): SimulatePoint[] => {
  const data: SimulatePoint[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
    // Generate sine waves with variables for realistic overlapping layers
    const flash = Math.round(Math.sin(i * 0.5) * 40 + Math.cos(i * 0.2) * 20 + 10);
    const historic = Math.round(Math.cos(i * 0.4) * 50 - Math.sin(i * 0.1) * 15 - 5);
    const funding = Math.round(Math.sin(i * 0.8) * 30 + 15);
    const fearGreed = Math.round(Math.cos(i * 0.3) * 20 + 40);

    data.push({ time, flash, historic, funding, fearGreed });
  }
  return data;
};

export default function SimulatorPage() {
  const [baseline] = useState<SimulatePoint[]>(generateBaselineTimeline());
  const [weights, setWeights] = useState({
    flash: 40,
    historic: 30,
    funding: 15,
    fearGreed: 15,
  });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const handleSliderChange = (key: keyof typeof weights, value: number) => {
    const diff = value - weights[key];
    const otherKeys = (Object.keys(weights) as Array<keyof typeof weights>).filter(
      (k) => k !== key
    );
    const otherSum = otherKeys.reduce((s, k) => s + weights[k], 0);

    const nextWeights = { ...weights };
    nextWeights[key] = value;

    if (otherSum > 0) {
      otherKeys.forEach((k) => {
        const ratio = weights[k] / otherSum;
        nextWeights[k] = Math.round(Math.max(weights[k] - diff * ratio, 0));
      });
    } else {
      otherKeys.forEach((k) => {
        nextWeights[k] = Math.round(Math.max((100 - value) / 3, 0));
      });
    }

    // Clean rounding errors
    const currentSum = Object.values(nextWeights).reduce((a, b) => a + b, 0);
    const error = 100 - currentSum;
    if (error !== 0) {
      nextWeights[otherKeys[0]] += error;
    }

    setWeights(nextWeights);
  };

  // Compute simulated points based on slider values
  const simulatedData = baseline.map((pt) => {
    const score = Math.round(
      (pt.flash * weights.flash +
        pt.historic * weights.historic +
        pt.funding * weights.funding +
        pt.fearGreed * weights.fearGreed) /
        100
    );
    return {
      time: pt.time,
      score,
    };
  });

  // SVG drawing configuration
  const width = 500;
  const height = 150;
  const paddingY = 20;

  const getCoords = (index: number, score: number) => {
    const x = (index / (simulatedData.length - 1)) * width;
    const yRange = height - paddingY * 2;
    const y = height - paddingY - ((score + 100) / 200) * yRange;
    return { x, y };
  };

  const points = simulatedData.map((pt, i) => getCoords(i, pt.score));
  let pathD = "";
  let areaD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }
    areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const pct = clientX / rect.width;
    const idx = Math.min(
      Math.max(Math.round(pct * (simulatedData.length - 1)), 0),
      simulatedData.length - 1
    );
    setHoverIndex(idx);
  };

  const hoveredPoint = hoverIndex !== null ? simulatedData[hoverIndex] : null;
  const hoveredCoord = hoverIndex !== null ? points[hoverIndex] : null;
  const hoveredBaseline = hoverIndex !== null ? baseline[hoverIndex] : null;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 select-none overflow-hidden pb-20 font-mono">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-[#0C0C0E] text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-500 font-bold mb-4">
          <Sliders size={12} />
          FORMULA WORKSHOP
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white font-sans">
          Weight Simulator
        </h1>
        <p className="text-zinc-500 text-sm mt-1 max-w-2xl font-sans">
          Experiment with math weights and watch the simulated historical sentiment curves adjust in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sliders Control Panel (col-5) */}
        <div className="lg:col-span-5">
          <DoubleBezel className="p-6">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-4 border-b border-white/5 pb-2">
              TUNING WORK BENCH (SUM: 100%)
            </span>

            <div className="space-y-6">
              {/* Flash Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span className="font-bold">FLASH NEWS FEED</span>
                  <span>{weights.flash}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.flash}
                  onChange={(e) => handleSliderChange("flash", parseInt(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 rounded-full h-1 cursor-pointer outline-none"
                />
              </div>

              {/* Historic Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span className="font-bold">HISTORIC REDDIT AI</span>
                  <span>{weights.historic}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.historic}
                  onChange={(e) => handleSliderChange("historic", parseInt(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 rounded-full h-1 cursor-pointer outline-none"
                />
              </div>

              {/* Funding Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span className="font-bold">PERPETUAL FUNDING</span>
                  <span>{weights.funding}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.funding}
                  onChange={(e) => handleSliderChange("funding", parseInt(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 rounded-full h-1 cursor-pointer outline-none"
                />
              </div>

              {/* Fear & Greed Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span className="font-bold">FEAR & GREED</span>
                  <span>{weights.fearGreed}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.fearGreed}
                  onChange={(e) => handleSliderChange("fearGreed", parseInt(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 rounded-full h-1 cursor-pointer outline-none"
                />
              </div>
            </div>
          </DoubleBezel>
        </div>

        {/* Live Simulation Graph (col-7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Chart visual container */}
          <div className="border border-white/5 bg-[#0C0C0E] rounded-3xl p-6">
            <div className="flex justify-between items-baseline mb-4 h-12">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                  SIMULATED SENTIMENT OUTLINE
                </span>
                <span className="text-xs text-zinc-400">
                  {hoveredPoint
                    ? new Date(hoveredPoint.time).toLocaleString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Hover path coordinates to evaluate layers"}
                </span>
              </div>

              {hoveredPoint && hoveredBaseline ? (
                <div className="text-right">
                  <span className="text-xs text-zinc-500">SIM_SCORE: </span>
                  <span
                    className={`text-sm font-bold ${
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
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-xs text-zinc-500">AVG SIM: </span>
                  <span className="text-sm font-bold text-zinc-400">
                    {Math.round(
                      simulatedData.reduce((acc, curr) => acc + curr.score, 0) /
                        simulatedData.length
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* SVG Visual */}
            <div className="relative border border-white/5 bg-zinc-950/20 rounded-xl overflow-hidden p-1">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                width="100%"
                height="100%"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-crosshair overflow-visible"
              >
                <defs>
                  <linearGradient id="simAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Zero line */}
                <line
                  x1="0"
                  y1={height / 2}
                  x2={width}
                  y2={height / 2}
                  stroke="rgba(255,255,255,0.03)"
                  strokeDasharray="4 4"
                />

                {/* Area under path */}
                {areaD && <path d={areaD} fill="url(#simAreaGrad)" className="pointer-events-none" />}

                {/* Simulated wave line path */}
                {pathD && (
                  <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2" className="pointer-events-none" />
                )}

                {/* Scrubber tracker indicators */}
                {hoveredCoord && hoveredPoint && (
                  <g className="pointer-events-none">
                    <line
                      x1={hoveredCoord.x}
                      y1={0}
                      x2={hoveredCoord.x}
                      y2={height}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle cx={hoveredCoord.x} cy={hoveredCoord.y} r="4" fill="#10B981" stroke="#fff" strokeWidth="1.5" />
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Layer Contribution analysis during hover */}
          {hoveredPoint && hoveredBaseline && (
            <DoubleBezel className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">FLASH ({weights.flash}%)</span>
                  <span className="text-xs text-white font-bold">
                    {hoveredBaseline.flash > 0 ? "+" : ""}
                    {hoveredBaseline.flash}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">HISTORIC ({weights.historic}%)</span>
                  <span className="text-xs text-white font-bold">
                    {hoveredBaseline.historic > 0 ? "+" : ""}
                    {hoveredBaseline.historic}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">FUNDING ({weights.funding}%)</span>
                  <span className="text-xs text-white font-bold">
                    {hoveredBaseline.funding > 0 ? "+" : ""}
                    {hoveredBaseline.funding}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">F&G ({weights.fearGreed}%)</span>
                  <span className="text-xs text-white font-bold">
                    {hoveredBaseline.fearGreed > 0 ? "+" : ""}
                    {hoveredBaseline.fearGreed}
                  </span>
                </div>
              </div>
            </DoubleBezel>
          )}
        </div>
      </div>
    </div>
  );
}
