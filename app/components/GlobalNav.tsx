"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { GithubLogo, XLogo, List, X } from "@phosphor-icons/react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/records", label: "Records" },
  { href: "/backtester", label: "Backtest" },
  { href: "/advanced", label: "Tools" },
  { href: "/methodology", label: "How it works" },
  { href: "/support", label: "Support" },
];

const SPRING = { type: "spring", stiffness: 500, damping: 35, mass: 0.6 } as const;

export default function GlobalNav() {
  const pathname = usePathname();
  // The menu remembers the page it was opened on, so any navigation closes it
  const [openOnPath, setOpenOnPath] = useState<string | null>(null);
  const isOpen = openOnPath === pathname;
  const setIsOpen = (open: boolean) => setOpenOnPath(open ? pathname : null);
  const [hovered, setHovered] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenOnPath(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenOnPath(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const activeHref = NAV_LINKS.find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))?.href ?? null;
  // The indicator sits under the hovered link, else the current page
  const indicatorHref = hovered ?? activeHref;

  return (
    <header className="fixed top-0 z-50 w-full px-4 pt-[18px] pb-2 font-grotesk">
      <div ref={navRef} className="relative max-w-4xl mx-auto">
        <div className="ed-glass flex items-center justify-between pl-4 pr-1.5 py-1.5">
          <Link href="/" className="ed-press flex items-center shrink-0" aria-label="MoodMetrics home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-moody.png" alt="MoodMetrics" className="h-7 w-auto object-contain" />
          </Link>

          {/* Desktop links with a sliding glass indicator */}
          <nav className="hidden lg:flex items-center" onMouseLeave={() => setHovered(null)}>
            {NAV_LINKS.map((link) => {
              const lit = indicatorHref === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHovered(link.href)}
                  aria-current={activeHref === link.href ? "page" : undefined}
                  className={`relative ed-press px-[15px] py-[7px] rounded-full text-[13.5px] font-medium transition-colors duration-150 ${
                    lit ? "text-white" : "text-[var(--ed-fg-65)]"
                  }`}
                >
                  {lit && (
                    <motion.span
                      layoutId="navIndicator"
                      className="ed-chip absolute inset-0"
                      animate={{ opacity: hovered && hovered !== activeHref ? 0.85 : 1 }}
                      transition={SPRING}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5">
            <a
              href="https://github.com/ajinkya-cell/"
              target="_blank"
              rel="noopener noreferrer"
              className="ed-press p-2 rounded-full text-[var(--ed-fg-55)] hover:text-white transition-colors duration-150"
              aria-label="GitHub"
            >
              <GithubLogo size={17} weight="fill" />
            </a>
            <a
              href="https://x.com/ajinkyacell"
              target="_blank"
              rel="noopener noreferrer"
              className="ed-press p-2 rounded-full text-[var(--ed-fg-55)] hover:text-white transition-colors duration-150"
              aria-label="X (formerly Twitter)"
            >
              <XLogo size={16} weight="bold" />
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden ed-chip ed-press ml-1 p-2 text-white cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={16} /> : <List size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu — glass panel that blurs in */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="lg:hidden ed-glass rounded-[18px] absolute top-full left-0 right-0 mt-2 p-2 z-50 flex flex-col"
            >
              {NAV_LINKS.map((link) => {
                const isActive = activeHref === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`ed-press flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[15px] font-medium transition-colors duration-150 ${
                      isActive ? "bg-white/[0.08] text-white" : "text-[var(--ed-fg-70)] hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {link.label}
                    {isActive && <span className="ed-square bg-[var(--ed-blue-label)]" />}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
