import React from "react";
import { cn } from "@/lib/utils";

type GlowCardProps = {
  children: React.ReactNode;
  className?: string;
  accent?: "emerald" | "rose" | "blue" | "amber" | "zinc";
  as?: "div" | "section" | "article";
};

const accentMap: Record<string, string> = {
  emerald:
    "border-emerald-500/10 hover:border-emerald-500/25 shadow-[0_0_15px_-5px_rgba(16,185,129,0.08)] hover:shadow-[0_0_25px_-8px_rgba(16,185,129,0.15)]",
  rose: "border-rose-500/10 hover:border-rose-500/25 shadow-[0_0_15px_-5px_rgba(244,63,94,0.08)] hover:shadow-[0_0_25px_-8px_rgba(244,63,94,0.15)]",
  blue: "border-blue-500/10 hover:border-blue-500/25 shadow-[0_0_15px_-5px_rgba(59,130,246,0.08)] hover:shadow-[0_0_25px_-8px_rgba(59,130,246,0.15)]",
  amber:
    "border-amber-500/10 hover:border-amber-500/25 shadow-[0_0_15px_-5px_rgba(245,158,11,0.08)] hover:shadow-[0_0_25px_-8px_rgba(245,158,11,0.15)]",
  zinc: "border-white/5 hover:border-white/15 shadow-[0_0_15px_-5px_rgba(0,0,0,0.4)] hover:shadow-[0_0_25px_-8px_rgba(255,255,255,0.04)]",
};

export default function GlowCard({
  children,
  className,
  accent = "zinc",
  as: Tag = "div",
}: GlowCardProps) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border bg-[#0C0C0E]/80 backdrop-blur-sm transition-all duration-500",
        accentMap[accent] || accentMap.zinc,
        className
      )}
    >
      {children}
    </Tag>
  );
}
