"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

// Full-screen loading state for the dashboard: serif headline, a glass coin
// medallion ringed by rotating text, and a checklist of the real pipeline
// steps. Sits under the nav (z-40) so the glass nav stays usable.

const COIN_NAMES: Record<string, string> = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana" };
const COIN_ICONS: Record<string, string> = { BTC: "/bitcoin.png", ETH: "/ethereum.png", SOL: "/solana.png" };

const STEPS = [
  { color: "#34d399", label: "Flash news", detail: "CoinGecko + RSS headlines" },
  { color: "#38bdf8", label: "Reddit", detail: "Subreddit discussions via Arctic Shift" },
  { color: "#e879f9", label: "AI scoring", detail: "Nemotron classifies each post" },
  { color: "#fbbf24", label: "Leverage & fear", detail: "Funding rates, Fear & Greed" },
  { color: "#a78bfa", label: "Blend", detail: "45 / 35 / 15 / 5 weighted score" },
];

const CRYPTO_HISTORY = [
  "Oct 31, 2008 — Satoshi Nakamoto publishes the Bitcoin whitepaper.",
  "Jan 3, 2009 — The genesis block is mined: “Chancellor on brink of second bailout for banks.”",
  "Jan 12, 2009 — The first Bitcoin transaction, from Satoshi to Hal Finney.",
  "May 22, 2010 — 10,000 BTC buys two pizzas. Bitcoin Pizza Day is born.",
  "Jul 30, 2015 — Ethereum's mainnet launches, and smart contracts go live.",
  "Apr 20, 2024 — Bitcoin's fourth halving cuts the block reward to 3.125 BTC.",
];

const STEP_MS = 230;

export default function SentimentLoader({ symbol }: { symbol: string }) {
  const sym = symbol.toUpperCase();
  const name = COIN_NAMES[sym] ?? sym;
  // Steps advance on a timer and hold on the last one until data arrives
  const [step, setStep] = useState(0);
  // Deterministic start: this renders on the server too, so no Math.random here
  const [fact, setFact] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setFact((f) => (f + 1) % CRYPTO_HISTORY.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Lock page scroll while the loader covers it; restore whatever was there before
  useEffect(() => {
    const html = document.documentElement, body = document.body;
    const prev = [html.style.overflow, body.style.overflow, body.style.overscrollBehavior];
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    return () => {
      [html.style.overflow, body.style.overflow, body.style.overscrollBehavior] = prev;
    };
  }, []);

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Loading ${name} sentiment`}
      className="fixed inset-0 z-40 ed-page ed-iso font-grotesk flex flex-col items-center px-5 pt-20 pb-5 overflow-hidden overscroll-none touch-none"
    >
      {/* my-auto centres when there is room and starts below the nav when there is not */}
      <div className="my-auto w-full max-w-[400px] flex flex-col items-center text-center">
        {/* Coin medallion with rotating caption ring */}
        <div className="relative w-20 h-20 ed-rise">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[spin_14s_linear_infinite]" aria-hidden>
            <defs>
              <path id="loaderRing" d="M50,50 m-41,0 a41,41 0 1,1 82,0 a41,41 0 1,1 -82,0" />
            </defs>
            {/* textLength = ring circumference (2π·41 ≈ 257) so the phrase meets itself exactly */}
            <text fontSize="6.4" fill="oklch(98.5% 0 0 / 0.55)" style={{ fontFamily: "var(--font-grotesk)" }}>
              <textPath href="#loaderRing" textLength="255" lengthAdjust="spacing">
                READING · SCORING · BLENDING ·
              </textPath>
            </text>
          </svg>
          <div className="ed-chip absolute inset-4 flex items-center justify-center">
            {COIN_ICONS[sym] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={COIN_ICONS[sym]} alt="" className="w-6 h-6 object-contain select-none" />
            ) : (
              <span className="text-[15px] font-medium text-white">{sym}</span>
            )}
          </div>
        </div>

        <p className="ed-micro mt-4 ed-rise" style={{ "--ed-delay": "0.05s" } as React.CSSProperties}>
          Reading the market · {sym}
        </p>
        <h1 className="ed-display text-[2.1rem] md:text-[2.6rem] mt-2 ed-rise" style={{ "--ed-delay": "0.1s" } as React.CSSProperties}>
          Reading <span className="ed-accent">{name}</span>&apos;s mood
        </h1>

        {/* Pipeline checklist */}
        <ol className="w-full mt-4 ed-bento text-left ed-rise" style={{ "--ed-delay": "0.15s" } as React.CSSProperties}>
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={s.label}
                className={`flex items-center gap-3 px-4 py-2 border-t border-[var(--ed-border)] first:border-t-0 transition-opacity duration-300 ${
                  done || active ? "opacity-100" : "opacity-40"
                }`}
              >
                <span
                  className={`ed-square transition-colors duration-300 ${active ? "animate-pulse" : ""}`}
                  style={done || active ? { background: s.color } : { boxShadow: "inset 0 0 0 1px var(--ed-border)" }}
                />
                <span className="text-[14px] font-medium tracking-[-0.02em] text-[var(--ed-fg-90)]">{s.label}</span>
                <span className="flex-1 min-w-0 truncate text-[12.5px] text-[var(--ed-fg-55)] invisible sm:visible">{s.detail}</span>
                <span className="font-mono text-[11px] text-[var(--ed-fg-50)] w-10 text-right">
                  {done ? "done" : active ? "···" : ""}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Hairline progress */}
        <div className="w-full mt-3 h-px bg-[var(--ed-border)] overflow-hidden" aria-hidden>
          <div
            className="h-full transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%`, background: "#f5f5f5" }}
          />
        </div>

        {/* Rotating history fact */}
        <div className="mt-4 min-h-[3rem]">
          <p className="ed-eyebrow">From the archive</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={fact}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="mt-1.5 text-[14.5px] leading-snug text-[var(--ed-fg-70)]"
            >
              {CRYPTO_HISTORY[fact]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
