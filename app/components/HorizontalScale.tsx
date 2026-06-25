import React from "react";
import { cn } from "@/lib/utils";

interface HorizontalScaleProps {
  className?: string;
  pattern?: string;
}

export default function HorizontalScale({ className, pattern }: HorizontalScaleProps) {
  const customPattern = pattern || "var(--pattern, rgba(255, 255, 255, 0.06))";
  
  return (
    <div
      className={cn(
        "h-12 w-full border-y border-white/5",
        className
      )}
      style={{
        backgroundImage: `repeating-linear-gradient(315deg, ${customPattern} 0, ${customPattern} 1px, transparent 1px, transparent 12px)`,
        backgroundSize: "12px 12px"
      }}
    />
  );
}
