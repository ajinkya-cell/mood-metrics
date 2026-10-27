"use client";

import React, { useState, useEffect } from "react";
import {
  Coins,
  Cpu,
  CheckCircle,
  ArrowUpRight,
} from "@phosphor-icons/react";
import { FaGithub, FaEnvelope, FaGlobe } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { PageShell, PageHero, Hatch } from "../components/editorial";
import GlowCard from "../components/GlowCard";

const SECTIONS = [
  { id: "developer", label: "1. About the Developer" },
  { id: "disclaimers", label: "2. Project Disclaimers" },
  { id: "bottlenecks", label: "3. Technical Bottlenecks" },
  { id: "support", label: "4. Reach Out & Support" },
];

export default function SupportPage() {
  const [activeSection, setActiveSection] = useState<string>("developer");

  // Highlight active TOC item on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const section of SECTIONS) {
        const element = document.getElementById(section.id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.offsetTop - 100;
      window.scrollTo({
        top: top,
        behavior: "smooth",
      });
      setActiveSection(id);
    }
  };

  return (
    <PageShell>
      <PageHero
        micro="Builder journal · Support"
        lead="Built"
        accent="solo"
        tail=", in the open."
        description="MoodMetrics is a one-person project. Here is who builds it, what it can and can't tell you, where it's limited today, and how to get in touch."
      />
      <Hatch />

      <div className="px-5 md:px-8 pt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* LEFT COLUMN: Sticky Outline */}
        <aside className="lg:col-span-3 sticky top-28 hidden lg:flex flex-col gap-4">
          <span className="ed-micro">On this page</span>
          <nav className="flex flex-col gap-0.5 text-[14px]">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`ed-press flex items-center gap-2.5 text-left py-1.5 cursor-pointer transition-colors duration-300 ${
                  activeSection === section.id ? "text-white" : "text-[var(--ed-fg-55)] hover:text-[var(--ed-fg-90)]"
                }`}
              >
                <span
                  className={`ed-square transition-colors duration-300 ${
                    activeSection === section.id ? "bg-[var(--ed-blue-label)]" : "shadow-[inset_0_0_0_1px_var(--ed-border)]"
                  }`}
                />
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* RIGHT COLUMN: Document Article */}
        <main className="lg:col-span-9 text-[var(--ed-fg-70)] text-[16px] leading-[1.7] tracking-[0.01em] max-w-3xl space-y-20">
          {/* Section 1: About the Developer */}
          <section id="developer" className="scroll-mt-28 space-y-6">
            <h2 className="ed-display text-4xl md:text-[2.75rem] text-white pb-4 border-b border-[var(--ed-border)]">
              1. About the Developer
            </h2>
            <div className="space-y-4">
              <p>
                Hi there, I&apos;m <strong>Ajinkya</strong>. MoodMetrics is a passion project conceived and built entirely by me. As a solo developer, I designed the infrastructure, developed the crawlers, established the Drizzle schemas, and built the visual analytics cockpit you see here.
              </p>
              <p>
                I am deeply interested in NLP applications in finance, especially how social sentiment can serve as a proxy for market momentum. Creating and keeping a platform like MoodMetrics active involves constant monitoring of data pipelines, rate-limiting hurdles, serverless connections, and model inference costs—all financed out of my own pocket.
              </p>
              <p>
                This isn&apos;t a venture-backed enterprise or a funded corporate initiative. It is a labor of love dedicated to building clean, quantitative sentiment dashboards for retail markets. Every update, feature rollout, and bug fix is coded, tested, and shipped in my spare hours.
              </p>
            </div>
          </section>

          {/* Section 2: Project Disclaimers */}
          <section id="disclaimers" className="scroll-mt-28 space-y-6">
            <h2 className="ed-display text-4xl md:text-[2.75rem] text-white pb-4 border-b border-[var(--ed-border)]">
              2. Project Disclaimers
            </h2>
            <div className="space-y-4">
              <div className="ed-bento p-6 space-y-3">
                <span className="ed-eyebrow flex items-center gap-2">
                  <span className="ed-square bg-rose-400" />
                  Financial &amp; experimental notice
                </span>
                <p className="ed-display text-2xl md:text-[1.9rem] text-white leading-[1.15]">
                  &ldquo;This is an experimental data aggregation project for informational purposes only. It is not financial advice.&rdquo;
                </p>
              </div>
              <p>
                MoodMetrics is currently in an active testing and experimental phase. The analytics displayed are aggregated from public platforms and generated dynamically using machine learning models. As such, these indicators are subject to several inherent risks:
              </p>
              <ul className="list-disc pl-5 space-y-3 marker:text-[var(--ed-fg-30)] text-[15px]">
                <li>
                  <strong className="text-[var(--ed-fg-90)] font-medium">Model Misinterpretation:</strong> Natural Language Processing (NLP) classifiers are probabilistic. Sarcasm, double negatives, crypto slang, and emojis are occasionally misinterpreted by AI, leading to skewed sentiment scores.
                </li>
                <li>
                  <strong className="text-[var(--ed-fg-90)] font-medium">API Latency:</strong> Ingestion pipelines run on scheduled intervals. Due to network delays or source throttling, data displayed on the dashboard can lag behind real-time spot market movements.
                </li>
                <li>
                  <strong className="text-[var(--ed-fg-90)] font-medium">Historical Discrepancy:</strong> Backtesting metrics are simulated and do not account for trading slippage, trading fees, exchange liquidations, or execution delays in real market environments.
                </li>
                <li>
                  <strong className="text-[var(--ed-fg-90)] font-medium">No Official Affiliation:</strong> MoodMetrics is an independent quantitative research dashboard. It is not affiliated with, sponsored by, or endorsed by Reddit, CoinGecko, Binance, or any other third-party platform. All trademarks and brand names belong to their respective owners.
                </li>
                <li>
                  <strong className="text-[var(--ed-fg-90)] font-medium">Scraper Ethics & Cadence:</strong> All social and price ingestion engines operate under strict, conservative crawling intervals (hourly to 6-hour cycles). We respect robots.txt rules and API rate limit margins of host platforms to prevent service overload.
                </li>
              </ul>
              <p className="text-[var(--ed-fg-55)] text-[15px]">
                Do not base your trading decisions or risk management models on this website. Always consult with a licensed financial advisor before deploying capital into digital assets.
              </p>
            </div>
          </section>

          {/* Section 3: Technical Bottlenecks */}
          <section id="bottlenecks" className="scroll-mt-28 space-y-6">
            <h2 className="ed-display text-4xl md:text-[2.75rem] text-white pb-4 border-b border-[var(--ed-border)]">
              3. Current Bottlenecks & Limitations
            </h2>
            <p>
              Operating as an independent builder project introduces architectural trade-offs due to budget constraints. Here are the core bottlenecks that limit MoodMetrics in its current state:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <GlowCard className="p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-[var(--ed-fg-90)] font-medium text-[17px] tracking-[-0.02em]">
                  <FaXTwitter size={18} />
                  <span>No X/Twitter Developer Feed</span>
                </div>
                <p className="text-[var(--ed-fg-55)] text-[14px] leading-relaxed">
                  Real-time crypto narratives originate and spread on Twitter/X. However, the X developer platform charges $100/mo for a highly constrained sandbox and climbs rapidly to $5,000/mo for full quantitative endpoints. This financial barrier makes it impossible to ingest X posts, leaving a significant blind spot in social analytics.
                </p>
              </GlowCard>

              <GlowCard className="p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-[var(--ed-fg-90)] font-medium text-[17px] tracking-[-0.02em]">
                  <Coins size={18} />
                  <span>CoinGecko Rate Limiting</span>
                </div>
                <p className="text-[var(--ed-fg-55)] text-[14px] leading-relaxed">
                  To track market data, we run queries against CoinGecko&apos;s public API tier. This tier is heavily throttled and rate-limited. During intense periods of volatility, calls to update tokens may be skipped or delayed, resulting in temporary cache staleness on the dashboard.
                </p>
              </GlowCard>

              <GlowCard className="p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-[var(--ed-fg-90)] font-medium text-[17px] tracking-[-0.02em]">
                  <Cpu size={18} />
                  <span>Lightweight Model Reasoning</span>
                </div>
                <p className="text-[var(--ed-fg-55)] text-[14px] leading-relaxed">
                  To keep inference costs manageable, text batches are evaluated using a small, fast model (Nemotron 3.5 Bolt on Nvidia NIM). While highly efficient, it can struggle to contextualize deep macroeconomic news, complex financial sarcasm, or long-form Reddit essays compared to much larger models.
                </p>
              </GlowCard>

              <GlowCard className="p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-[var(--ed-fg-90)] font-medium text-[17px] tracking-[-0.02em]">
                  <CheckCircle size={18} />
                  <span>Database Connection Ceilings</span>
                </div>
                <p className="text-[var(--ed-fg-55)] text-[14px] leading-relaxed">
                  Under heavy ingestion schedules, parallel background scraping functions spawn multiple database calls simultaneously. Because we utilize serverless database connections, we occasionally hit maximum pooled connection limits, requiring requests to wait and delaying data updates.
                </p>
              </GlowCard>
            </div>
          </section>

          {/* Section 4: Reach Out & Support */}
          <section id="support" className="scroll-mt-28 space-y-6">
            <h2 className="ed-display text-4xl md:text-[2.75rem] text-white pb-4 border-b border-[var(--ed-border)]">
              4. Reach Out & Support
            </h2>
            <div className="space-y-4">
              <p>
                Since I have removed the simulation widget for coffees, the best way to support the development of MoodMetrics is by providing feedback, sharing your quantitative strategies, contributing code, or sponsoring high-tier API access.
              </p>
              <p className="text-[var(--ed-fg-55)] text-[15px]">
                Feel free to connect or reach out regarding questions, feature requests, partnership opportunities, or technical collaborations:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <a
                  href="https://github.com/ajinkya-cell/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <GlowCard className="ed-press p-5 h-full flex items-start gap-3.5">
                    <FaGithub size={22} className="text-[var(--ed-fg-55)] group-hover:text-white transition-colors duration-300" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[15px] font-medium text-[var(--ed-fg-90)]">
                        GitHub <ArrowUpRight size={10} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[var(--ed-fg-55)] text-[13px] leading-snug">
                        Check source files, review Drizzle DB schemas, file issues, or open a pull request.
                      </p>
                    </div>
                  </GlowCard>
                </a>

                <a
                  href="https://x.com/ajinkyacell"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <GlowCard className="ed-press p-5 h-full flex items-start gap-3.5">
                    <FaXTwitter size={22} className="text-[var(--ed-fg-55)] group-hover:text-white transition-colors duration-300" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[15px] font-medium text-[var(--ed-fg-90)]">
                        X / Twitter <ArrowUpRight size={10} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[var(--ed-fg-55)] text-[13px] leading-snug">
                        Follow updates, join crypto-sentiment threads, or send a DM for fast communication.
                      </p>
                    </div>
                  </GlowCard>
                </a>

                <a
                  href="https://ajinkya-cell.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <GlowCard className="ed-press p-5 h-full flex items-start gap-3.5">
                    <FaGlobe size={22} className="text-[var(--ed-fg-55)] group-hover:text-white transition-colors duration-300" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[15px] font-medium text-[var(--ed-fg-90)]">
                        Portfolio <ArrowUpRight size={10} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[var(--ed-fg-55)] text-[13px] leading-snug">
                        Explore more of my projects, writings, and experiments.
                      </p>
                    </div>
                  </GlowCard>
                </a>

                <a
                  href="mailto:ajinkyadharkar88@gmail.com"
                  className="group block"
                >
                  <GlowCard className="ed-press p-5 h-full flex items-start gap-3.5">
                    <FaEnvelope size={22} className="text-[var(--ed-fg-55)] group-hover:text-white transition-colors duration-300" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[15px] font-medium text-[var(--ed-fg-90)]">
                        Email Inquiry <ArrowUpRight size={10} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[var(--ed-fg-55)] text-[13px] leading-snug">
                        Contact for institutional partnerships, API sponsorships, or business suggestions.
                      </p>
                    </div>
                  </GlowCard>
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </PageShell>
  );
}
