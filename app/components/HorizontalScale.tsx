import React from "react";
import { cn } from "@/lib/utils";

interface HorizontalScaleProps {
  className?: string;
}

export default function HorizontalScale({ className }: HorizontalScaleProps) {
  return (
    <div
      className={cn(
        "h-10 w-full bg-[repeating-linear-gradient(315deg,var(--pattern)_0,var(--pattern)_1px,transparent_1px,transparent_50%)] border-y border-[var(--pattern)] bg-[size:10px_10px]",
        className
      )}
    />
  );
}
