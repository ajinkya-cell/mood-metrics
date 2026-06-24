import React from "react";
import { cn } from "@/lib/utils";

type HorizontalScaleProps = {
  className?: string;
  pattern?: string;
};

export default function HorizontalScale({
  className,
  pattern = "rgba(255,255,255,0.06)",
}: HorizontalScaleProps) {
  return (
    <div
      className={cn(
        "horizontal-scale h-12 w-full bg-[repeating-linear-gradient(315deg,var(--pattern)_0,var(--pattern)_1px,transparent_1px,transparent_50%)] border-y border-[var(--pattern)] bg-[size:12px_12px]",
        className
      )}
      style={{ "--pattern": pattern } as React.CSSProperties}
    />
  );
}
