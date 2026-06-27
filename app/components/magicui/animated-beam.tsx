"use client";

import { useEffect, useState, RefObject } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface AnimatedBeamProps {
  className?: string;
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  duration?: number;
  delay?: number;
}

export const AnimatedBeam = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  pathColor = "rgba(255, 255, 255, 0.1)",
  pathWidth = 1.5,
  pathOpacity = 0.6,
  gradientStartColor = "#3b82f6", // Blue
  gradientStopColor = "#10b981",  // Emerald
  duration = 3,
  delay = 0,
}: AnimatedBeamProps) => {
  const [pathD, setPathD] = useState("");

  useEffect(() => {
    const updatePath = () => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      const fromRect = fromRef.current?.getBoundingClientRect();
      const toRect = toRef.current?.getBoundingClientRect();

      if (containerRect && fromRect && toRect) {
        const startX = fromRect.left - containerRect.left + fromRect.width / 2;
        const startY = fromRect.top - containerRect.top + fromRect.height / 2;
        const endX = toRect.left - containerRect.left + toRect.width / 2;
        const endY = toRect.top - containerRect.top + toRect.height / 2;

        const controlY = startY - curvature;
        const controlX = (startX + endX) / 2;

        const d = `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`;
        setPathD(d);
      }
    };

    updatePath();

    const resizeObserver = new ResizeObserver(() => updatePath());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updatePath);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePath);
    };
  }, [containerRef, fromRef, toRef, curvature]);

  const id = `beam-grad-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 size-full stroke-2", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <motion.path
        d={pathD}
        stroke={`url(#${id})`}
        strokeWidth={pathWidth + 0.5}
        strokeLinecap="round"
        initial={{ strokeDasharray: "10 100", strokeDashoffset: reverse ? 110 : 0 }}
        animate={{
          strokeDashoffset: reverse ? 0 : 110,
        }}
        transition={{
          repeat: Infinity,
          duration,
          delay,
          ease: "linear",
        }}
      />
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0" />
          <stop offset="50%" stopColor={gradientStartColor} stopOpacity="1" />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};
