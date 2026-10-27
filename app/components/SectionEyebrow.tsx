import React from "react";
import { cn } from "@/lib/utils";

interface SectionEyebrowProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

// Editorial eyebrow: colour-key square (or icon) + tracked uppercase label
export default function SectionEyebrow({
  children,
  className,
  icon,
}: SectionEyebrowProps) {
  return (
    <div className={cn("ed-eyebrow inline-flex items-center gap-2", className)}>
      {icon ? icon : <span className="ed-square bg-emerald-400" />}
      <span>{children}</span>
    </div>
  );
}
