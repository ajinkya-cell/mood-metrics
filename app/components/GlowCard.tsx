"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  accent?: "emerald" | "rose" | "zinc";
  as?: "div" | "section" | "article";
  interactive?: boolean;
  onClick?: () => void;
}

export default function GlowCard({
  children,
  className,
  accent = "zinc",
  as = "div",
  interactive = false,
  onClick,
}: GlowCardProps) {
  const Component = as;

  const accentStyles = {
    emerald:
      "border-white/[0.07] hover:border-emerald-500/25 hover:shadow-[0_8px_30px_-6px_rgba(16,185,129,0.1)]",
    rose:
      "border-white/[0.07] hover:border-rose-500/25 hover:shadow-[0_8px_30px_-6px_rgba(244,63,94,0.1)]",
    zinc:
      "border-white/[0.07] hover:border-white/15 hover:shadow-[0_8px_30px_-6px_rgba(255,255,255,0.04)]",
  };

  return (
    <Component
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[#0C0C0E] border shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] transition-all duration-200",
        accentStyles[accent],
        interactive && "cursor-pointer hover:-translate-y-0.5 active:scale-[0.995]",
        className
      )}
    >
      {children}
    </Component>
  );
}
