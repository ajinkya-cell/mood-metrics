"use client";

import React, { useState, useEffect } from "react";
import {
  Heart,
  User,
  Warning,
  Coins,
  Cpu,
  Chats,
  CheckCircle,
  ArrowUpRight,
} from "@phosphor-icons/react";
import { FaGithub, FaEnvelope, FaGlobe } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import SectionEyebrow from "../components/SectionEyebrow";
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
    <div className="w-full max-w-7xl pt-25 mx-auto px-6 py-12 pb-20">
      {/* Page Header */}
      <div className="mb-12 border-b border-white/5 pb-8">
        <SectionEyebrow icon={<Heart size={12} className="text-emerald-400" />}>
          BUILDER JOURNAL
        </SectionEyebrow>
        <h1 className="text-4xl font-extrabold tracking-tight text-white font-sans mt-2">
          Developer Profile & Support
        </h1>
        <p className="text-zinc-500 text-sm mt-2 max-w-3xl font-sans leading-relaxed">
          Inside the mechanics of MoodMetrics: a solo engineering endeavor targeting market sentiment analysis. Learn about our developer story, project bottlenecks, safety disclaimers, and how to connect.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* LEFT COLUMN: Sticky Outline */}
        <aside className="lg:col-span-3 sticky top-28 hidden lg:flex flex-col gap-4 border-r border-white/5 pr-6">
          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest font-mono">
            BUILDER OUTLINE
          </span>
          <nav className="flex flex-col gap-2 font-mono text-xs">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`text-left py-1.5 px-3 rounded transition-all ${
                  activeSection === section.id
                    ? "bg-white/5 border border-white/10 text-white font-bold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* RIGHT COLUMN: Document Article */}
        <main className="lg:col-span-9 text-zinc-300 font-sans text-sm md:text-base leading-relaxed max-w-3xl space-y-16">
          {/* Section 1: About the Developer */}
          <section id="developer" className="scroll-mt-28 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
              <User size={20} className="text-emerald-400" />
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
            <h2 className="text-2xl md:text-3xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
              <Warning size={20} className="text-rose-400" />
              2. Project Disclaimers
            </h2>
            <div className="space-y-4">
              <div className="bg-rose-950/15 border border-rose-500/20 p-5 rounded-2xl space-y-3">
                <span className="text-rose-400 font-mono text-xs font-bold uppercase tracking-wider block">
                  CRITICAL FINANCIAL & EXPERIMENTAL NOTICE
                </span>
                <p className="text-rose-200 font-sans text-sm font-semibold leading-relaxed">
                  "This is an experimental data aggregation project for informational purposes only. It is not financial advice."
                </p>
              </div>
              <p>
                MoodMetrics is currently in an active testing and experimental phase. The analytics displayed are aggregated from public platforms and generated dynamically using machine learning models. As such, these indicators are subject to several inherent risks:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-400 text-xs">
                <li>
                  <strong className="text-zinc-300">Model Misinterpretation:</strong> Natural Language Processing (NLP) classifiers are probabilistic. Sarcasm, double negatives, crypto slang, and emojis are occasionally misinterpreted by AI, leading to skewed sentiment scores.
                </li>
                <li>
                  <strong className="text-zinc-300">API Latency:</strong> Ingestion pipelines run on scheduled intervals. Due to network delays or source throttling, data displayed on the dashboard can lag behind real-time spot market movements.
                </li>
                <li>
                  <strong className="text-zinc-300">Historical Discrepancy:</strong> Backtesting metrics are simulated and do not account for trading slippage, trading fees, exchange liquidations, or execution delays in real market environments.
                </li>
                <li>
                  <strong className="text-zinc-300">No Official Affiliation:</strong> MoodMetrics is an independent quantitative research dashboard. It is not affiliated with, sponsored by, or endorsed by Reddit, CoinGecko, Binance, or any other third-party platform. All trademarks and brand names belong to their respective owners.
                </li>
                <li>
                  <strong className="text-zinc-300">Scraper Ethics & Cadence:</strong> All social and price ingestion engines operate under strict, conservative crawling intervals (e.g., 30-minute to 6-hour cycles). We respect robots.txt rules and API rate limit margins of host platforms to prevent service overload.
                </li>
              </ul>
              <p className="text-zinc-400 text-xs">
                Do not base your trading decisions or risk management models on this website. Always consult with a licensed financial advisor before deploying capital into digital assets.
              </p>
            </div>
          </section>

          {/* Section 3: Technical Bottlenecks */}
          <section id="bottlenecks" className="scroll-mt-28 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
              <Cpu size={20} className="text-emerald-400" />
              3. Current Bottlenecks & Limitations
            </h2>
            <p>
              Operating as an independent builder project introduces architectural trade-offs due to budget constraints. Here are the core bottlenecks that limit MoodMetrics in its current state:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <GlowCard accent="rose" className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                  <FaXTwitter size={18} />
                  <span>No X/Twitter Developer Feed</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Real-time crypto narratives originate and spread on Twitter/X. However, the X developer platform charges $100/mo for a highly constrained sandbox and climbs rapidly to $5,000/mo for full quantitative endpoints. This financial barrier makes it impossible to ingest X posts, leaving a significant blind spot in social analytics.
                </p>
              </GlowCard>

              <GlowCard accent="rose" className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <Coins size={18} />
                  <span>CoinGecko Rate Limiting</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  To track market data, we run queries against CoinGecko&apos;s public API tier. This tier is heavily throttled and rate-limited. During intense periods of volatility, calls to update tokens may be skipped or delayed, resulting in temporary cache staleness on the dashboard.
                </p>
              </GlowCard>

              <GlowCard accent="rose" className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                  <Cpu size={18} />
                  <span>Lightweight Model Reasoning</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  To keep inference costs manageable, text batches are evaluated using a smaller model (Llama 3.1 8B). While highly efficient, this model can struggle to contextualize deep macroeconomic news, complex financial sarcasm, or long-form reddit essays compared to larger enterprise systems like Llama 70B/405B.
                </p>
              </GlowCard>

              <GlowCard accent="rose" className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                  <CheckCircle size={18} />
                  <span>Database Connection Ceilings</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Under heavy ingestion schedules, parallel background scraping functions spawn multiple database calls simultaneously. Because we utilize serverless database connections, we occasionally hit maximum pooled connection limits, requiring requests to wait and delaying data updates.
                </p>
              </GlowCard>
            </div>
          </section>

          {/* Section 4: Reach Out & Support */}
          <section id="support" className="scroll-mt-28 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
              <Chats size={20} className="text-emerald-400" />
              4. Reach Out & Support
            </h2>
            <div className="space-y-4">
              <p>
                Since I have removed the simulation widget for coffees, the best way to support the development of MoodMetrics is by providing feedback, sharing your quantitative strategies, contributing code, or sponsoring high-tier API access.
              </p>
              <p className="text-zinc-400 text-xs">
                Feel free to connect or reach out regarding questions, feature requests, partnership opportunities, or technical collaborations:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <a
                  href="https://github.com/ajinkya-cell/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <GlowCard className="p-4 flex items-start gap-3 hover:bg-zinc-950 transition-colors">
                    <FaGithub size={24} className="text-zinc-400 group-hover:text-white transition-colors" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-white font-mono">
                        GitHub <ArrowUpRight size={10} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-zinc-500 text-[11px] leading-snug">
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
                  <GlowCard className="p-4 flex items-start gap-3 hover:bg-zinc-950 transition-colors">
                    <FaXTwitter size={24} className="text-sky-400 group-hover:text-sky-300 transition-colors" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-white font-mono">
                        X / Twitter <ArrowUpRight size={10} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-zinc-500 text-[11px] leading-snug">
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
                  <GlowCard className="p-4 flex items-start gap-3 hover:bg-zinc-950 transition-colors">
                    <FaGlobe size={24} className="text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-white font-mono">
                        Portfolio <ArrowUpRight size={10} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-zinc-500 text-[11px] leading-snug">
                        Explore more of my projects, writings, and experiments.
                      </p>
                    </div>
                  </GlowCard>
                </a>

                <a
                  href="mailto:ajinkyadharkar88@gmail.com"
                  className="group block"
                >
                  <GlowCard className="p-4 flex items-start gap-3 hover:bg-zinc-950 transition-colors">
                    <FaEnvelope size={24} className="text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-white font-mono">
                        Email Inquiry <ArrowUpRight size={10} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-zinc-500 text-[11px] leading-snug">
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
    </div>
  );
}
