"use client";

import React from "react";
import HairlineFigure from "./HairlineFigure";

// The whale-flow figure (public/hairline/tide.js) with plain-language labels
// laid over it: which building is which, and a caption on the track saying
// which way coins are moving. The caption follows the figure's read-out, so
// hovering to scrub the flow rewrites it; at rest it describes the live score.
// Labels sit in HTML over the SVG (the figure itself stays wordless).

const PALETTE = {
  "--hairline-plate": "#131314",
  "--hairline-hi": "#F28C45",
  "--hairline-edge": "#77736E",
  "--hairline-mid": "#4a4643",
  "--hairline-lo": "#2e2c2a",
} as React.CSSProperties;

const caption = (flow: number) =>
  flow > 0.15 ? "Coins leaving exchanges → cold storage" : flow < -0.15 ? "Coins moving onto exchanges ← to sell" : "Flows roughly balanced";

function Tag({ children, className = "", accent = false }: { children: React.ReactNode; className?: string; accent?: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-md bg-[#131314]/90 px-2 py-1 text-[10px] uppercase tracking-[0.14em] shadow-[0_0_0_1px_var(--ed-border)] ${accent ? "text-[#F28C45]" : "text-[var(--ed-fg-70)]"} ${className}`}
    >
      {children}
    </span>
  );
}

export default function WhaleTide({ score }: { score: number }) {
  const rest = Math.max(-1, Math.min(1, score / 100));
  const [read, setRead] = React.useState("rest");
  // "outflow 62%" / "inflow 40%" / "flat" while hovered; "rest" otherwise
  const m = read.match(/^(outflow|inflow) (\d+)%$/);
  const flow = read === "rest" ? rest : read === "flat" ? 0 : m ? (m[1] === "outflow" ? 1 : -1) * (Number(m[2]) / 100) : rest;

  return (
    <div className="relative h-full min-h-[260px] overflow-hidden">
      {/* The figure's 400×320 frame has wide margins: overscan it so the machine fills the box */}
      <div className="absolute left-1/2 top-1/2 h-[125%] aspect-[5/4] -translate-x-1/2 -translate-y-[52%]">
        <HairlineFigure key={score} name="tide" autoplay={false} restFlow={rest} onRead={setRead} className="absolute inset-0" style={PALETTE} />
        {/* positions are viewBox points as percentages of 400 × 320 */}
        <Tag className="top-[13%] left-[34%]">Exchanges</Tag>
        <Tag className="top-[60%] left-[84%]">Cold storage</Tag>
        <Tag accent className="top-[84%] left-[42%]">
          {caption(flow)}
          {read !== "rest" && <span className="ml-1.5 text-[var(--ed-fg-50)]">· preview</span>}
        </Tag>
      </div>
      <span className="pointer-events-none absolute top-3 right-4 text-[10px] uppercase tracking-[0.14em] text-[var(--ed-fg-30)]">
        Hover to preview other flows
      </span>
    </div>
  );
}
