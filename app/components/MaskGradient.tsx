import React from "react";
import { cn } from "@/lib/utils";

interface MaskGradientProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}

export default function MaskGradient({
  children,
  className,
  from = "from-white",
  via = "via-zinc-300",
  to = "to-zinc-500",
  as = "span",
}: MaskGradientProps) {
  const Component = as;

  return (
    <Component
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        from,
        via,
        to,
        className
      )}
    >
      {children}
    </Component>
  );
}
