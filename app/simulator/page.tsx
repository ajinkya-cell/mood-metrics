"use client";

import React, { useState } from "react";
import { BookOpen } from "@phosphor-icons/react";
import DoubleBezel from "../components/DoubleBezel";
import { PageShell, PageHero } from "../components/editorial";
import { LineChart } from "../components/charts/LineChart";

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
    flash: 45,
    historic: 35,
    funding: 15,
    fearGreed: 5,
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

  const hoveredPoint = hoverIndex !== null ? simulatedData[hoverIndex] : null;
  const hoveredBaseline = hoverIndex !== null ? baseline[hoverIndex] : null;

  return (
    <PageShell>
      <PageHero micro="Formula workshop" lead="Tune the" accent="weights" description="Experiment with the blend weights and watch the simulated historical sentiment curve respond in real time." />
      <div className="px-4 md:px-5 py-5 border-t border-[var(--ed-border)]">
      {/* Concept Explanation Card */}
      <div className="ed-bento p-5 flex flex-col md:flex-row gap-4 items-start text-[15px] leading-relaxed mb-3">
        <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
          <BookOpen size={16} />
        </div>
        <div className="space-y-3 text-zinc-400">
          <div>
            <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-[9px] mb-1 font-mono">Concept & Mechanics</h3>
            <p>
              The Weight Simulator is an interactive modeling sandbox where users can adjust mathematical weights of the four primary sentiment layers to customize the blended telemetry formula. By sliding individual weights, you modify the system's baseline focus (e.g., placing more importance on institutional perp rates versus retail reddit chatter).
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--ed-border)] pt-3">
            <div>
              <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-[9px] mb-1 font-mono">How it is calculated</h3>
              <p className="text-[11px] text-zinc-500">
                The blended sentiment score is calculated dynamically using a weighted linear combination:
                <br />
                <code className="text-emerald-400 text-[10px] font-mono block my-1">
                  Blended = (L1 * W1 + L2 * W2 + L3 * W3 + L4 * W4) / 100
                </code>
                Where W represents the weight percentage (always summing to 100%), L1 is Flash News (45% default), L2 is Historic Reddit (35%), L3 is Perp Funding (15%), and L4 is Fear & Greed (5%). As you move any slider, the other sliders adjust proportionally to enforce the 100% total limit.
              </p>
            </div>
            <div>
              <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-[9px] mb-1 font-mono">How to use it</h3>
              <p className="text-[11px] text-zinc-500">
                1. Adjust any layer's slider in the Tuning Workbench on the left.
                <br />
                2. Observe how the other three layers auto-balance to keep the formula sum at exactly 100%.
                <br />
                3. The simulated sentiment graph on the right will recalculate its 24h historical score trajectory instantly.
                <br />
                4. Hover over points on the graph to inspect the exact individual contribution from each layer for that specific hour.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sliders Control Panel (col-5) */}
        <div className="lg:col-span-5">
          <DoubleBezel className="p-6">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-4 border-b border-[var(--ed-border)] pb-2">
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
          <div className="border border-[var(--ed-border)] bg-[var(--ed-card)] rounded-3xl p-6">
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

            {/* Simulated curve (void-ui area chart); hover drives the contribution panel below */}
            <LineChart
              bare
              size="fluid"
              variant="area"
              data={simulatedData.map((d, i) => ({ ...d, i }))}
              xKey="i"
              series={[{ key: "score", label: "Simulated" }]}
              yMin={-100}
              yMax={100}
              height={180}
              legend={false}
              formatValue={(v) => `${v > 0 ? "+" : ""}${Math.round(v)}`}
              formatX={(i) => new Date(simulatedData[Number(i)]?.time ?? 0).toLocaleDateString([], { day: "numeric", month: "short" })}
              onActiveChange={setHoverIndex}
            />
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
    </PageShell>
  );
}
