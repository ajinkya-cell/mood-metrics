"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Bug, GlobeSimple, Lightbulb } from "@phosphor-icons/react";
import { FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/records", label: "AI records" },
      { href: "/backtester", label: "Backtest" },
      { href: "/advanced", label: "Advanced tools" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { href: "/methodology", label: "How it works" },
      { href: "/support", label: "Support" },
    ],
  },
];

const SOCIAL_LINKS = [
  { href: "https://github.com/ajinkya-cell/", label: "GitHub", icon: FaGithub },
  { href: "https://x.com/ajinkyacell", label: "Twitter", icon: FaXTwitter },
  { href: "https://ajinkya-cell.vercel.app/", label: "Portfolio", icon: GlobeSimple },
];

const WORDMARK = "MoodMetrics";

export default function GlobalFooter() {
  return (
    <footer className="w-full font-grotesk bg-[var(--ed-page)]">
      <div className="max-w-7xl mx-auto ed-frame">
        <div className="ed-hatch" aria-hidden />

        <div className="px-5 md:px-8 pt-14 pb-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          {/* Creator note */}
          <div>
            <p className="ed-eyebrow">Creator</p>
            <h2 className="ed-display text-4xl md:text-5xl mt-3">
              Built by <span className="ed-accent">Ajinkya</span>
            </h2>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-[var(--ed-fg-70)]">
              Thanks for stopping by! I&apos;m a developer who enjoys learning by building. This website is entirely my own work, from the
              design and development to the small details behind the scenes. I&apos;m always experimenting with new technologies,
              especially in AI and web development, and using each project to grow as an engineer.
            </p>
            <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-[var(--ed-fg-55)]">
              If you enjoyed this project, I&apos;d love to connect. You can also explore more of my work through the links below.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-chip ed-press inline-flex items-center gap-2 px-4 py-2 text-[13.5px] font-medium text-white"
                >
                  <Icon size={14} />
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 lg:pt-1">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="ed-micro text-[var(--ed-fg-50)]">{col.heading}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 text-[16px] text-[var(--ed-fg-70)] hover:text-white transition-colors duration-150"
                      >
                        {link.label}
                        <ArrowUpRight
                          size={12}
                          className="text-[var(--ed-fg-30)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-2 pt-2">
              <p className="ed-micro text-[var(--ed-fg-50)]">Coverage</p>
              <p className="mt-3 text-[15px] text-[var(--ed-fg-70)]">BTC · ETH · SOL — hourly news, Reddit every 6h.</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-5 md:px-8 py-5 border-t border-[var(--ed-border)] flex flex-wrap items-center justify-between gap-3 text-[13px] text-[var(--ed-fg-50)]">
          <span>© {new Date().getFullYear()} MoodMetrics · Not financial advice</span>
          <div className="flex items-center gap-4">
            <a
              href="mailto:ajinkya@example.com?subject=MoodMetrics%20bug%20report"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors duration-150"
            >
              <Bug size={13} />
              Report bug
            </a>
            <a
              href="mailto:ajinkya@example.com?subject=MoodMetrics%20suggestion"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors duration-150"
            >
              <Lightbulb size={13} />
              Suggest
            </a>
          </div>
        </div>

        {/* Giant hatched wordmark, letters rise in */}
        <div className="ed-wordmark-wrap px-3 md:px-6 -mb-[0.18em] select-none" aria-hidden>
          <div className="ed-wordmark text-center">
            {WORDMARK.split("").map((ch, i) => (
              <span key={i} className="ch" style={{ "--i": i } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
