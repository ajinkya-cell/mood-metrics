"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Gauge,
  Database,
  TrendUp,
  Cpu,
  BookOpen,
  Heart,
  GithubLogo,
  XLogo,
  List,
  X,
} from "@phosphor-icons/react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/records", label: "Records", icon: Database },
  { href: "/backtester", label: "Backtest", icon: TrendUp },
  { href: "/advanced", label: "Tools", icon: Cpu },
  { href: "/methodology", label: "How It Works", icon: BookOpen },
  { href: "/support", label: "Support", icon: Heart },
];

export default function GlobalNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Auto-close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 z-50 w-full px-4 pt-4 pb-2">
      <div ref={navRef} className="relative max-w-4xl mx-auto">
        {/* Floating Capsule Pill */}
        <div className="flex items-center justify-between rounded-full border border-white/10 bg-[#0C0C0E]/80 backdrop-blur-xl px-5 py-2 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] transition-all duration-300">
          <Link href="/" className="flex items-center group transition-all duration-200">
            <img
              src="/logo-moody.png"
              alt="MoodMetrics Logo"
              className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-2">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-[13px] font-sans font-medium transition-all duration-200 ${
                    isActive
                      ? "text-white font-semibold bg-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon
                    size={14}
                    weight={isActive ? "fill" : "regular"}
                    className={isActive ? "text-emerald-400" : "text-zinc-400"}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Hamburger */}
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/ajinkya-cell/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/5 rounded-full flex items-center justify-center"
              aria-label="GitHub"
            >
              <GithubLogo size={18} weight="fill" />
            </a>
            <a
              href="https://x.com/ajinkyacell"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/5 rounded-full flex items-center justify-center"
              aria-label="X (formerly Twitter)"
            >
              <XLogo size={17} weight="bold" />
            </a>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer select-none"
              aria-label="Toggle Navigation Menu"
            >
              {isOpen ? <X size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden absolute top-full left-0 right-0 mt-2 p-2.5 rounded-2xl border border-white/10 bg-[#0C0C0E]/95 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.8)] z-50 flex flex-col gap-1"
            >
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-sans font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-white/10 text-white font-semibold"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        weight={isActive ? "fill" : "regular"}
                        className={isActive ? "text-emerald-400" : "text-zinc-400"}
                      />
                      <span>{link.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    )}
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
