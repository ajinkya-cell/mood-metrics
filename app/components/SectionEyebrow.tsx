import React from "react";
import { cn } from "@/lib/utils";

type SectionEyebrowProps = {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
};

export default function SectionEyebrow({
  children,
  className,
  icon,
}: SectionEyebrowProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-[#0C0C0E] text-[11px] uppercase tracking-[0.2em] font-mono text-zinc-500 font-bold mb-5",
        className
      )}
    >
      {icon}
      {children}
    </div>
  );
}
