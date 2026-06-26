"use client";

import React, { useState, useEffect } from "react";
import {
  Coffee,
  Heart,
  User,
  Warning,
  Coins,
  Cpu,
  TwitterLogo,
  CheckCircle,
  Spinner,
} from "@phosphor-icons/react";
import SectionEyebrow from "../components/SectionEyebrow";
import DoubleBezel from "../components/DoubleBezel";

const SECTIONS = [
  { id: "developer", label: "1. The Developer" },
  { id: "disclaimers", label: "2. Project Disclaimers" },
  { id: "bottlenecks", label: "3. Current Bottlenecks" },
  { id: "funding", label: "4. Funding Goals" },
  { id: "support", label: "5. Support the Mission" },
];

type Supporter = {
  name: string;
  coffees: number;
  message: string;
  timestamp: string;
};

export default function SupportPage() {
  const [activeSection, setActiveSection] = useState<string>("developer");
  const [coffeeCount, setCoffeeCount] = useState<number>(3);
  const [supporterName, setSupporterName] = useState<string>("Anonymous Quant");
  const [supporterMsg, setSupporterMsg] = useState<string>("Keep building the future!");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasSupported, setHasSupported] = useState<boolean>(false);
  
  const [supportersWall, setSupportersWall] = useState<Supporter[]>([
    { name: "Satoshi_99", coffees: 5, message: "Excellent work on the 4-layer blend algorithm.", timestamp: "2 hours ago" },
    { name: "AlphaSeeker", coffees: 3, message: "We need that Twitter API integration ASAP!", timestamp: "6 hours ago" },
    { name: "SolMaxi", coffees: 1, message: "Keep solana metrics fresh, great dashboard UI.", timestamp: "1 day ago" },
  ]);

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

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setHasSupported(true);
      
      const newSupporter: Supporter = {
        name: supporterName || "Anonymous Quant",
        coffees: coffeeCount,
        message: supporterMsg || "Supported the project!",
        timestamp: "Just now",
      };
      
      setSupportersWall([newSupporter, ...supportersWall]);
    }, 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 pb-20">
      {/* Page Header */}
      <div className="mb-12 border-b border-white/5 pb-8">
        <SectionEyebrow icon={<Heart size={12} className="text-emerald-400" />}>
          BUILDER JOURNAL
        </SectionEyebrow>
        <h1 className="text-4xl font-extrabold tracking-tight text-white font-sans mt-2">
          Lone Developer & Support Portal
        </h1>
        <p className="text-zinc-500 text-sm mt-2 max-w-3xl font-sans leading-relaxed">
          Behind MoodMetrics is a single developer trying to solve sentiment metrics for crypto markets. Read about our bottlenecks, development roadmap limits, and how you can support.
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
        <main className="lg:col-span-9 text-zinc-300 font-sans text-sm leading-relaxed max-w-3xl space-y-16">
          {/* Section 1: The Developer */}
          <section id="developer" className="scroll-mt-28 space-y-6">
            <h2 className="text-2xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
              <User size={20} className="text-emerald-400" />
              1. The Lone Developer
            </h2>
            <p>
              Hi there, I&apos;m Ajinkya. MoodMetrics is a solo endeavor. I designed the architecture, wrote the crawlers, hooked up the Drizzle schemas, and built this frontend cockpit dashboard on my own.
            </p>
            <p>
              Maintaining an application of this scale is challenging for a solo dev. Dealing with Reddit rate-limit defense triggers, parsing RSS formatting differences, normalising futures funding calculations, and ensuring database integrity takes full-time effort, funded entirely out of my own pocket.
            </p>
            <p>
              This is not a massive corporate venture backed by venture capital. It is an independent builder project aiming to provide retail traders with quantitative-grade sentiment tools.
            </p>
          </section>

          {/* Section 2: Disclaimers */}
          <section id="disclaimers" className="scroll-mt-28 space-y-6">
            <h2 className="text-2xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
              <Warning size={20} className="text-rose-400" />
              2. Explicit Disclaimers
            </h2>
            <p className="text-rose-300/90 font-mono text-xs bg-rose-950/10 border border-rose-500/20 p-4 rounded-xl">
              <strong>WARNING:</strong> MoodMetrics is currently in its active building/testing phase. This application is an experimental telemetry cockpit and is **NOT designed for live trading or financial decision-making**.
            </p>
            <p>
              Because the ingestion scrapers are running on public APIs, data gaps, API timeouts, or temporary cache staleness can occur. There are critical bottlenecks (detailed below) that make the score indicative rather than definitive. Do not place capital on these signals.
            </p>
          </section>

          {/* Section 3: Bottlenecks */}
          <section id="bottlenecks" className="scroll-mt-28 space-y-6">
            <h2 className="text-2xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
              <Cpu size={20} className="text-emerald-400" />
              3. Current Project Bottlenecks (Cons)
            </h2>
            <p>
              Due to budget limits, the current codebase has structural limitations. Here are the bottlenecks that could be resolved with funding:
            </p>

            <div className="space-y-6 pt-4 font-mono text-xs">
              {/* Bottleneck A */}
              <div className="border-l-2 border-rose-500/50 pl-4 space-y-2">
                <h3 className="text-white font-bold text-sm font-sans flex items-center gap-2">
                  <TwitterLogo size={16} className="text-sky-400" />
                  Con A: No Real-Time Twitter/X Scrapers
                </h3>
                <p className="text-zinc-400 font-sans text-xs">
                  Crypto narratives originate on Twitter. However, the X Developer API starts at $100/mo for minimal sandbox reads and rises to $5,000/mo for quantitative firehose access. We cannot afford these keys, leaving us blind to influencer postings and Twitter sentiment trends.
                </p>
              </div>

              {/* Bottleneck B */}
              <div className="border-l-2 border-rose-500/50 pl-4 space-y-2">
                <h3 className="text-white font-bold text-sm font-sans flex items-center gap-2">
                  <Coins size={16} className="text-amber-400" />
                  Con B: Demo Rate Limits & Staleness
                </h3>
                <p className="text-zinc-400 font-sans text-xs">
                  We are forced to use CoinGecko&apos;s free demo API tier, which is heavily throttled. This restricts the frequency at which we can refresh price telemetry, leading to cache lag during high market volatility.
                </p>
              </div>

              {/* Bottleneck C */}
              <div className="border-l-2 border-rose-500/50 pl-4 space-y-2">
                <h3 className="text-white font-bold text-sm font-sans flex items-center gap-2">
                  <Cpu size={16} className="text-purple-400" />
                  Con C: Lightweight AI Reasoning Limits
                </h3>
                <p className="text-zinc-400 font-sans text-xs">
                  To keep inference costs low, we run post text through a lightweight model (Llama 3.1 8B). While fast, it misses complex market sarcasm, financial slang, or subtle macro references that a larger model (e.g. Llama 70B/405B or Claude Sonnet) would capture perfectly.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Funding Allocation */}
          <section id="funding" className="scroll-mt-28 space-y-6">
            <h2 className="text-2xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
              <CheckCircle size={20} className="text-emerald-400" />
              4. Funding Goals
            </h2>
            <p>
              Every coffee backed directly goes toward infrastructure and API endpoints. Here is exactly where support funding is allocated:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-sans text-xs text-zinc-400">
              <li><strong>$100/mo:</strong> Core X/Twitter developer endpoint subscription to ingest developer FUD and social metrics.</li>
              <li><strong>$150/mo:</strong> Upgraded CoinGecko Developer Key to bypass rate limits and enable real-time price rollups.</li>
              <li><strong>$200/mo:</strong> Nvidia NIM API compute budget to upgrade the NLP classifier model to Llama 3.1 70B for zero-shot accuracy.</li>
              <li><strong>$50/mo:</strong> Neon DB serverless scale budgets to store sentiment logs up to 180 days instead of 90 days.</li>
            </ul>
          </section>

          {/* Section 5: Support Widget */}
          <section id="support" className="scroll-mt-28 space-y-6">
            <h2 className="text-2xl font-bold text-white font-sans border-b border-white/5 pb-2 flex items-center gap-2">
              <Coffee size={20} className="text-emerald-400" />
              5. Support the Mission
            </h2>
            <p className="font-sans text-xs text-zinc-400 mb-6">
              If you appreciate this visual cockpit and want to support its transition from a playground into a professional quantitative system, buy me a coffee!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-4">
              {/* Checkout Form */}
              <div className="md:col-span-7 bg-[#08080A] border border-white/5 rounded-2xl p-6">
                {hasSupported ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                      <Coffee size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-white font-sans">Simulated Coffee Received!</h3>
                    <p className="text-zinc-500 text-xs font-sans">
                      Thank you for supporting Satoshi! Your name has been added to our simulated leaderboard wall below.
                    </p>
                    <button
                      onClick={() => setHasSupported(false)}
                      className="px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 text-white rounded-lg text-xs"
                    >
                      Support Again
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSupportSubmit} className="space-y-4 font-mono text-xs">
                    {/* Coffee Count select */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase">Select Quantity</span>
                      <div className="flex gap-2">
                        {[1, 3, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setCoffeeCount(n)}
                            className={`flex-1 py-3 rounded-lg border text-xs font-bold transition-all ${
                              coffeeCount === n
                                ? "bg-emerald-500/10 border-emerald-500/35 text-white"
                                : "bg-black border-white/5 text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            ☕ {n} {n === 1 ? "Coffee" : "Coffees"} (${n * 5})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase">Your Coordinate Name</label>
                      <input
                        type="text"
                        value={supporterName}
                        onChange={(e) => setSupporterName(e.target.value)}
                        className="bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-350 focus:outline-none focus:border-white/10 w-full placeholder-zinc-700 font-sans"
                        placeholder="Anonymous Quant"
                      />
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase">Support Message</label>
                      <input
                        type="text"
                        value={supporterMsg}
                        onChange={(e) => setSupporterMsg(e.target.value)}
                        className="bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-350 focus:outline-none focus:border-white/10 w-full placeholder-zinc-750 font-sans"
                        placeholder="Keep building the future!"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner className="animate-spin" size={14} /> BREWING COFFEE...
                        </>
                      ) : (
                        <>
                          DISPATCH SIMULATED COFFEE (${coffeeCount * 5})
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Supporters list */}
              <div className="md:col-span-5 space-y-4">
                <span className="text-[9px] text-zinc-500 font-bold uppercase font-mono">SUPPORTERS WALL</span>
                
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-none font-mono text-[10px]">
                  {supportersWall.map((sup, idx) => (
                    <div key={idx} className="p-3 bg-[#08080A] border border-white/5 rounded-lg space-y-1">
                      <div className="flex justify-between items-baseline text-[9px]">
                        <span className="text-white font-bold font-sans">{sup.name}</span>
                        <span className="text-emerald-400 font-bold">☕ {sup.coffees}</span>
                      </div>
                      <p className="text-zinc-500 font-sans italic leading-relaxed">{sup.message}</p>
                      <span className="text-[8px] text-zinc-700 block">{sup.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
