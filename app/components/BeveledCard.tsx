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

  // Editorial surfaces: 1px ring (box-shadow, so layout never shifts) on near-black
  const variantStyles = {
    raised: "ed-bento",
    sunken: "bg-[#0f0f10] rounded-xl shadow-[0_0_0_1px_var(--ed-border)]",
    flat: "bg-transparent rounded-xl shadow-[0_0_0_1px_var(--ed-border)]",
  };

  return (
    <Component
      onClick={onClick}
      className={cn(
        "relative overflow-hidden transition-colors duration-300",
        variantStyles[variant],
        interactive && "cursor-pointer ed-press",
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
