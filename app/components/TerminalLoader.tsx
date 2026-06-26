"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

interface TerminalLoaderProps {
  symbol: string;
}

export default function TerminalLoader({ symbol }: TerminalLoaderProps) {
  const [visibleLogCount, setVisibleLogCount] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Dynamic coin character symbol
  const getCoinGlyph = (sym: string) => {
    switch (sym.toUpperCase()) {
      case "BTC":
        return "₿";
      case "ETH":
        return "Ξ";
      case "SOL":
        return "◎";
      default:
        return "¤";
    }
  };

  const coinGlyph = getCoinGlyph(symbol);

  // Console logs (streamlined and faster)
  const logs = [
    { tag: "BOOT", text: "Connecting telemetry nodes..." },
    { tag: "RESOLV", text: `Targeting token asset [${symbol.toUpperCase()}]` },
    { tag: "L1_NEWS", text: "Scraping news (CoinGecko + RSS)..." },
    { tag: "L2_REDDIT", text: "Analyzing community boards (Reddit)..." },
    { tag: "NIM_AI", text: "Running sentiment classifier (Llama 3.1)..." },
    { tag: "L3_PERP", text: "Ingesting perpetual funding rates..." },
    { tag: "L4_INDIC", text: "Retrieving Fear & Greed indices..." },
    { tag: "BLEND", text: "Computing blended telemetry coefficients..." },
    { tag: "SYNC", text: "Synchronizing system matrix cache..." },
  ];

  // Faster staggered log increments
  useEffect(() => {
    if (visibleLogCount < logs.length) {
      const delay = visibleLogCount === 0 ? 50 : visibleLogCount === 4 ? 150 : 80;
      const timer = setTimeout(() => {
        setVisibleLogCount((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [visibleLogCount, logs.length]);

  // Scroll terminal logs container
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleLogCount]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505]/70 backdrop-blur-md flex items-center justify-center p-4 select-none font-mono">
      {/* Sleek, Compact HUD Loader Box */}
      <div className="w-full max-w-sm border border-white/10 bg-[#0c0c0e]/95 shadow-[0_0_40px_rgba(0,0,0,0.6)] rounded-2xl p-6 relative overflow-hidden flex flex-col gap-5">
        
        {/* Decorative Grid Lines Overlay inside card */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #10B981 1px, transparent 1px)",
            backgroundSize: "8px 8px",
          }}
        />

        {/* Header telemetry band */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Analyzing {symbol}</span>
          </div>
          <span>MATRIX TELEMETRY</span>
        </div>

        {/* Minimal Animated Coin Telemetry */}
        <div className="relative w-16 h-16 flex items-center justify-center self-center my-1">
          {/* External rotating dash rings */}
          <div className="absolute inset-0 border border-emerald-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-0 border border-dashed border-emerald-500/30 rounded-full animate-[spin_6s_linear_infinite_reverse]" />
          <div className="absolute inset-1.5 border border-emerald-500/20 rounded-full" />
          
          {/* Laser scanning sweep */}
          <motion.div
            className="absolute top-0 inset-x-2 h-[1px] bg-emerald-400/70 shadow-[0_0_8px_#34d399] z-10 pointer-events-none"
            animate={{ y: [4, 60, 4] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />

          {/* Central Coin Badge */}
          <div className="absolute inset-3 border border-emerald-500/40 bg-emerald-950/20 rounded-full flex items-center justify-center shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]">
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="text-white font-bold text-base drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
            >
              {coinGlyph}
            </motion.span>
          </div>
        </div>

        {/* Compact Terminal Logs Window */}
        <div className="h-20 flex flex-col justify-end gap-1.5 overflow-hidden text-[11px] border-b border-white/5 pb-3">
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
            {logs.slice(0, visibleLogCount).map((log, index) => {
              const isLast = index === visibleLogCount - 1;
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 transition-all duration-300 ${
                    isLast ? "text-emerald-400 font-medium" : "text-zinc-500"
                  }`}
                >
                  <span className={isLast ? "text-emerald-500" : "text-emerald-700"}>
                    [{log.tag}]
                  </span>
                  <span className="truncate">{log.text}</span>
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Diagnostic Footer with Micro Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-white/5 h-[3px] rounded-full overflow-hidden">
            <motion.div
              className="bg-emerald-500 h-full shadow-[0_0_6px_#10B981]"
              initial={{ width: 0 }}
              animate={{ width: `${(visibleLogCount / logs.length) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          
          <div className="flex justify-between text-[9px] text-zinc-500 font-mono tracking-wider">
            <span>SYS_MEM: OK</span>
            <span>SYNCING: {Math.floor((visibleLogCount / logs.length) * 100)}%</span>
          </div>
        </div>

      </div>
    </div>
  );
}
