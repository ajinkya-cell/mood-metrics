"use client";

import React, { useState, useEffect } from "react";
import { PageShell, PageHero, Hatch } from "../components/editorial";

const SECTIONS = [
  { id: "overview", label: "1. Overview & Mission" },
  { id: "why-sentiment", label: "2. Why Sentiment Matters" },
  { id: "four-layers", label: "3. The Ingestion Layers" },
  { id: "math-blending", label: "4. Blended Calculations" },
  { id: "fine-adjustments", label: "5. Recency & Virality Math" },
  { id: "verdicts", label: "6. Interpreting Verdicts" },
  { id: "telemetry-metrics", label: "7. Metrics & Visualizations" },
];

export default function MethodologyPage() {
  const [activeSection, setActiveSection] = useState<string>("overview");

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
        micro="Documentation · Methodology"
        lead="How MoodMetrics"
        accent="works"
        description="The purpose, the data pipeline and the maths behind every score on the site, from a single Reddit post to the blended index."
      />
      <Hatch />

      <div className="px-5 md:px-8 pt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* LEFT COLUMN: Sticky Table of Contents */}
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
          {/* Section 1: Overview */}
          <section id="overview" className="scroll-mt-28 space-y-6">
            <h2 className="ed-display text-4xl md:text-[2.75rem] text-white pb-4 border-b border-[var(--ed-border)]">
              1. Overview & Mission
            </h2>
            <p>
              In traditional finance, assets are evaluated using fundamental parameters like earnings reports, cash flow, and debt ratios. In cryptocurrency, these metrics are often absent, thin, or heavily distorted.
            </p>
            <p>
              Instead, cryptocurrency pricing behaves like a <strong>reflexive Keynesian beauty contest</strong>: prices fluctuate based on collective market psychology, crowd narratives, and leveraged liquidation points. 
            </p>
            <p>
              <strong>MoodMetrics</strong> is a quantitative sentiment aggregator designed to map this psychology. The system continuously ingests raw text, community upvote metrics, funding distributions, and volatility indexes, converting unstructured emotional signals into a standardized, mathematical index from <strong>-100 (extreme fear and panic)</strong> to <strong>+100 (extreme greed and bullish momentum)</strong>.
            </p>
            <div className="ed-bento ed-iso p-5 text-[14px] text-[var(--ed-fg-70)] space-y-2">
              <div className="ed-eyebrow mb-2">
                SYSTEM DATA FLOW SUMMARY
              </div>
              <div>• Data Scraping: Parallel news RSS, Reddit API fallbacks, Binance perp contracts, alternative.me index</div>
              <div>• Classification: Nvidia NIM hosts Nemotron 3.5 Bolt, which labels every post individually</div>
              <div>• Pre-Aggregation: Normalized weighting rollups calculated hourly and cached inside a Neon SQL database</div>
            </div>
          </section>

          {/* Section 2: Why Sentiment Matters */}
          <section id="why-sentiment" className="scroll-mt-28 space-y-6">
            <h2 className="ed-display text-4xl md:text-[2.75rem] text-white pb-4 border-b border-[var(--ed-border)]">
              2. Why Sentiment Matters
            </h2>
            <p>
              Most traders rely heavily on price-chart indicators (e.g. RSI, MACD, Bollinger Bands). While useful, these are lagging metrics; they only tell you that a price moved <em>after</em> the order book has already executed the trades.
            </p>
            <p>
              Sentiment, on the other hand, acts as a <strong>leading indicator</strong>. Price cascades in crypto are rarely linear. They happen when:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Fear Cascades:</strong> Retail investors panic-post on social boards, leading to spot market distributions.</li>
              <li><strong>Leverage Wipes:</strong> Too many traders use high leverage. If funding rates skew positive, long traders are paying shorts to keep contracts open, leaving them highly vulnerable to a drop that triggers a chain-reaction of liquidations.</li>
              <li><strong>Narrative Divergence:</strong> Traditional media publishes positive news articles, but community forums remain intensely skeptical. This divergence often indicates that the market is overextended.</li>
            </ul>
            <p>
              By quantifying the raw emotional data and leverage skew before they affect spot prices, MoodMetrics provides traders with a way to assess systemic risk.
            </p>
          </section>

          {/* Section 3: The Ingestion Layers */}
          <section id="four-layers" className="scroll-mt-28 space-y-6">
            <h2 className="ed-display text-4xl md:text-[2.75rem] text-white pb-4 border-b border-[var(--ed-border)]">
              3. The Ingestion Layers
            </h2>
            <p>
              MoodMetrics gathers data across four distinct layers, capturing different time horizons and participant behaviors:
            </p>

            <div className="space-y-6 pt-4 font-mono text-xs">
              {/* L1 */}
              <div className="border-l border-[var(--ed-blue-label)] pl-5 space-y-2">
                <h3 className="text-[var(--ed-fg-90)] font-medium text-[17px] tracking-[-0.02em]">L1 — The Flash Ingestion Layer (45% Weight)</h3>
                <p className="text-[var(--ed-fg-70)] text-[15px]">
                  This layer measures short-term sentiment momentum. It parses breaking headlines from RSS news syndications (including CoinDesk, Cointelegraph, Decrypt, and Cryptoslate) and integrates real-time community upvotes/downvotes from CoinGecko.
                </p>
                <div className="text-[10px] text-zinc-500 font-mono">
                  REFRESH CADENCE: 30 MINUTES | RETENTION HISTORY: 14 DAYS
                </div>
              </div>

              {/* L2 */}
              <div className="border-l border-[var(--ed-blue-label)] pl-5 space-y-2">
                <h3 className="text-[var(--ed-fg-90)] font-medium text-[17px] tracking-[-0.02em]">L2 — The Historic Community Layer (35% Weight)</h3>
                <p className="text-[var(--ed-fg-70)] text-[15px]">
                  This layer monitors dedicated asset forums (e.g. r/bitcoin, r/ethereum, r/solana) using sequential, anti-blocking public scrapers. It captures retail consensus and long-term narrative baseline trends.
                </p>
                <div className="text-[10px] text-zinc-500 font-mono">
                  REFRESH CADENCE: 6 HOURS | RETENTION HISTORY: 14 DAYS
                </div>
              </div>

              {/* L3 */}
              <div className="border-l border-[var(--ed-blue-label)] pl-5 space-y-2">
                <h3 className="text-[var(--ed-fg-90)] font-medium text-[17px] tracking-[-0.02em]">L3 — The Perpetual Funding Rates Layer (15% Weight)</h3>
                <p className="text-[var(--ed-fg-70)] text-[15px]">
                  Queries perpetual swap contracts directly from the Binance Futures API. Positive rates show long leverage build-ups; negative rates indicate heavy short contract skews.
                </p>
                <div className="text-[10px] text-zinc-500 font-mono">
                  REFRESH CADENCE: 30 MINUTES | SOURCE: BINANCE FUTURES API
                </div>
              </div>

              {/* L4 */}
              <div className="border-l border-[var(--ed-blue-label)] pl-5 space-y-2">
                <h3 className="text-[var(--ed-fg-90)] font-medium text-[17px] tracking-[-0.02em]">L4 — The Global Fear & Greed Index (5% Weight)</h3>
                <p className="text-[var(--ed-fg-70)] text-[15px]">
                  Pulls the global daily Fear & Greed index from alternative.me. It reflects macro market volatility, trading volume, search trend popularity, and social spikes.
                </p>
                <div className="text-[10px] text-zinc-500 font-mono">
                  REFRESH CADENCE: 30 MINUTES | SOURCE: ALTERNATIVE.ME INDEX
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Blended Calculations */}
          <section id="math-blending" className="scroll-mt-28 space-y-6">
            <h2 className="ed-display text-4xl md:text-[2.75rem] text-white pb-4 border-b border-[var(--ed-border)]">
              4. Blended Score Logic
            </h2>
            <p>
              To create a unified sentiment metric, the system processes each layer into a normalized value between <strong>-1.0 (extremely bearish)</strong> and <strong>+1.0 (extremely bullish)</strong>, aggregates them using predefined weights, and multiplies the final result by 100.
            </p>
            <p className="font-mono bg-[#0A0A0C] border border-[var(--ed-border)] rounded-xl p-4 text-center text-white text-sm">
              Blended Score = [(L1 × 0.45) + (L2 × 0.35) + (L3 × 0.15) + (L4 × 0.05)] × 100
            </p>
            <p>
              Each component score is normalized as follows:
            </p>
            <ul className="list-disc pl-5 space-y-4">
              <li>
                <strong>L1 (Flash) and L2 (Reddit) Normalization:</strong> Raw articles and forum posts are parsed by the AI model, which outputs an exact sentiment score from -1.0 to +1.0. These individual scores are averaged together.
              </li>
              <li>
                <strong>L3 (Funding Rate) Normalization:</strong> Perpetual swap funding rates typically hover between -0.05% and +0.05% per 8 hours. We divide the raw funding rate by <strong>0.001 (representing 0.10% premium)</strong> and cap the result:
                <br />
                <code className="text-[var(--ed-fg-90)] bg-white/[0.05] px-1.5 py-0.5 rounded font-mono text-[13px]">
                  Funding Score = clamp(Rate / 0.001, -1.0, 1.0)
                </code>
              </li>
              <li>
                <strong>L4 (Fear & Greed) Normalization:</strong> The raw index is a value from 0 to 100. We center it around neutral (50) and map it:
                <br />
                <code className="text-[var(--ed-fg-90)] bg-white/[0.05] px-1.5 py-0.5 rounded font-mono text-[13px]">
                  Fear & Greed Score = clamp((Index - 50) / 50, -1.0, 1.0)
                </code>
              </li>
            </ul>
          </section>

          {/* Section 5: Recency & Virality Math */}
          <section id="fine-adjustments" className="scroll-mt-28 space-y-6">
            <h2 className="ed-display text-4xl md:text-[2.75rem] text-white pb-4 border-b border-[var(--ed-border)]">
              5. Recency & Virality Math
            </h2>
            <p>
              Crypto markets shift rapidly. To ensure the timeseries index is responsive without losing its baseline signal, the blending engine applies two mathematical adjustments:
            </p>

            <div className="space-y-6 font-sans">
              <div>
                <h4 className="text-white font-bold text-sm">A. Exponential Recency Decay</h4>
                <p className="mt-1">
                  Social media conversations degrade in relevance quickly. The system treats post age with a <strong>half-life decay calculation of 12 hours</strong>:
                </p>
                <div className="ed-bento p-4 mt-2 font-mono text-xs text-center text-[var(--ed-fg-90)]">
                  Weight(t) = exp(-t / 12)
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Where <em>t</em> is the hours elapsed since ingestion. A post from 12 hours ago carries only half the weight of a fresh post.
                </p>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm">B. Source Credibility Scaling</h4>
                <p className="mt-1">
                  To prevent noisy social media comments from drowning out factual news, weights are scaled by source:
                </p>
                <ul className="list-disc pl-5 mt-2 text-xs space-y-1 text-zinc-400">
                  <li>Traditional News RSS: <strong className="text-white">100% (1.0 weight)</strong></li>
                  <li>CoinGecko Curated Feeds: <strong className="text-white">90% (0.9 weight)</strong></li>
                  <li>Public Reddit Posts: <strong className="text-white">70% (0.7 weight)</strong></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm">C. Logarithmic Upvote Boost</h4>
                <p className="mt-1">
                  Highly upvoted social posts reflect strong community consensus. Rather than multiplying linearly (which would allow a single viral post to crash the index), we apply a <strong>log-scaled upvote multiplier</strong>:
                </p>
                <div className="ed-bento p-4 mt-2 font-mono text-xs text-center text-[var(--ed-fg-90)]">
                  Upvote Boost = log10(max(upvotes, 1) + 1) × 0.10
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  This boost is added to the post&apos;s base weight. A post with 1,000 upvotes gets a substantial weight boost, but remains clamped within safe thresholds.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Interpreting Verdicts */}
          <section id="verdicts" className="scroll-mt-28 space-y-6">
            <h2 className="ed-display text-4xl md:text-[2.75rem] text-white pb-4 border-b border-[var(--ed-border)]">
              6. Interpreting Verdicts
            </h2>
            <p>
              The final score displays on the cockpit dashboard in one of three states, showing the corresponding market bias:
            </p>

            <div className="space-y-4">
              <div className="ed-bento p-5">
                <span className="text-emerald-400 font-mono font-bold text-xs">BULLISH BIAS (+21 to +100)</span>
                <p className="text-zinc-400 text-xs mt-1">
                  News is constructive, Reddit threads are optimistic, perpetual funding is positive (longs paying shorts), and global fear & greed is high. This setup favors spot accumulation or momentum long trades.
                </p>
              </div>

              <div className="ed-bento p-5">
                <span className="text-zinc-300 font-mono font-bold text-xs">NEUTRAL CONSOLIDATION (-20 to +20)</span>
                <p className="text-zinc-400 text-xs mt-1">
                  Mixed signals. For example, bullish Reddit chatter might be cancelled out by negative derivatives funding, or positive RSS news might meet extreme macro fear. This indicates a range-bound market, suggesting caution or trend breakout monitoring.
                </p>
              </div>

              <div className="ed-bento p-5">
                <span className="text-rose-400 font-mono font-bold text-xs">BEARISH BIAS (-100 to -21)</span>
                <p className="text-zinc-400 text-xs mt-1">
                  Outbound news is pessimistic, forums are panicking, and perpetual swap funding is negative (shorts paying longs, showing heavy short positioning skew). This indicates high systemic risk, favoring capital preservation or hedging.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Metrics & Visualizations */}
          <section id="telemetry-metrics" className="scroll-mt-28 space-y-6">
            <h2 className="ed-display text-4xl md:text-[2.75rem] text-white pb-4 border-b border-[var(--ed-border)]">
              7. Metrics & Visualizations Reference
            </h2>
            <p>
              To extract actionable quantitative signals from qualitative text datasets, MoodMetrics presents multiple telemetry layers across the Dashboard and AI Records pages.
            </p>

            <div className="space-y-6 font-sans">
              {/* Blended Score vs. Average Score */}
              <div className="border border-[var(--ed-border)] rounded-xl p-6 bg-zinc-950/40">
                <h3 className="ed-eyebrow mb-3">
                  Blended Score vs. Average Text Sentiment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-400">
                  <div className="space-y-2">
                    <strong className="text-emerald-400 block font-mono text-[10px] uppercase">A. DASHBOARD BLENDED SCORE (-100 to +100)</strong>
                    <p className="leading-relaxed">
                      A multi-layer <strong>Macro sentiment index</strong> compiled on the fly. It aggregates social media text (AI-parsed Reddit posts), curated feeds, traditional News RSS articles, derivatives leverage skew (Binance funding rates), and global macro-sentiments (Fear & Greed index).
                    </p>
                    <p className="text-[10px] italic">
                      <strong>Importance:</strong> Captures leverage dynamics and contrarian sentiment indicators. It prevents social media noise from misrepresenting actual capital positioning.
                    </p>
                  </div>
                  <div className="space-y-2 border-t md:border-t-0 md:border-l border-[var(--ed-border)] pt-4 md:pt-0 md:pl-6">
                    <strong className="text-emerald-400 block font-mono text-[10px] uppercase">B. AVERAGE TEXT SENTIMENT (-100 to +100)</strong>
                    <p className="leading-relaxed">
                      A <strong>Micro text sentiment average</strong> computed directly from the Neon database. It represents the simple arithmetic mean score of only the individual textual records (Reddit comments, news briefs) that match your active search and filter queries.
                    </p>
                    <p className="text-[10px] italic">
                      <strong>Importance:</strong> Isolates pure public and journalistic written bias. It allows researchers to drill down into keyword-specific, timeline-bound textual changes without macro index distortions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Historical Sentiment Timeline */}
              <div>
                <h4 className="ed-eyebrow">A. Historical Sentiment Timeline</h4>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ed-fg-70)]">
                  The Historical Sentiment Timeline plots sentiment changes over time. It is calculated by dividing the selected timeframe (24h, 7d, or 30d) into equal chronological buckets. The system aggregates all sentiment records falling inside each bucket, computes their arithmetic mean, and connects these data points using an SVG Bezier spline:
                </p>
                <div className="ed-bento p-4 mt-2 font-mono text-xs text-center text-[var(--ed-fg-90)] text-zinc-300">
                  Bucket_Avg(T) = &Sigma; (Sentiment_i) / Count(T)
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ed-fg-55)]">
                  This chart enables users to trace the visual alignment of sentiment peaks and troughs with actual coin price movements.
                </p>
              </div>

              {/* AI Verdict Scatter Matrix */}
              <div>
                <h4 className="ed-eyebrow">B. AI Verdict Scatter Matrix</h4>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ed-fg-70)]">
                  The scatter matrix maps the active record subset on a coordinate space. The X-axis represents the <strong>AI Sentiment Score</strong> (-1.0 to +1.0) and the Y-axis represents the <strong>AI Classifier Confidence</strong> (0% to 100%).
                </p>
                <ul className="list-disc pl-5 mt-2 text-xs text-zinc-400 space-y-1 font-sans">
                  <li><strong className="text-rose-400">Bearish Zone:</strong> Plotted on the left (negative scores). Color-coded in rose.</li>
                  <li><strong className="text-zinc-350">Neutral Zone:</strong> Plotted in the center (near 0.0). Color-coded in gray/zinc.</li>
                  <li><strong className="text-emerald-400">Bullish Zone:</strong> Plotted on the right (positive scores). Color-coded in emerald.</li>
                </ul>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ed-fg-55)]">
                  This scatter plot immediately highlights high-confidence sentiment outliers and tracks whether bullish or bearish sentiment dominates the conversation density.
                </p>
              </div>

              {/* AI Classifier Confidence */}
              <div>
                <h4 className="ed-eyebrow">C. AI Classifier Confidence</h4>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ed-fg-70)]">
                  Calculated directly by the <strong>AI model</strong> for each individual ingestion piece. It represents the model&apos;s self-reported certainty when assigning a classification label (Bullish, Bearish, or Neutral).
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ed-fg-55)]">
                  A high confidence score (e.g. &gt;85%) indicates that the underlying post contains strong, unambiguous language (e.g., &quot;buying more, price target is up 50%&quot;). A lower confidence score indicates conflicting text, mixed sentiment statements, or high stylistic noise.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </PageShell>
  );
}
