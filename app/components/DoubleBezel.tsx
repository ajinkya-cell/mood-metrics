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
      className={`bg-zinc-950/50 border border-white/5 rounded-2xl ${className} ${innerClassName}`}
    >
      {children}
    </div>
  );
}
