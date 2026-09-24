"use client";

import React from "react";
import BeveledCard, { FlareAccent } from "./BeveledCard";
import { cn } from "@/lib/utils";

type DoubleBezelProps = {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  flareAccent?: FlareAccent;
};

/**
 * DoubleBezel Layout Container
 * Updated with the tactile 3D bevel & prismatic top-border flare architecture.
 */
export default function DoubleBezel({
  children,
  className = "",
  innerClassName = "",
  flareAccent = "pearl",
}: DoubleBezelProps) {
  return (
    <BeveledCard
      variant="raised"
      flareAccent={flareAccent}
      className={cn("w-full", className, innerClassName)}
    >
      {children}
    </BeveledCard>
  );
}
