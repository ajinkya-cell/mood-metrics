"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import ObsidianDotGrid from "./components/ObsidianDotGrid";
import {
  RecordsPreview,
  BlendPreview,
  BacktestPreview,
  PlaybackPreview,
  WhalePreview,
  CorrelationPreview,
  IngestionPreview,
  NarrativesPreview,
} from "./components/ToolPreviews";
import { PageShell, Hatch, Reveal, SectionHeading } from "./components/editorial";
import CryptoGlobe from "./components/CryptoGlobe";
import MatrixRain from "./components/MatrixRain";

export default function LandingPage() {
  return (
    <PageShell>
      {/* ── HERO ── */}
      <section className="relative isolate px-5 md:px-8 pt-14 md:pt-20 pb-12 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-10 items-center">
        {/* Very faint falling glyphs, hero only, faded out toward every edge */}
        <MatrixRain className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-40 [mask-image:radial-gradient(ellipse_70%_65%_at_60%_45%,black_15%,transparent_95%)]" />
        <div className="ed-rise relative z-10">
          <p className="ed-micro">AI sentiment engine · BTC · ETH · SOL</p>
          <h1 className="ed-display text-[3.4rem] sm:text-7xl md:text-[5.6rem] mt-5">
            <span className="sr-only">MoodMetrics: </span>
            Map every crypto
            <br />
            <span className="ed-accent">sentiment</span>, today.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed tracking-[0.01em] text-[var(--ed-fg-70)]">
            Reddit threads, news, funding rates and fear &amp; greed, read by AI and blended into one honest number for each coin.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {/* Primary pill with a white arrow knob */}
            <Link
              href="/dashboard"
              className="group ed-press inline-flex items-center gap-4 rounded-full bg-[#1a1a1c] shadow-[0_0_0_1px_var(--ed-border)] hover:bg-[#222225] pl-6 pr-1.5 py-1.5 text-[15px] font-medium text-white transition-colors duration-300"
            >
              Launch dashboard
              <span className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center">
                <ArrowRight size={15} weight="bold" className="-rotate-45 group-hover:rotate-0 transition-transform duration-300" />
              </span>
            </Link>
            <Link href="/methodology" className="ed-chip ed-press px-5 py-3 text-[14px] font-medium text-white">
              How it works
            </Link>
          </div>
        </div>

        {/* Global flow: dotted Earth with coins in orbit, straight on the page (no card) */}
        <div className="ed-rise relative z-10" style={{ "--ed-delay": "0.1s" } as React.CSSProperties}>
          <CryptoGlobe className="relative aspect-[5/4] lg:-mr-4" />
        </div>
      </section>

      <Hatch />

      {/* ── STATEMENT ── */}
      <section className="px-5 md:px-8 py-16 md:py-24">
        <Reveal>
          <p className="ed-eyebrow text-center">The idea</p>
          <p
            className="ed-display text-[2.1rem] md:text-[3.1rem] text-center text-balance text-[var(--ed-fg-90)] max-w-3xl mx-auto mt-5 leading-[1.15] tracking-[0.01em]"
            style={{ fontFamily: "var(--font-reenie-beanie), cursive" }}
          >
            An AI engine that reads social consensus, whale flows and the news, and turns them into simple visual{" "}
            <span className="ed-accent">indexes</span>.
          </p>
        </Reveal>
      </section>

      <Hatch />

      {/* ── TOOLS ── */}
      <SectionHeading
        eyebrow="System matrix"
        lead="De-noise crowds,"
        accent="map momentum"
        aside="Eight instruments, one data pipeline. Every number on the site traces back to an AI-scored post."
      />
      <section className="px-4 md:px-5 pb-5 grid grid-cols-1 md:grid-cols-4 gap-3 auto-rows-[minmax(17rem,auto)]">
        <ToolCard href="/records" index="01" eyebrow="Records" title="AI records matrix" className="md:row-span-2" delay={0}
          description="Every post the model has read, with its verdict and score.">
          <RecordsPreview />
        </ToolCard>

        <ToolCard href="/dashboard" index="02" eyebrow="Dashboard" title="Blended sentiment cockpit" className="md:col-span-2" delay={0.05}
          description="Social threads, news, funding and fear & greed, weighted into one number.">
          <BlendPreview />
        </ToolCard>

        <ToolCard href="/backtester" index="03" eyebrow="Backtest" title="Strategy backtester" delay={0.1}
          description="Contrarian rules against spot price, compared to holding.">
          <BacktestPreview />
        </ToolCard>

        <ToolCard href="/advanced?tab=playback" index="04" eyebrow="Playback" title="Historical playback" delay={0.15}
          description="Replay any day hour by hour: price, leverage and the AI's feed.">
          <PlaybackPreview />
        </ToolCard>

        <ToolCard href="/advanced?tab=crossovers" index="05" eyebrow="Whales" title="Whale crossover skew" className="md:col-span-2" delay={0.2}
          description="Institutional flows against retail mood, to catch the moments they split.">
          <WhalePreview />
        </ToolCard>

        <ToolCard href="/advanced?tab=correlation" index="06" eyebrow="Correlation" title="Pearson lag" delay={0.25}
          description="Does sentiment lead price? Correlation at every hourly lag.">
          <CorrelationPreview />
        </ToolCard>

        <ToolCard index="07" eyebrow="Network" title="Global ingestion" className="md:col-span-2" delay={0.3}
          description="Subreddits, newsrooms and Binance perps, synchronised into one pipeline.">
          <IngestionPreview />
        </ToolCard>

        <ToolCard href="/advanced?tab=clouds" index="08" eyebrow="Narratives" title="AI narrative clouds" delay={0.35}
          description="Posts embedded and clustered, so the stories driving the mood stand out.">
          <NarrativesPreview />
        </ToolCard>
      </section>

      <Hatch />

      {/* ── GUESTBOOK ── */}
      <SectionHeading
        eyebrow="Visitor board"
        lead="Let me know"
        accent="you were here"
        aside="Leave a greeting, feedback or praise. Your note pins itself to the network grid."
      />
      <section className="px-4 md:px-5 pb-5">
        <ObsidianDotGrid />
      </section>
    </PageShell>
  );
}

// Bento tool card: numbered eyebrow, title, copy, optional visual; a round
// glass arrow rises in on hover when the card links somewhere
function ToolCard({
  href,
  index,
  eyebrow,
  title,
  description,
  className = "",
  delay = 0,
  children,
}: {
  href?: string;
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
  delay?: number;
  children?: React.ReactNode;
}) {
  const body = (
    <div className="ed-bento group h-full p-6 flex flex-col">
      <div className="relative z-10">
        <p className="ed-eyebrow">
          {index} · {eyebrow}
        </p>
        <h3 className="mt-3 text-[1.25rem] leading-[1.375] font-medium tracking-[-0.025em] text-[var(--ed-fg-90)]">{title}</h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--ed-fg-55)] max-w-sm">{description}</p>
      </div>
      {children && <div className="relative z-10 mt-6 flex flex-1 items-end">{children}</div>}
      {href && (
        <span className="ed-chip absolute right-5 top-5 z-10 w-[34px] h-[34px] flex items-center justify-center text-white opacity-0 -translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <ArrowUpRight size={14} weight="bold" />
        </span>
      )}
    </div>
  );

  return (
    <Reveal delay={delay} className={className}>
      {href ? (
        <Link href={href} className="block h-full ed-press">
          {body}
        </Link>
      ) : (
        body
      )}
    </Reveal>
  );
}
