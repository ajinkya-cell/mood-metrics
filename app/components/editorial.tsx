"use client";

// Editorial Dark Glass kit — shared page primitives for the ed-* design
// system in globals.css. See context.md → "Editorial Dark Glass".

import React, { useState } from "react";
import { motion } from "motion/react";

export const EASE = [0.4, 0, 0.2, 1] as const;

// Framed column with hairline rails; every page sits inside one. Pages should
// not end with a Hatch — the footer opens with one.
export function PageShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`ed-page font-grotesk antialiased min-h-[100dvh] w-full pt-20 overflow-x-hidden ${className}`}>
      {/* Bottom padding inside the frame so the rails run unbroken into the footer */}
      <main className="max-w-7xl mx-auto ed-frame pb-16">{children}</main>
    </div>
  );
}

// Diagonal hatch divider with nodes on the rails
export function Hatch() {
  return <div className="ed-hatch" aria-hidden />;
}

// Blur + rise on mount, staggered by delay (seconds). Pure CSS so content
// can't get stuck invisible.
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`ed-rise ${className}`} style={{ "--ed-delay": `${delay}s` } as React.CSSProperties}>
      {children}
    </div>
  );
}

// Page-level serif headline: micro-label, title with one gradient accent word,
// lede paragraph, optional right-hand slot (controls, stats)
export function PageHero({
  micro,
  lead,
  accent,
  tail,
  description,
  aside,
}: {
  micro: React.ReactNode;
  lead: React.ReactNode;
  accent: string;
  tail?: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="px-5 md:px-8 pt-12 md:pt-16 pb-10 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 items-end">
      <div className="ed-rise">
        <p className="ed-micro">{micro}</p>
        <h1 className="ed-display text-5xl md:text-7xl mt-4">
          {lead} <span className="ed-accent">{accent}</span>
          {tail}
        </h1>
        {description && (
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed tracking-[0.01em] text-[var(--ed-fg-70)]">{description}</p>
        )}
      </div>
      {aside && <div className="flex flex-col items-start md:items-end gap-3 ed-rise" style={{ "--ed-delay": "0.08s" } as React.CSSProperties}>{aside}</div>}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  lead,
  accent,
  tail,
  aside,
}: {
  eyebrow: string;
  lead: string;
  accent: string;
  tail?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="px-5 md:px-8 pt-12 pb-7 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p className="ed-eyebrow">{eyebrow}</p>
        <h2 className="ed-display text-4xl md:text-[3.4rem] mt-3">
          {lead} <span className="ed-accent">{accent}</span>
          {tail && ` ${tail}`}
        </h2>
      </div>
      {aside && <div className="text-[15px] leading-relaxed text-[var(--ed-fg-55)] max-w-sm">{aside}</div>}
    </div>
  );
}

// One cell of a hairline-divided status strip
export function StatCell({
  color,
  label,
  value,
  sub,
  className = "",
}: {
  color: string;
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-5 md:px-7 py-6 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="ed-square" style={{ background: color }} />
        <span className="ed-eyebrow">{label}</span>
      </div>
      <div className="mt-3 font-display text-3xl md:text-[2.6rem] leading-none tracking-tight tabular-nums text-[var(--ed-fg)]">{value}</div>
      <div className="mt-2 text-[13px] text-[var(--ed-fg-55)]">{sub}</div>
    </div>
  );
}

// Static class names so Tailwind can see them
const MD_COLS: Record<number, string> = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5" };

// Grid of StatCells with rail-aligned dividers (2 columns on mobile, one row on desktop)
export function StatStrip({ cells }: { cells: React.ComponentProps<typeof StatCell>[] }) {
  return (
    <section className={`grid grid-cols-2 ${MD_COLS[cells.length] ?? "md:grid-cols-4"} border-t border-[var(--ed-border)]`}>
      {cells.map((c, i) => (
        <StatCell
          key={c.label}
          {...c}
          className={`${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t md:border-t-0" : ""} ${i > 0 ? "md:border-l" : ""} border-[var(--ed-border)]`}
        />
      ))}
    </section>
  );
}

// Glass segmented control: the raised indicator springs to the hovered option
// at 0.85 opacity and back to the selected one on leave. layoutId must be
// unique per control on a page.
export function GlassSegmented<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  label = (o: T) => o,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
  label?: (o: T) => React.ReactNode;
}) {
  const [hovered, setHovered] = useState<T | null>(null);
  const lit = hovered ?? value;
  return (
    <div className="ed-glass p-1 flex items-center" onMouseLeave={() => setHovered(null)}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          onMouseEnter={() => setHovered(o)}
          aria-pressed={value === o}
          className={`relative ed-press px-4 py-1.5 rounded-full text-[13.5px] font-medium cursor-pointer transition-colors duration-150 ${
            lit === o ? "text-white" : "text-[var(--ed-fg-55)]"
          }`}
        >
          {lit === o && (
            <motion.span
              layoutId={layoutId}
              className="ed-chip absolute inset-0"
              animate={{ opacity: hovered && hovered !== value ? 0.85 : 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.6 }}
            />
          )}
          <span className="relative">{label(o)}</span>
        </button>
      ))}
    </div>
  );
}
