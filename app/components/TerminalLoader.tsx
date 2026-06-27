"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { Particles } from "./magicui/particles";

interface TerminalLoaderProps {
  symbol: string;
}

const CRYPTO_HISTORY = [
  "Oct 31, 2008: Satoshi Nakamoto publishes the Bitcoin whitepaper: 'Bitcoin: A Peer-to-Peer Electronic Cash System'.",
  "Jan 03, 2009: Genesis block (Block 0) is mined with the embedded text: 'Chancellor on brink of second bailout for banks'.",
  "Jan 12, 2009: First Bitcoin transaction is sent from Satoshi Nakamoto to developer Hal Finney.",
  "May 22, 2010: Laszlo Hanyecz pays 10,000 BTC for two Papa John's pizzas (Bitcoin Pizza Day).",
  "Jul 30, 2015: The Ethereum mainnet genesis block is launched, introducing smart contracts.",
  "Apr 20, 2024: Bitcoin's fourth halving takes place, dropping the block reward to 3.125 BTC."
];

export default function TerminalLoader({ symbol }: TerminalLoaderProps) {
  const [visibleLogCount, setVisibleLogCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [boostLogs, setBoostLogs] = useState<{ tag: string; text: string }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Parallax motion variables
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Map mouse move position to translation offsets (opposite directions for card vs. background)
  const cardX = useTransform(mouseX, [-400, 400], [-12, 12]);
  const cardY = useTransform(mouseY, [-400, 400], [-12, 12]);
  const particlesX = useTransform(mouseX, [-400, 400], [18, -18]);
  const particlesY = useTransform(mouseY, [-400, 400], [18, -18]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (typeof window !== "undefined") {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    }
  };

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

  // Console logs (streamlined base)
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

  // Increment logs staggered
  useEffect(() => {
    if (visibleLogCount < logs.length) {
      const delay = visibleLogCount === 0 ? 50 : visibleLogCount === 4 ? 120 : 80;
      const timer = setTimeout(() => {
        setVisibleLogCount((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [visibleLogCount, logs.length]);

  // Cycle through history timeline items every 5.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setHistoryIndex((prev) => (prev + 1) % CRYPTO_HISTORY.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Scroll logs container to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleLogCount, boostLogs]);

  // Interactivity: clicking coin boots the loader speed and injects fun console logs
  const handleCoinClick = () => {
    setClickCount((prev) => prev + 1);
    
    const boostMessages = [
      { tag: "BOOST", text: `Manual entropy injected: Accelerating sync flow.` },
      { tag: "ACCEL", text: `Pipeline throughput optimized: +25% cache fetch speed.` },
      { tag: "HOT_SWP", text: `Bypassing oracle throttling limits.` },
    ];
    const newMsg = boostMessages[clickCount % boostMessages.length];
    setBoostLogs((prev) => [...prev, newMsg]);

    // Speed up standard loading sequence
    if (visibleLogCount < logs.length) {
      setVisibleLogCount((prev) => Math.min(prev + 2, logs.length));
    }
  };

  const defaultLogsSlice = logs.slice(0, visibleLogCount);
  const combinedLogs = [...defaultLogsSlice, ...boostLogs];

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-[100] bg-[#050505]/75 backdrop-blur-md flex items-center justify-center p-4 select-none font-mono overflow-hidden"
    >
      {/* Whole-page interactive particles background with opposite parallax offset */}
      <motion.div 
        style={{ x: particlesX, y: particlesY }}
        className="absolute inset-0 z-0 h-full w-full pointer-events-none"
      >
        <Particles quantity={160} color="#10B981" />
      </motion.div>

      {/* Sleek, wider max-w-md Loader Box with parallax translation */}
      <motion.div 
        style={{ x: cardX, y: cardY }}
        className="w-full max-w-md border border-zinc-900 bg-[#09090b]/98 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl p-7 relative overflow-hidden flex flex-col gap-6 z-10"
      >
        
        {/* Subtle decorative dot grid background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: "radial-gradient(circle, #10B981 1px, transparent 1px)",
            backgroundSize: "10px 10px",
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

        {/* Subtle, Interactive Animated Coin Telemetry */}
        <div className="relative w-20 h-20 flex items-center justify-center self-center my-1 cursor-pointer group">
          {/* External rotating dash rings (Very low opacity) */}
          <div className="absolute inset-0 border border-emerald-500/5 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-0 border border-dashed border-emerald-500/10 rounded-full animate-[spin_6s_linear_infinite_reverse]" />
          <div className="absolute inset-2 border border-emerald-500/5 rounded-full" />
          
          {/* Laser scanning sweep - minimal line */}
          <motion.div
            className="absolute top-0 inset-x-3 h-[1px] bg-emerald-500/30 shadow-[0_0_4px_#10B981] z-10 pointer-events-none"
            animate={{ y: [4, 76, 4] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />

          {/* Central Interactive Clickable Coin Badge */}
          <motion.button
            onClick={handleCoinClick}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            title="Click to boost loader speed"
            className="absolute inset-4 border border-emerald-500/15 bg-emerald-950/[0.08] hover:bg-emerald-950/20 active:border-emerald-500/35 rounded-full flex items-center justify-center shadow-[inset_0_0_8px_rgba(16,185,129,0.05)] focus:outline-none z-20"
          >
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-emerald-400/90 font-bold text-lg select-none filter drop-shadow-[0_0_3px_rgba(16,185,129,0.2)]"
            >
              {coinGlyph}
            </motion.span>
          </motion.button>
        </div>

        {/* Compact Terminal Logs Window */}
        <div className="h-24 flex flex-col justify-end gap-1.5 overflow-hidden text-[11px] border-b border-white/5 pb-4">
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
            {combinedLogs.map((log, index) => {
              const isLast = index === combinedLogs.length - 1;
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 transition-all duration-300 ${
                    isLast ? "text-emerald-400 font-medium animate-pulse" : "text-zinc-500"
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

        {/* Crypto History Fact Sheet Ticker */}
        <div className="border-t border-white/5 pt-4 text-center select-text z-20">
          <div className="text-[10px] text-zinc-450 uppercase tracking-widest font-mono mb-2">
            Historical Crypto Log
          </div>
          <div className="h-16 flex items-center justify-center px-2">
            <motion.p
              key={historyIndex}
              initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.4 }}
              className="text-xs text-zinc-300 leading-relaxed font-sans max-w-sm text-center"
            >
              {CRYPTO_HISTORY[historyIndex]}
            </motion.p>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
