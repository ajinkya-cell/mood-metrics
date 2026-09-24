"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type FlareAccent = "pearl" | "emerald" | "rose" | "cyan" | "gold" | "none";
export type BeveledCardVariant = "raised" | "sunken" | "flat";

export interface BeveledCardProps {
  children?: React.ReactNode;
  className?: string;
  variant?: BeveledCardVariant;
  flareAccent?: FlareAccent;
  interactive?: boolean;
  onClick?: () => void;
  as?: "div" | "section" | "article";
}

export default function BeveledCard({
  children,
  className = "",
  variant = "raised",
  flareAccent = "none",
  interactive = false,
  onClick,
  as = "div",
}: BeveledCardProps) {
  const Component = as;

  // Minimalist, anti-slop surface styling
  const variantStyles = {
    raised:
      "bg-[#0C0C0E] border border-white/[0.07] border-t-white/[0.12] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] rounded-2xl",
    sunken:
      "bg-[#08080A] border border-white/[0.04] rounded-xl",
    flat:
      "bg-transparent border border-white/5 rounded-xl",
  };

  return (
    <Component
      onClick={onClick}
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        variantStyles[variant],
        interactive &&
          "cursor-pointer hover:border-white/15 hover:shadow-[0_6px_28px_-4px_rgba(0,0,0,0.6)] active:scale-[0.995]",
        className
      )}
    >
      {/* Ultra-subtle, quiet top specular hairline (only when explicitly requested) */}
      {flareAccent !== "none" && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-10 opacity-40"
          style={{
            background:
              flareAccent === "emerald"
                ? "linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.3) 50%, transparent 100%)"
                : flareAccent === "rose"
                ? "linear-gradient(90deg, transparent 0%, rgba(244,63,94,0.3) 50%, transparent 100%)"
                : "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
          }}
        />
      )}

      {children}
    </Component>
  );
}
