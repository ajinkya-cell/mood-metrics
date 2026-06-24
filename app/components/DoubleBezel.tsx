import React from "react";

type DoubleBezelProps = {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
};

/**
 * DoubleBezel Layout Container
 * Enforces the $150k Awwwards-tier nested "Double-Bezel" (Doppelrand) architecture.
 * Synthesizes concentric curves, outer tray enclosures, and inner highlight refractions.
 */
export default function DoubleBezel({
  children,
  className = "",
  innerClassName = "",
}: DoubleBezelProps) {
  return (
    <div
      className={`rounded-[2rem] p-1.5 bg-neutral-900/10 border border-white/10 ${className}`}
    >
      <div
        className={`bg-zinc-950/90 rounded-[calc(2rem-0.375rem)] border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] ${innerClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
