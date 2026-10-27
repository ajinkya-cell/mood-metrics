"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  // Kept for API compatibility; the editorial system uses one hover accent (blue eyebrow)
  accent?: "emerald" | "rose" | "zinc";
  as?: "div" | "section" | "article";
  interactive?: boolean;
  onClick?: () => void;
}

// Editorial bento card: #131314 surface, 1px ring (ed-bento), darkens on hover
export default function GlowCard({
  children,
  className,
  as = "div",
  interactive = false,
  onClick,
}: GlowCardProps) {
  const Component = as;

  return (
    <Component
      onClick={onClick}
      className={cn("ed-bento", interactive && "ed-press cursor-pointer", className)}
    >
      {children}
    </Component>
  );
}
