"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AvatarCirclesProps {
  className?: string;
  numPeople?: number;
  avatarUrls: string[];
}

export const AvatarCircles = ({
  className,
  numPeople,
  avatarUrls,
}: AvatarCirclesProps) => {
  return (
    <div className={cn("z-10 flex -space-x-3.5 rtl:space-x-reverse", className)}>
      {avatarUrls.map((url, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          className="h-8 w-8 rounded-full border-2 border-zinc-950 object-cover bg-zinc-900"
          src={url}
          alt={`Monitored Wallet Avatar ${index + 1}`}
          width={32}
          height={32}
        />
      ))}
      {numPeople !== undefined && numPeople > 0 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-950 bg-zinc-900 text-center text-[10px] font-mono font-medium text-zinc-300">
          +{numPeople}
        </div>
      )}
    </div>
  );
};
