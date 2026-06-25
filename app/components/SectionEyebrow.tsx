import React from "react";
import { cn } from "@/lib/utils";

interface SectionEyebrowProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export default function SectionEyebrow({
  children,
  className,
  icon,
}: SectionEyebrowProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-[#0C0C0E] text-[11px] uppercase tracking-[0.2em] font-mono text-zinc-500 font-bold",
        className
      )}
    >
      {icon ? (
        icon
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_1.5s_ease-in-out_infinite]" />
      )}
      <span>{children}</span>
    </div>
  );
}
