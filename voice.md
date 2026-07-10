# MoodMetrics — Video Script

**Duration:** ~5:00  
**Visual Tone:** Dark, terminal-inspired UI. Monochrome with emerald accents. Grain overlay. Laser scan animations. Clean cuts.

---

## 0:00 — OPENING HOOK (30s)

**[Full-screen terminal loader overlay. Green text booting up on dark background. Fast typewriter effect.]**

In traditional finance, you have earnings reports, P/E ratios, debt sheets. Crypto has none of that. Instead, it runs on pure psychology — fear cascades, leverage wipes, and Reddit-fueled narratives.

**[Cut to landing page — "Map the Mood." hero with bento grid below.]**

This is MoodMetrics. A quantitative sentiment aggregator that ingests thousands of data points across four layers — news, social forums, derivatives funding, and global fear indexes — compresses them through an AI-powered pipeline, and outputs a single blended score from -100 to +100 for Bitcoin, Ethereum, and Solana.

---

## 0:30 — DASHBOARD: THE BLENDED SCORE (1m 15s)

**[Cut to /dashboard page. Gauge dial visible, score animated springing into place.]**

This is the cockpit. The main gauge shows the Blended Sentiment Score. Right now it reads whatever the market is feeling — bullish in green, bearish in rose, neutral in gray. The needle snaps into position using spring physics.

**[Camera highlights each bento card in the 4-layer grid.]**

But that single number is the result of a weighted blend of four distinct layers:

**Flash Layer — 45% weight.** CoinGecko news and crypto RSS feeds like CoinDesk, Cointelegraph, Decrypt. Breaking headlines analyzed by Llama 3.1 — refreshed every 30 minutes. Fast-moving, short-term momentum.

**Historic Layer — 35% weight.** Reddit community posts scraped from asset-specific subreddits. Each post gets AI-classified with a score, confidence, and reasoning. Pre-aggregated into hourly buckets with a 12-hour recency half-life decay. Refreshed every 6 hours.

**Funding Rates Layer — 15% weight.** Binance perpetual futures funding rates. Positive means longs are paying shorts — bullish leverage. Negative means shorts dominate. Normalized to a -1 to +1 scale, capped at ±0.10%.

**Fear & Greed Layer — 5% weight.** The global alternative.me index. Raw 0-to-100 value normalized by subtracting 50 and dividing by 50. A small dampener that keeps macro context in the blend.

**[Cut to the blended score formula overlay.]**

The math: each layer is normalized to -1 to +1, multiplied by its weight, summed, then multiplied by 100. The result is clamped and labeled bullish above +20, bearish below -20, and neutral in between.

**[Cut to the 24h SentimentChart SVG timeline.]**

Below the gauge, the timeline plots hourly sentiment against the coin's spot price. The engine also applies logarithmic upvote scaling to prevent single viral posts from skewing the curve — log₁₀ of upvotes times 0.1, added to the source credibility weight.

---

## 1:45 — AI RECORDS PAGE (1m 15s)

**[Cut to /records page. Full page with filters, summary stats, record cards.]**

This is the AI Records page — the raw database layer. Every single ingested post, with its AI-generated verdict, exposed in granular detail.

**[Camera hovers over the filter bar — symbol, label, source, search, timeframe.]**

You can filter by coin, sentiment label, source type, and search either by keyword or by vector semantic search. The semantic search queries Nvidia NIM's embeddings API and matches against a pgvector index using cosine distance — so you can search by *meaning*, not just exact text.

**[Cut to summary stats row: Blended Sentiment, Avg Text Sentiment, Confidence, Label Ratio, Total Logs, Fear & Greed.]**

The header row compares the blended score against the pure average text sentiment — simple arithmetic mean of the visible records. The AI Classifier Confidence shows Llama's self-reported certainty per post. The Label Ratio Matrix tracks bullish-bearish-neutral distribution. And the Fear & Greed card shows the raw index with a gradient progress meter from extreme fear to extreme greed.

**[Scroll through post cards. Highlight one with expanded AI reasoning.]**

Each record card shows the post title, truncated content, the AI label with color coding, the numerical score from -1.0 to +1.0, confidence percentage, and the raw reasoning text — the actual justification the model gave for its verdict.

**[Cut to the stacked chart and scatter matrix.]**

The timeline chart stacks volume bars with a sentiment line — hover-scrubbable. And the AI Verdict Scatter Matrix plots every post on an X-Y grid: score vs confidence. Rose dots for bearish, emerald for bullish, zinc for neutral. Instantly reveals where the conviction is.

---

## 3:00 — BACKTESTER (1m)

**[Cut to /backtester page. Parameter controls and results chart.]**

The Backtester is a quantitative strategy simulator. It pulls real historical sentiment scores from the database, correlated with spot prices, and lets you test trading strategies against past data.

**[Highlight strategy dropdown — Trend Following vs Contrarian.]**

Two built-in strategies. Trend Following enters a position when sentiment crosses above your entry threshold — default +30 — and exits when it drops below your exit threshold, default -10. Contrarian does the reverse — buying when sentiment is deeply negative and selling when it recovers. You control both thresholds with sliders.

**[Point to results metrics: Total Return, Benchmark Return, Sharpe Ratio, Max Drawdown, Win Rate.]**

The engine calculates total return vs a passive hold benchmark, annualized Sharpe ratio from hourly returns, maximum drawdown, and win rate. It also generates an equity curve so you can visualize how the strategy performed over time.

**[Overlay showing the Monte Carlo simulation logic.]**

If historical spot prices are flat — which happens if the database only has recent data — the engine falls back to a Monte Carlo simulation: a random walk with sentiment-drift bias, so you still get meaningful results.

**[Cut to empty or "under development" state for the notes section.]**

The backtester is a live feature, actively being refined with more strategy presets, position sizing controls, and multi-parameter optimization coming soon.

---

## 4:00 — ADVANCED TOOLS (45s)

**[Cut to /advanced page. Show the 5-tab panel layout.]**

The Advanced Tools page is the experimental sandbox. Five quantitative features — all currently under active testing and development.

**[Quick cuts through each tool.]**

**Sentiment-Price Lag Correlation** — measures Pearson correlation coefficients between sentiment and price movements with time-shifted lag analysis.

**Narrative Clouds** — a 2D projection of AI embedding vectors, showing how narratives cluster semantically.

**Historical Playback** — an hour-by-hour telemetry player that syncs sentiment scores, spot prices, and AI post highlights chronologically.

**Whale vs Retail Crossover Index** — correlates simulated whale transaction flows against retail sentiment consensus.

**Narrative Trajectories** — groups posts by day, runs Leader Clustering on embeddings at a 0.78 cosine similarity threshold, and connects the daily centroids to show how market narratives evolve over time.

**[Fade to subtle "testing" badge overlay.]**

These tools use real database telemetry but are not yet production-ready. They represent the frontier of what this system can do — narrative analysis at scale.

---

## 4:45 — CLOSE (15s)

**[Back to dashboard. Slow zoom out from the gauge to full bento grid.]**

MoodMetrics is an open, experimental system. The full stack — Next.js, Neon PostgreSQL, Drizzle ORM, Nvidia NIM, and Vercel AI SDK — is available to explore. Try the simulator, tweak the blend weights, run your own backtests.

**[Text on screen: moodmetrics.vercel.app + GitHub link.]**

Map the mood. Find the edge.

**[Fade to black with terminal cursor blinking.]**
