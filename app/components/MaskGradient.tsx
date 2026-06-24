import React from "react";
import { cn } from "@/lib/utils";

type MaskGradientProps = {
  children: React.ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
};

export default function MaskGradient({
  children,
  className,
  from = "from-white",
  via = "via-zinc-300",
  to = "to-zinc-500",
  as: Tag = "span",
}: MaskGradientProps) {
  return (
    <Tag
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        from,
        via,
        to,
        className
      )}
    >
      {children}
    </Tag>
  );
}
