"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DottedMapProps {
  className?: string;
  dotColor?: string;
  activeColor?: string;
}

// 18 rows x 38 columns representation of a simplified world map
const MAP_MATRIX = [
  "......................................",
  "..........####........................",
  "....####..#####......###########......",
  "..######..####.....##############.....",
  ".#######...........###############....",
  "########...........###############....",
  ".######............##############.....",
  "..####.............#############......",
  "...##....#.........############.......",
  "........###........###########........",
  ".......#####.......##########.........",
  ".......#####.......###...###..........",
  "......######.......##.....##..........",
  "......#####........#.......#..........",
  ".......###..................#.........",
  "........#..................###........",
  "...........................###........",
  "......................................"
];

// Nodes where signal updates originate (lat/lng mapped to grid cols/rows)
const ORACLE_NODES = [
  { name: "New York", col: 6, row: 5, color: "rose" },
  { name: "London", col: 18, row: 4, color: "emerald" },
  { name: "Tokyo", col: 33, row: 5, color: "rose" },
  { name: "Singapore", col: 28, row: 11, color: "emerald" },
  { name: "Frankfurt", col: 20, row: 4, color: "emerald" }
];

export const DottedMap = ({
  className,
  dotColor = "rgba(255, 255, 255, 0.05)",
  activeColor = "rgba(255, 255, 255, 0.25)"
}: DottedMapProps) => {
  const numRows = MAP_MATRIX.length;
  const numCols = MAP_MATRIX[0].length;

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center p-4", className)}>
      <svg
        viewBox={`0 0 ${numCols * 10} ${numRows * 10}`}
        className="w-full h-full max-h-[160px] opacity-80"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Draw the Dot Grid Map */}
        {MAP_MATRIX.map((rowString, rIdx) => {
          return rowString.split("").map((char, cIdx) => {
            const isLand = char === "#";
            const x = cIdx * 10 + 5;
            const y = rIdx * 10 + 5;

            return (
              <circle
                key={`${rIdx}-${cIdx}`}
                cx={x}
                cy={y}
                r={isLand ? 1.4 : 0.8}
                fill={isLand ? activeColor : dotColor}
                className={cn(
                  "transition-all duration-300",
                  isLand ? "hover:fill-emerald-450 hover:r-2" : "hover:fill-zinc-700"
                )}
              />
            );
          });
        })}

        {/* Draw Oracle Nodes (Pulsing Targets) */}
        {ORACLE_NODES.map((node, index) => {
          const x = node.col * 10 + 5;
          const y = node.row * 10 + 5;
          const isEmerald = node.color === "emerald";

          return (
            <g key={`oracle-${index}`} className="cursor-pointer">
              {/* Outer pulsing ring */}
              <circle cx={x} cy={y} r="5" fill="none" stroke={isEmerald ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)"} strokeWidth="1">
                <animate
                  attributeName="r"
                  values="2;8;2"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${index * 0.5}s`}
                />
                <animate
                  attributeName="opacity"
                  values="1;0;1"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${index * 0.5}s`}
                />
              </circle>

              {/* Inner core */}
              <circle
                cx={x}
                cy={y}
                r="1.8"
                fill={isEmerald ? "rgb(16, 185, 129)" : "rgb(244, 63, 94)"}
                className="filter drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
