import React from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  accent?: "emerald" | "rose" | "zinc";
  as?: "div" | "section" | "article";
}

export default function GlowCard({
  children,
  className,
  accent = "zinc",
  as = "div",
}: GlowCardProps) {
  const Component = as;

  const accentStyles = {
    emerald: "shadow-[0_0_20px_-8px_var(--glow-emerald)] border-emerald-500/10 hover:border-emerald-500/20 hover:shadow-[0_0_30px_-5px_var(--glow-emerald)]",
    rose: "shadow-[0_0_20px_-8px_var(--glow-rose)] border-rose-500/10 hover:border-rose-500/20 hover:shadow-[0_0_30px_-5px_var(--glow-rose)]",
    zinc: "shadow-[0_0_15px_-8px_var(--glow-white)] border-white/5 hover:border-white/10 hover:shadow-[0_0_25px_-5px_var(--glow-white)]",
  };

  return (
    <Component
      className={cn(
        "rounded-2xl border bg-[#0C0C0E]/80 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        accentStyles[accent],
        className
      )}
    >
      {children}
    </Component>
  );
}
