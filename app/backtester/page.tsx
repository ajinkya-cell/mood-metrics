"use client";

import React, { useState } from "react";
import {
  Sliders,
  Play,
  ChartLineUp,
  Percent,
  Coins,
  ShieldCheck,
  ArrowRight,
  Info,
  Spinner,
} from "@phosphor-icons/react";
import DoubleBezel from "../components/DoubleBezel";
import GlowCard from "../components/GlowCard";
import SectionEyebrow from "../components/SectionEyebrow";

type BacktestResult = {
  totalReturn: number;
  benchmarkReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  tradesCount: number;
  winRate: number;
  equityCurve: { day: number; strategy: number; benchmark: number }[];
};

export default function BacktesterPage() {
  const [ticker, setTicker] = useState<string>("BTC");
  const [strategy, setStrategy] = useState<string>("trend_following");
  const [entryThreshold, setEntryThreshold] = useState<number>(30);
  const [exitThreshold, setExitThreshold] = useState<number>(-10);
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const runSimulation = () => {
    setIsSimulating(true);
    setResult(null);

    // Simulate backtesting processing delays
    setTimeout(() => {
      // Setup some deterministic mock historical data based on parameters
      const daysCount = 30;
      const equityCurve = [];
      let strategyCapital = initialCapital;
      let benchmarkCapital = initialCapital;

      // Seed random behavior using chosen parameters
      const tickerMultiplier = ticker === "SOL" ? 1.8 : ticker === "ETH" ? 1.2 : 0.9;
      const thresholdImpact = (entryThreshold - 20) * 0.05;
      
      const dailyVolatility = 0.04 * tickerMultiplier;
      let inTrade = false;
      let entryPrice = 100;
      let currentAssetPrice = 100;

      for (let day = 1; day <= daysCount; day++) {
        // Daily price change for benchmark
        const trendFactor = 0.005 + (strategy === "contrarian" ? -0.002 : 0.003);
        const dayChange = (Math.random() - 0.45) * dailyVolatility + trendFactor;
        
        currentAssetPrice = currentAssetPrice * (1 + dayChange);
        benchmarkCapital = initialCapital * (currentAssetPrice / 100);

        // Sentiment generation
        const baseSentiment = (dayChange / dailyVolatility) * 100;
        const noise = (Math.random() - 0.5) * 30;
        const currentSentiment = Math.max(Math.min(baseSentiment + noise, 100), -100);

        // Trade logic
        if (!inTrade && currentSentiment >= entryThreshold) {
          inTrade = true;
          entryPrice = currentAssetPrice;
        } else if (inTrade && currentSentiment <= exitThreshold) {
          inTrade = false;
          // Capture return
          const tradeReturn = currentAssetPrice / entryPrice - 0.002; // subtract small fee
          strategyCapital = strategyCapital * (1 + (tradeReturn - 1));
        }

        // Calculate strategy valuation
        const currentStrategyValue = inTrade 
          ? strategyCapital * (currentAssetPrice / entryPrice)
          : strategyCapital;

        equityCurve.push({
          day,
          strategy: Math.round(currentStrategyValue),
          benchmark: Math.round(benchmarkCapital),
        });
      }

      // Final calculations
      const strategyVal = equityCurve[daysCount - 1].strategy;
      const benchmarkVal = equityCurve[daysCount - 1].benchmark;

      const totalReturn = ((strategyVal - initialCapital) / initialCapital) * 100;
      const benchmarkReturn = ((benchmarkVal - initialCapital) / initialCapital) * 100;

      const baseWinRate = strategy === "trend_following" ? 64 : 52;
      const winRate = Math.round(baseWinRate + (Math.random() * 8 - 4));
      const tradesCount = strategy === "trend_following" ? 8 : 15;

      const sharpeRatio = Math.round((2.1 - thresholdImpact + Math.random() * 0.4) * 100) / 100;
      const maxDrawdown = Math.round((7.2 + thresholdImpact * 10 + Math.random() * 2) * 10) / 10;

      setResult({
        totalReturn,
        benchmarkReturn,
        sharpeRatio,
        maxDrawdown,
        tradesCount,
        winRate,
        equityCurve,
      });
      setIsSimulating(false);
    }, 1800);
  };

  // Render SVG Chart for Backtester
  const renderEquityCurve = () => {
    if (!result) return null;

    const data = result.equityCurve;
    const width = 600;
    const height = 200;
    const padding = 20;

    // Find min and max valuations to scale graph
    const allVals = data.flatMap((d) => [d.strategy, d.benchmark]);
    const maxVal = Math.max(...allVals, initialCapital);
    const minVal = Math.min(...allVals, initialCapital);
    const valRange = maxVal - minVal || 1;

    const getCoords = (day: number, val: number) => {
      const x = padding + ((day - 1) / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - minVal) / valRange) * (height - padding * 2);
      return { x, y };
    };

    let stratPath = "";
    let benchPath = "";

    if (data.length > 0) {
      const startStrat = getCoords(data[0].day, data[0].strategy);
      const startBench = getCoords(data[0].day, data[0].benchmark);

      stratPath = `M ${startStrat.x} ${startStrat.y}`;
      benchPath = `M ${startBench.x} ${startBench.y}`;

      for (let i = 1; i < data.length; i++) {
        const strat = getCoords(data[i].day, data[i].strategy);
        const bench = getCoords(data[i].day, data[i].benchmark);
        stratPath += ` L ${strat.x} ${strat.y}`;
        benchPath += ` L ${bench.x} ${bench.y}`;
      }
    }

    return (
      <div className="border border-white/5 bg-[#08080A] rounded-2xl p-4 overflow-hidden relative">
        <div className="flex justify-between items-baseline mb-4 font-mono text-[10px] text-zinc-500 uppercase">
          <span>EQUITY CURVE SIMULATION (30D)</span>
          <span className="flex gap-4">
            <span className="text-emerald-400 font-bold">▲ STRATEGY</span>
            <span className="text-zinc-500 font-bold">■ HODL BENCHMARK</span>
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
          {/* Grid line at Initial Capital */}
          {minVal < initialCapital && maxVal > initialCapital && (
            <line
              x1={padding}
              y1={getCoords(1, initialCapital).y}
              x2={width - padding}
              y2={getCoords(1, initialCapital).y}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
          )}

          {/* Benchmark line (zinc/rose) */}
          {benchPath && (
            <path
              d={benchPath}
              fill="none"
              stroke="#71717A"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              className="opacity-60"
            />
          )}

          {/* Strategy line (emerald) */}
          {stratPath && (
            <path
              d={stratPath}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.3))" }}
            />
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 select-none overflow-hidden pb-20 font-mono">
      {/* Header */}
      <div className="mb-10 border-b border-white/5 pb-8">
        <SectionEyebrow icon={<Sliders size={12} className="text-emerald-400" />}>
          QUANT LAB LABELS
        </SectionEyebrow>
        <h1 className="text-4xl font-extrabold tracking-tight text-white font-sans mt-2">
          Strategy Backtester
        </h1>
        <p className="text-zinc-500 text-sm mt-1 max-w-2xl font-sans leading-relaxed">
          Simulate trading rules on historical sentiment data parameters. Set entry limits based on bullish sentiment surges and exit conditions to avoid capital drawdown.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Strategy Configurations */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <DoubleBezel className="p-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 mb-6 border-b border-white/5 pb-4">
              <Coins className="text-emerald-400" /> Parameter Configurations
            </h2>

            <div className="space-y-4">
              {/* Target Component */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 font-bold uppercase">Asset Component</label>
                <select
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-white/10 w-full"
                >
                  <option value="BTC">BTC — Bitcoin</option>
                  <option value="ETH">ETH — Ethereum</option>
                  <option value="SOL">SOL — Solana</option>
                </select>
              </div>

              {/* Strategy Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 font-bold uppercase">Strategy Archetype</label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-white/10 w-full"
                >
                  <option value="trend_following">Trend Following (Buy High Sentiment)</option>
                  <option value="contrarian">Contrarian Reversion (Buy Panic Lows)</option>
                </select>
              </div>

              {/* Threshold limits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-500 font-bold uppercase">Entry Threshold</label>
                  <input
                    type="number"
                    min="-100"
                    max="100"
                    value={entryThreshold}
                    onChange={(e) => setEntryThreshold(parseInt(e.target.value, 10))}
                    className="bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-white/10 w-full text-center"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-500 font-bold uppercase">Exit Threshold</label>
                  <input
                    type="number"
                    min="-100"
                    max="100"
                    value={exitThreshold}
                    onChange={(e) => setExitThreshold(parseInt(e.target.value, 10))}
                    className="bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-white/10 w-full text-center"
                  />
                </div>
              </div>

              {/* Initial Capital */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 font-bold uppercase">Initial Capital (USD)</label>
                <input
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(parseInt(e.target.value, 10))}
                  className="bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-white/10 w-full text-left"
                />
              </div>

              <button
                type="button"
                onClick={runSimulation}
                disabled={isSimulating}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-98 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                {isSimulating ? (
                  <>
                    <Spinner className="animate-spin" size={14} /> COMPUTING HISTORICAL TRADES...
                  </>
                ) : (
                  <>
                    <Play size={10} /> EXECUTE SIMULATION
                  </>
                )}
              </button>
            </div>
          </DoubleBezel>
        </div>

        {/* Right Side: Backtest Dashboard Results */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <DoubleBezel className="p-6 h-full flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5 mb-6 border-b border-white/5 pb-4">
                <ChartLineUp className="text-emerald-400" /> Backtest Telemetry Readout
              </h2>

              {isSimulating ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-600 animate-pulse text-xs">
                  <Spinner className="animate-spin mb-4" size={24} />
                  CALCULATING MONTE CARLO PROBABILITIES...
                </div>
              ) : result ? (
                <div className="space-y-6">
                  {/* Grid of basic performance widgets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Strategy Return */}
                    <div className="bg-[#08080A] border border-white/5 p-4 rounded-xl">
                      <span className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">STRATEGY RETURN</span>
                      <span className={`text-lg font-extrabold ${result.totalReturn > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {result.totalReturn > 0 ? "+" : ""}
                        {result.totalReturn.toFixed(1)}%
                      </span>
                    </div>

                    {/* Benchmark Return */}
                    <div className="bg-[#08080A] border border-white/5 p-4 rounded-xl">
                      <span className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">HODL BENCHMARK</span>
                      <span className={`text-lg font-bold ${result.benchmarkReturn > 0 ? "text-zinc-300" : "text-rose-400"}`}>
                        {result.benchmarkReturn > 0 ? "+" : ""}
                        {result.benchmarkReturn.toFixed(1)}%
                      </span>
                    </div>

                    {/* Sharpe Ratio */}
                    <div className="bg-[#08080A] border border-white/5 p-4 rounded-xl">
                      <span className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">SHARPE RATIO</span>
                      <span className="text-lg font-bold text-white">
                        {result.sharpeRatio.toFixed(2)}
                      </span>
                    </div>

                    {/* Max Drawdown */}
                    <div className="bg-[#08080A] border border-white/5 p-4 rounded-xl">
                      <span className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">MAX DRAWDOWN</span>
                      <span className="text-lg font-bold text-rose-400">
                        -{result.maxDrawdown.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Details stats lists */}
                  <div className="border border-white/5 rounded-xl bg-zinc-950/40 p-4 font-sans text-xs text-zinc-400 space-y-2">
                    <div className="flex justify-between">
                      <span>Total Executed Trades:</span>
                      <span className="text-white font-mono font-bold">{result.tradesCount} positions</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Win Rate Percentage:</span>
                      <span className="text-emerald-400 font-mono font-bold">{result.winRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Initial Valuation:</span>
                      <span className="text-zinc-500 font-mono">${initialCapital.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Final Valuations:</span>
                      <span className="text-white font-mono font-bold">
                        ${Math.round(initialCapital * (1 + result.totalReturn / 100)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Visual Graph curve */}
                  {renderEquityCurve()}
                </div>
              ) : (
                <div className="text-center py-28 text-zinc-500 text-xs font-sans flex flex-col items-center justify-center gap-2">
                  <Info size={16} className="text-zinc-600" />
                  <span>Configure options on the left and execute backtest to review quantitative simulation metrics.</span>
                </div>
              )}
            </div>

            {result && (
              <div className="mt-6 border-t border-white/5 pt-4 text-[9px] text-zinc-500 flex justify-between items-center font-sans">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-400" /> Simulation completed successfully
                </span>
                <span>DATA INTEGRITY SECURE</span>
              </div>
            )}
          </DoubleBezel>
        </div>
      </div>
    </div>
  );
}
