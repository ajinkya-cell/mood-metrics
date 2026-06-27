"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedList = React.memo(
  ({ className, children, delay = 1500 }: AnimatedListProps) => {
    const [index, setIndex] = useState(0);
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children],
    );

    useEffect(() => {
      if (childrenArray.length === 0) return;
      const interval = setInterval(() => {
        setIndex((prevIndex) => (prevIndex + 1) % (childrenArray.length + 1));
      }, delay);

      return () => clearInterval(interval);
    }, [childrenArray.length, delay]);

    const visibleItems = useMemo(() => {
      const showCount = index === 0 ? 1 : index;
      return childrenArray.slice(0, showCount).reverse();
    }, [childrenArray, index]);

    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <AnimatePresence>
          {visibleItems.map((item, idx) => (
            <motion.div
              layout
              initial={{ scale: 0.8, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              key={(item as React.ReactElement).key || idx}
              className="w-full"
            >
              {item}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  },
);

AnimatedList.displayName = "AnimatedList";

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
