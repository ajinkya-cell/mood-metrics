import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("grid w-full grid-cols-1 md:grid-cols-4 gap-6", className)}>
      {children}
    </div>
  );
};

export const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  children,
}: {
  name?: string;
  className?: string;
  background?: ReactNode;
  Icon?: React.ComponentType<{ className?: string; size?: number }>;
  description?: string;
  href?: string;
  cta?: string;
  children?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 transition-all duration-300",
        className
      )}
    >
      {background && <div className="absolute inset-0 z-0">{background}</div>}
      <div className="relative z-10 flex flex-col justify-between h-full">
        {children || (
          <>
            <div>
              {Icon && <Icon className="text-zinc-400 mb-3 group-hover:scale-105 transition-all duration-300" size={24} />}
              {name && <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-1.5">{name}</h3>}
              {description && <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">{description}</p>}
            </div>
            {href && cta && (
              <span className="text-[10px] text-zinc-450 font-mono mt-4 flex items-center gap-1 group-hover:text-white transition-colors">
                {cta}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
