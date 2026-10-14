# Technical Interview Guide & Engineering Retrospective: Crypto-Mood (MoodMetrics)

> **Document Scope Notice**: This document focuses **exclusively on the Dashboard Section (`/dashboard`) and the Records Section (`/records`)**, alongside the ingestion pipelines, database schemas, AI models, caching layers, and synchronization mechanisms that power them. Other experimental modules (Backtest, Advanced Tools, Methodology) are intentionally omitted.

---

## 1. Project Inception & How We Built This

### The Core Problem: Signal vs. Noise in Crypto Sentiment
In cryptocurrency markets, retail sentiment is notoriously fractured, volatile, and prone to manipulation. A sudden price swing produces hundreds of low-effort social posts, sensationalized news headlines, and frantic leveraged derivative positioning. Most retail sentiment tools either provide a simple, unweighted post count or a basic average of positive versus negative words (VADER or generic dictionary matching). Such systems fail because:
1. They treat a 1-upvote throwaway comment the same as a breaking Reuters or CoinDesk investigative report.
2. They do not correlate social buzz with **hard derivative market positioning** (such as perpetual futures funding rates).
3. They ignore **temporal decay**—a post from 18 hours ago is treated with the same relevance as a breaking story from 10 minutes ago.

**MoodMetrics** was engineered as an institutional-grade, multi-source sentiment telemetry cockpit. Rather than relying on a naive average, it computes a **blended 4-layer market sentiment score** normalized on a scale from `-100` (Extreme Bearish) to `+100` (Extreme Bullish), pairing granular AI textual evaluation with quantitative market indicators.

---

### The Architecture: Multi-Layer Ingestion to Telemetry Cockpit

```
                                 [ DATA INGESTION LAYERS ]
  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
  │ L1: Flash News Layer  │ │ L2: Historic Reddit   │ │ L3: Binance Funding   │ │ L4: Fear & Greed      │
  │ • 14 Curated RSS      │ │ • Arctic Shift Mirror │ │ • Binance Perpetual   │ │ • alternative.me      │
  │ • Google News Streams │ │ • Cursor Pagination   │ │   Futures API         │ │   Global Index        │
  │ • Cheerio Extractor   │ │ • 12+ Subreddits      │ │ • Capped at ±0.10%    │ │ • 0..100 Scale        │
  └──────────┬────────────┘ └──────────┬────────────┘ └──────────┬────────────┘ └──────────┬────────────┘
             │ (Weight: 45%)           │ (Weight: 35%)           │ (Weight: 15%)           │ (Weight: 5%)
             └───────────────────┐     │                         │     ┌───────────────────┘
                                 ▼     ▼                         ▼     ▼
                            ┌───────────────────────────────────────────────┐
                            │ AI Inference Engine (Nvidia NIM Microservices)│
                            │ • Meta Llama 3.2 11B Vision Instruct          │
                            │ • Nvidia Nemotron-3 Embed 1B (pgvector 1536)  │
                            └──────────────────────┬────────────────────────┘
                                                   ▼
                            ┌───────────────────────────────────────────────┐
                            │ Neon Serverless PostgreSQL Database + pgvector│
                            │ • raw_posts  • sentiment_records              │
                            │ • tickers    • sentiment_timeseries (Rollups) │
                            │ • scrape_cache • market_indicators            │
                            └──────────────────────┬────────────────────────┘
                                                   ▼
                        ┌──────────────────────────┴──────────────────────────┐
                        ▼                                                     ▼
        ┌───────────────────────────────┐                     ┌───────────────────────────────┐
        │     DASHBOARD COCKPIT         │                     │      DETAILED AI RECORDS      │
        │      (/dashboard)             │                     │          (/records)           │
        │ • SVG Gauge Needle (-100..100)│                     │ • AI Reasoning & Confidence   │
        │ • 4-Layer Bento Breakdown     │                     │ • Hybrid Search (Vector/Text) │
        │ • Custom SVG Sentiment Chart  │                     │ • 7-Day Stacked Volume SVG    │
        │ • Live Ingestion Stream Feed  │                     │ • AI Verdict Scatter Matrix   │
        │ • L5 Whale Flow Monitor       │                     │ • Summary Telemetry Counters  │
        │ • CRT TerminalLoader Overlay  │                     │ • Filter Coordinate Matrix    │
        └───────────────────────────────┘                     └───────────────────────────────┘
```

---

### Deep-Dive: The Dashboard Section (`/dashboard`)
The Dashboard is the primary operational cockpit of the application. It provides instant situational awareness by distilling millions of data points into a cohesive, high-density telemetry interface:

1. **The Telemetry Gauge Meter (`meter.tsx`)**:
   - A mathematically upright SVG dial displaying sentiment on a `-100` to `+100` scale.
   - Needle angle computed via spring physics (`motion/react`), transitioning fluidly between updates without jarring jumps.
   - Dynamic chromatic states: Emerald (`> +15`, Bullish), Rose (`< -15`, Bearish), and Zinc (`-15..+15`, Neutral).
   - Features radial tick marks, coordinate labels, state status badges, and an explicit breakdown of component weightings.

2. **The 4-Layer Bento Telemetry Grid**:
   - **L1 Flash Sentiment (45%)**: Immediate news sentiment from CoinGecko, 14 major crypto RSS feeds, and dynamic Google News streams.
   - **L2 Historic Community Sentiment (35%)**: Aggregated community sentiment from Reddit. Ingested live via Arctic Shift (`arctic-shift.photon-reddit.com`) to bypass Reddit's Cloudflare 403 blocks and OAuth restrictions, batch-analyzed by Llama 3.2, and rolled up into 24-hour volume-weighted historical buckets.
   - **L3 Binance Funding Rates (15%)**: Real-time perpetual futures funding rates, normalized to reflect whether leveraged longs or shorts are paying premiums.
   - **L4 Fear & Greed Index (5%)**: Macro sentiment baseline pulled from Alternative.me.
   - **L5 Whale Net Flow Monitor**: Tracking institutional and large-wallet transactions with net flow metrics, USD equivalents, and tx hashes.

3. **Historical Sentiment Timeline (`SentimentChart.tsx`)**:
   - A lightweight, custom-built SVG line chart plotting 24-hour sentiment trajectories.
   - Renders dual axes: sentiment score (`-1.0` to `+1.0`) alongside asset spot price curve.
   - Features SVG gradient fills, zero-line baseline markers, and interactive hover coordinates without external charting library overhead.

4. **Live Ingestion Feed (`Dashboard.tsx`)**:
   - A fixed-height (`h-[580px]`), scrollable terminal feed displaying incoming news articles and community discussions as they are processed.
   - Features animated Caret disclosures, source identity badges (News, Reddit, CoinGecko), relative timestamps, and one-click external source links.

5. **CRT TerminalLoader (`TerminalLoader.tsx`)**:
   - A minimalist retro CRT loading overlay triggered during coin switching or manual cache re-syncing.
   - Features a sweeping green laser scan line, rotating telemetry rings, an interactive "click-to-boost" log accelerator, and a rotating crypto history lore ticker.
   - Enforces a 1200ms display threshold to prevent jarring micro-flashes on fast connections.

---

### Deep-Dive: The Records Section (`/records`)
The Records section provides granular, verifiable auditability for every single AI classification made by the system. It bridges the gap between high-level aggregate numbers and raw empirical data:

1. **Granular AI Sentiment Cards**:
   - Displays each ingested post with its source badge, relative posting time, upvote count, and external link.
   - **AI Verdict Panel**: Color-coded sentiment label (`BULLISH`, `BEARISH`, `NEUTRAL`), exact numerical score (`-1.000` to `+1.000`), and AI confidence percentage (`0%` to `100%`).
   - **AI Reasoning**: The exact chain-of-thought rationale generated by Meta Llama 3.2 explaining *why* the post was classified that way.
   - **HTML Content Sanitization**: Custom entity decoding and clean tag stripping (`cleanHtmlText`) with safe 450-character truncation to prevent UI overflow.

2. **Filter Coordinate Matrix**:
   - Multi-dimensional filtering: Asset selector pill (`BTC`, `ETH`, `SOL`, `ALL`), sentiment classification (`Bullish`, `Bearish`, `Neutral`), and source type (`News RSS`, `Reddit`, `CoinGecko`).
   - Server-side pagination controls (offset/limit) with responsive pill buttons.

3. **Hybrid Search Engine (Text ILIKE + Vector Semantic Search)**:
   - **Text Mode**: High-speed SQL `ILIKE` pattern matching across article titles and text bodies.
   - **Semantic AI Mode**: Generates a 1536-dimensional embedding of the user's search query on the fly via Nvidia Nemotron-3, querying Neon PostgreSQL using `pgvector` cosine similarity (`1 - (embedding <=> queryVector)`). Returns posts by semantic conceptual relevance with a dynamic similarity match percentage badge.

4. **Telemetry Header Summary Grid (6-Card Array)**:
   - Row 1: Blended Sentiment Score, Average Text Sentiment, AI Classifier Confidence.
   - Row 2: Label Ratio Matrix (Bullish/Bearish/Neutral percentage split), Total Ingested Logs count, Fear & Greed Index with horizontal gradient progress bar.

5. **Data Visualizations**:
   - **7-Day Stacked Volume & Sentiment Timeline**: Custom SVG dual-axis visualization plotting hourly sentiment curves atop stacked bar columns of ingested volume.
   - **AI Verdict Scatter Matrix**: A 2D scatter plot mapping Sentiment Score ($x$-axis, -1.0 to +1.0) against AI Classifier Confidence ($y$-axis, 0.0 to 1.0), visualizing clustering and sentiment dispersion.

---

## 2. Tools Used in Development & Operations

| Tool | Category | Specific Role in Dashboard & Records |
|---|---|---|
| **Google Antigravity CLI & IDE** | Agentic AI Pair Programming | Core development orchestrator. Executed complex refactors, designed mathematical models, debugged system failures, enforced rules, and implemented UI architectures. |
| **Next.js 16 (Turbopack)** | Full-Stack Web Framework | App Router architecture, Server Route Handlers for API endpoints (`/api/analyze`, `/api/records`), and ultra-fast incremental bundling via Turbopack. |
| **TypeScript 5** | Language & Type Safety | End-to-end type safety spanning Drizzle database schemas, API response contracts, and React UI component props. |
| **Drizzle ORM & Drizzle Kit** | Database Toolkit | Declarative TypeScript schema definition, SQL migrations, relations, and type-safe query generation for Neon PostgreSQL. |
| **Neon Serverless Console** | Cloud Database Host | Serverless PostgreSQL hosting with instant branching, HTTP-based querying for edge/serverless compatibility, and native `pgvector` extension support. |
| **Nvidia NIM API Console** | AI Microservices Hosting | Low-latency inference endpoints for Meta Llama 3.2 11B Vision Instruct and Nemotron-3 Embed 1B models. |
| **cron-job.org REST API** | External Job Automation | Reliable HTTP cron execution service invoking `/api/cron/scrape-flash` (30m) and `/api/cron/scrape-reddit` (6h) with bearer token authorization. |
| **Cheerio** | HTML Parsing & Scraping | Fast, lightweight server-side DOM traversal used to scrape and sanitize article text from arbitrary news websites without browser overhead. |
| **rss-parser** | Feed Ingestion | Node.js RSS/Atom XML feed parser consuming 14+ verified crypto media feeds and dynamic Google News RSS queries. |
| **Phosphor Icons (`@phosphor-icons/react`)** | Design & UI System | Clean, technical, consistent icon library used for HUD telemetry indicators, source markers, and navigation controls. |
| **Motion (`motion/react`)** | Animation Physics | Hardware-accelerated spring animations for the sentiment gauge needle, filter transitions, and interactive HUD tabs. |
| **Git & GitHub** | Version Control | Granular commit history tracking architectural migrations, bug fixes, and feature additions. |

---

## 3. Technologies & Tech Stack Breakdown

### Frontend & Application Layer
- **Next.js 16.2.9 (App Router)**:
  - Utilizes React Server Components where beneficial, while leveraging `"use client"` components for interactive telemetry cockpits (`Dashboard.tsx`, `records/page.tsx`).
  - Next.js Route Handlers (`app/api/.../route.ts`) serve as typed backend micro-endpoints.
  - Turbopack configured with explicit root resolution (`turbopack.root = process.cwd()`) to eliminate compilation path conflicts in multi-workspace environments.
- **React 19.2.4**:
  - Leverages modern React primitives including `useId()` for deterministic SVG element identity during SSR hydration and transition hooks.
- **Tailwind CSS v4**:
  - Utility-first styling utilizing CSS variable tokens.
  - Custom font family mappings: JetBrains Mono (`--font-mono`) for all telemetry numbers, HUD labels, and tables; Geist Sans (`--font-sans`) for proportional text; EB Garamond for editorial brand accents.

### Database & Storage Layer
- **Neon Serverless PostgreSQL**:
  - HTTP-based connection pooling via `@neondatabase/serverless` designed specifically for ephemeral serverless functions.
  - **`pgvector` Extension**: Configured for 1536-dimensional dense vector embeddings. Indexes query vectors via cosine distance (`<=>`) operators for instant semantic similarity lookups.
- **Drizzle ORM (0.45.2)**:
  - Enforces strict foreign key constraints (cascading deletes from `tickers` to `raw_posts`, `sentiment_records`, and `sentiment_timeseries`).
  - Custom SQL builder expressions for vector math:
    ```typescript
    const similarity = queryVector
      ? sql<number>`1 - (${sentimentRecords.embedding} <=> ${`[${queryVector.join(",")}]`}::vector)`
      : sql<number>`1.0`;
    ```

### AI & Natural Language Processing Layer
- **Meta Llama 3.2 11B Vision Instruct (via Nvidia NIM)**:
  - Enterprise inference endpoint providing sub-second sentiment classification.
  - Structured prompt engineering instructing the model to output strict JSON containing `label`, `score` (-1.0 to 1.0), `confidence` (0.0 to 1.0), and `reasoning`.
  - Resilient JSON fallback parser that extracts valid fields using regex and heuristic string slicing even if the model prefixes conversational commentary.
- **Nvidia Nemotron-3 Embed 1B**:
  - High-precision embedding model generating semantic dense vectors.
  - Automatically sliced to 1536 dimensions to maintain compatibility with standard PostgreSQL vector columns.

---

## 4. Synchronization & Consistency Architecture

Maintaining absolute data integrity and sub-second latency across asynchronous scrapers, AI inference services, database records, and React UI states required several architectural safeguards:

```
[ CRON SCHEDULER: cron-job.org ]
        │
        ├─ Every 30 min ──► POST /api/cron/scrape-flash ──► CoinGecko + RSS + Funding + F&G
        │                                                   ├─ Scrapes & stores in `raw_posts`
        │                                                   ├─ Analyzes pending posts in batches of 3
        │                                                   ├─ Computes 1h `sentiment_timeseries` rollups
        │                                                   └─ Caches in `market_indicators`
        │
        └─ Every 6 hours ─► POST /api/cron/scrape-reddit ─► Multi-subreddit deep pagination
                                                            ├─ Ingests to `raw_posts` with deduplication
                                                            ├─ Batched Llama 3.2 sentiment analysis
                                                            ├─ Re-rolls timeseries buckets
                                                            └─ Deletes raw posts older than 14 days

[ USER REQUEST: Client Browser ]
        │
        ▼
   GET /api/analyze?symbol=BTC
        │
        ├─ Read cache from `scrape_cache` & `market_indicators` (<100ms)
        ├─ Pull pre-computed hourly buckets from `sentiment_timeseries`
        ├─ If stale (>30m) or empty: trigger inline flash update with limit=3
        └─ Return Blended 4-Layer Score + 24h Timeseries + Live Price + Recent Signals
```

### 1. The `context.md` Single Source of Truth
Under strict agent rules defined in `AGENTS.md`, `context.md` served as the living technical contract for the codebase. Every single schema change, API route adjustment, UI refactor, or dependency update was immediately documented with exact rationale, file links, and architectural notes. This eliminated "context drift" across multi-step development cycles.

### 2. Read-Path vs. Write-Path Separation (Performance Optimization)
Early prototypes performed scraping and LLM analysis synchronously when a user loaded the dashboard. This resulted in unacceptable 30-to-40 second load times and frequent browser timeouts.
- **The Solution**: Background cron jobs (`/api/cron/scrape-flash` and `/api/cron/scrape-reddit`) handle the heavy lifting asynchronously—scraping articles, calling Nvidia NIM, computing vector embeddings, and pre-aggregating hourly rollups.
- **The Outcome**: The Dashboard read endpoint (`/api/analyze`) simply executes fast index-backed SQL queries against pre-computed database tables, returning full telemetry data in **under 150 milliseconds**.

### 3. Concurrency Locking & Cache Protection
To prevent duplicate scrape jobs when multiple users load the application simultaneously:
- The system checks `scrape_cache`. Before an ingestion pipeline starts, it marks the cache row with `status = "in_progress"`.
- If another process attempts to scrape the same asset while `in_progress` is set and fresh, the secondary process aborts immediately.
- Once completed, the status updates to `"success"` with an updated `lastFetchedAt` timestamp.

### 4. Idempotent Ingestion & The Postgres NULL-Uniqueness Gotcha
In distributed ingestion, duplicate articles are inevitable.
- `raw_posts` enforces a unique composite index on `(external_id, source_type)`. All ingestion queries use `.onConflictDoNothing()` to safely drop duplicates.
- **The PostgreSQL Gotcha**: In PostgreSQL, standard unique constraints treat each `NULL` value as distinct (`NULL != NULL`). In `sentiment_timeseries`, global aggregate rows have `source_type = NULL`. Consequently, running timeseries rollups repeatedly created hundreds of duplicate rows for the same asset and hour.
- **The Fix**:
  1. We executed a database migration to purge duplicate historical rows.
  2. We added an explicit pre-deletion guard in `rollupTimeseries`: before inserting a newly computed rollup bucket for a given timestamp, the system explicitly deletes any existing record for that `(ticker_id, bucket_start, interval, source_type)`.
  3. We added an in-memory deduplication pass across the API endpoints (`/api/analyze`, `/api/records`) using `Map<string, Point>` keys to guarantee charts never render distorted or overlapping data points.

### 5. Client/Server Hydration & Extension Synchronization
- In Next.js 16 / React 19, third-party browser extensions (like MetaMask or ColorZilla) often inject DOM attributes or fail promises before React hydrates, causing fatal hydration mismatches.
- We added `suppressHydrationWarning` to the root `<body>` tag in `app/layout.tsx`.
- Replaced non-deterministic client-side ID generation in SVG animations with React's native `useId()` hook.
- Added inline global unhandled rejection listeners in `<head>` to silently intercept and neutralize unhandled MetaMask extension promises.

---

## 5. How Google Antigravity Was Leveraged

Google Antigravity served as the central AI agentic engineering partner throughout the inception, design, implementation, and optimization of the Dashboard and Records sections.

### 1. Agentic Pair Programming & Rubber-Ducking
Rather than treating the AI as a simple auto-complete snippet generator, Antigravity was utilized as an autonomous senior systems engineer:
- Formulating the mathematical weighting formulas for the Blended Sentiment algorithm (balancing the 45% flash news weight against 35% community history).
- Structuring the database schema in Drizzle ORM to balance normalization with high-speed read performance for timeseries charts.
- Designing the recency decay half-life equations (12-hour exponential decay) to ensure breaking news swiftly overtakes older signals.

### 2. Antigravity Custom Skills in Action
Specialized custom skills equipped Antigravity with domain-specific design and engineering instincts:
- **`design-taste-frontend`**: Actively enforced an "anti-slop" philosophy. Blocked generic AI tropes like oversized neon purple gradients, gratuitous floating bubbles, and cookie-cutter Bootstrap-style templates.
- **`high-end-visual-design` & `minimalist-ui`**: Guided the transformation of the dashboard UI. Replaced cluttered, nested "cards-inside-cards" (double bezels) with sleek, single-bordered `#0C0C0E` matte panels, subtle hairline borders (`border-white/[0.07]`), top specular highlights (`border-t-white/[0.12]`), and generous spatial padding.
- **`industrial-brutalist-ui`**: Guided the creation of the HUD aesthetic—integrating JetBrains Mono metrics, uppercase coordinate tags (`TICKER // SYS_STATUS: OPERATIONAL`), diagnostic status indicators, and the CRT `TerminalLoader` scan line sweep.

### 3. Complex Autonomous Root-Cause Debugging
Antigravity diagnosed and resolved numerous challenging edge cases that would typically stall development:
- **Nvidia NIM EOL Deprecation Migration**: When Nvidia deprecated `llama-3.1-8b-instruct` with HTTP 410 Gone errors, Antigravity seamlessly orchestrated a zero-downtime migration to `meta/llama-3.2-11b-vision-instruct`, while also updating the embedding model to `nemotron-3-embed-1b` and writing vector dimension slicing logic (2048 to 1536) to maintain schema compatibility without dropping historical records.
- **Turbopack Workspace Root Inference**: Diagnosed a breaking Next.js 16 Turbopack compiler error where nested directory structures caused module resolution failures, resolving it by configuring `turbopack.root = process.cwd()` in `next.config.ts`.
- **cron-job.org API Bug**: Identified why external cron jobs were failing with 405 Method Not Allowed and 401 Unauthorized errors—discovering that `cron-job.org` expects `requestMethod` as an integer (`1` for POST) and requires authentication headers nested inside `extendedData.headers` rather than at the root payload.
- **React 19 / Framer Motion Alignment**: Diagnosed build failure `MODULE_NOT_FOUND: ./app/components/meter.tsx` by recognizing that React 19 and Framer Motion v12 require importing from `"motion/react"` rather than the legacy `"framer-motion"` package.

### 4. Continuous Context Synchronization
Antigravity maintained `context.md` in lockstep with the codebase after every major change. By treating documentation as a compile-time requirement rather than an afterthought, any subagent or subsequent prompt had immediate, lossless access to the exact state of the system.

---

## 6. Key Decisions & Technical Trade-offs (Dashboard & Records Only)

### Decision 1: The 4-Layer Blended Formula vs. Simple Post Averages
- **Context**: Standard sentiment platforms average the sentiment of all scraped posts equally.
- **Decision**: Implemented a weighted, multi-dimensional blend:
  $$\text{Blended Score} = 0.45 \times \text{Flash} + 0.35 \times \text{Historic} + 0.15 \times \text{Funding} + 0.05 \times \text{F\&G}$$
- **Rationale**: Text sentiment alone is easily spoofed by bot armies or coordinated social raids. Combining text with **Binance perpetual futures funding rates (15%)** grounds the score in real capital risk: if Twitter is overwhelmingly bullish but funding rates are deeply negative, leveraged traders are heavily shorting the market. Funding rates act as a quantitative reality check against social euphoria.

### Decision 2: Replacing ScrapeGraphAI with Cheerio & Curated RSS
- **Context**: The initial prototype used `ScrapeGraphAI`, an LLM-based web scraper, to extract article contents.
- **Decision**: Completely removed ScrapeGraphAI and replaced it with a custom Cheerio DOM scraper paired with `rss-parser` consuming 14+ verified crypto media feeds and Google News RSS streams.
- **Rationale**: ScrapeGraphAI cost significant API credits per scrape, had high latency (15-30s per article), and frequently failed on bot-protected news sites. Cheerio and RSS feeds parse articles in **under 50 milliseconds**, cost **zero dollars**, and allow immediate fallback to RSS rich description snippets if a news site blocks full HTML extraction.

### Decision 3: Bypassing Reddit's Cloudflare 403 Wall via Arctic Shift Archive Pipeline
- **Context**: Reddit aggressively blocks datacenter/cloud IPs (Vercel, AWS, Neon) from its unauthenticated JSON endpoints (`/r/x.json`) with HTTP 403 Forbidden Cloudflare challenges, and discontinued self-service OAuth app registration in 2025.
- **Decision**: Rather than abandoning community sentiment, we bypassed `reddit.com` entirely and engineered an ingestion pipeline using **Arctic Shift** (`arctic-shift.photon-reddit.com`) as the primary data source. We built cursor-based timestamp pagination (`fetchArcticShiftPaginated`) with `before=<created_utc>` across 12+ subreddits, sequential jitter delays (350ms–400ms), coin-specific regex filtering on macro subreddits, strict noise stripping (filtering pinned megathreads, mod announcements, deleted content, and short posts), and batch insertion into Neon PostgreSQL.
- **Rationale**: Preserved the essential 35% multi-day community sentiment layer with a 1–6 hour sync window, zero API costs, and 100% serverless uptime, serving live volume-weighted rollups on the dashboard.

### Decision 4: Background Pre-computation vs. Inline On-Demand AI
- **Context**: Ingesting 50 news articles and running LLM inference inline during a page request takes ~35 seconds.
- **Decision**: Offloaded all scraping, AI inference, and timeseries aggregation to background cron jobs. In the GET `/api/analyze` route, if unanalyzed flash posts exist, it processes an on-demand limit of only **3 posts**, serving pre-computed database rollups for the rest.
- **Rationale**: Reduced initial dashboard load time from **35+ seconds to <150ms**, ensuring users experience instant page loads without sacrificing data freshness.

### Decision 5: Hybrid Search in Records (Vector Cosine Similarity vs. Keyword ILIKE)
- **Context**: Users in the Records section needed to find specific market events (e.g., "SEC ETF approval" or "Solana network outage").
- **Decision**: Implemented dual-mode search. Standard keyword search uses SQL `ILIKE`. Semantic search embeds the user's query via Nvidia Nemotron-3 and executes a cosine distance vector query in Neon PostgreSQL via `pgvector`.
- **Rationale**: Keyword search fails when users search for concepts that do not share exact words (e.g., searching "regulatory crackdown" should match articles discussing "CFTC lawsuits" or "subpoenas"). Vector search matches semantic meaning, while standard text search remains available for exact phrase lookups.

### Decision 6: Upright SVG Gauge Needle Geometry
- **Context**: The initial gauge meter used a legacy CSS transform (`-rotate-15`) to offset the needle.
- **Decision**: Removed the CSS rotation and recalculated the underlying trigonometry of the SVG needle arc mathematically.
- **Rationale**: The CSS rotation caused the `0` tick mark to slant off-center, making neutral market sentiment look slightly bearish. Recalculating the underlying geometry centered `0` perfectly at 12 o'clock (top dead center) and leveled the `-100` and `+100` endpoints at identical horizontal heights.

### Decision 7: Bespoke SVG Charts over Heavyweight Chart Libraries
- **Context**: Visualizing 24-hour and 7-day sentiment timelines required responsive, high-performance charts.
- **Decision**: Built custom SVG chart components (`SentimentChart.tsx` and the Records 7-day timeline) instead of installing Recharts, Chart.js, or Highcharts.
- **Rationale**: Third-party charting libraries add 150KB–400KB of JavaScript to the client bundle, often suffer from SSR hydration flickering, and make customized cyber/HUD aesthetic styling (hairline grid ticks, dual-axis coordinate alignments, custom gradient fills) difficult. Custom SVG components have **zero bundle overhead**, render instantly during SSR, and offer total design control.

### Decision 8: UI Evolution from Skeuomorphic Double-Bezels to Minimalist Matte Beveled HUD
- **Context**: Early iterations used "Double Bezel" containers—nested bordered boxes within bordered boxes with heavy gradient glows and colored drop-shadows.
- **Decision**: Replaced all DoubleBezel components with `BeveledCard`: a matte `#0C0C0E` obsidian surface, subtle perimeter boundary (`border-white/[0.07]`), delicate specular top highlight (`border-t-white/[0.12]`), and scaled typography using **JetBrains Mono**.
- **Rationale**: Eliminating nested outlines gave the data breathing room. The interface evolved from feeling like a generic futuristic template to feeling like an authentic, high-end financial terminal.

---

## 7. 20 Curated Interview Questions & Senior-Level Answers

### Category A: System Architecture & Ingestion Pipelines

#### Q1: "Walk me through the high-level architecture of your sentiment calculation pipeline. How do you go from raw internet data to a single number on the dashboard gauge?"
**Answer:**
"The system is built on a four-tier architecture: Ingestion, AI Inference, Timeseries Rollup, and Telemetry Presentation.

First, during the **Ingestion phase**, background cron jobs trigger lightweight scrapers every 30 minutes. We pull news articles from 14 verified crypto RSS feeds and Google News via Cheerio, fetch perpetual futures funding rates from Binance, and retrieve the Fear & Greed index from Alternative.me.

Second, in the **AI Inference phase**, newly ingested raw posts are sent in concurrent batches of three to our Nvidia NIM microservice hosting Meta Llama 3.2 11B Vision Instruct. The model analyzes the text, assigns a normalized sentiment score between `-1.0` and `+1.0`, provides a confidence rating, and generates an explanatory reasoning chain. Simultaneously, we generate 1536-dimensional vector embeddings using Nvidia Nemotron-3.

Third, in the **Rollup phase**, individual post scores are aggregated into 1-hour timeseries buckets in Neon PostgreSQL. We apply an exponential recency decay formula with a 12-hour half-life, weight sources by credibility (News at 1.0, Reddit at 0.7), and apply log-scaled upvote boosts so viral signals carry proportional weight without distorting the metrics.

Finally, in the **Presentation phase**, the `/api/analyze` endpoint pulls pre-computed values and computes our blended score: 45% Flash News, 35% Historic Community, 15% Funding Rates, and 5% Fear & Greed. The result is mapped to a `-100` to `+100` scale and rendered on the client dashboard using a spring-animated SVG gauge in under 150 milliseconds."

---

#### Q2: "Why did you choose a 4-layer blended formula (Flash, Historic, Funding, Fear & Greed) instead of simply calculating the average sentiment of all scraped articles?"
**Answer:**
"A simple arithmetic average of scraped text is deeply flawed for financial markets for three primary reasons:

1. **Volume Manipulation & Bot Raids**: Social platforms and syndicated PR feeds are frequently flooded with spam bots promoting micro-cap tokens or shilling narratives. An unweighted average treats 50 bot posts with equal weight to real news.
2. **Speed vs. Depth Disparity**: Breaking news requires immediate reflection (the Flash layer at 45%), whereas community sentiment shifts more gradually over days (the Historic layer at 35%). Blending these two separate temporal horizons prevents temporary news spikes from completely obliterating multi-day trends.
3. **Decoupling from Capital Risk**: Words are cheap; capital is not. Incorporating Binance perpetual futures funding rates (15%) grounds our score in actual leveraged positioning. If social media is euphorically bullish but funding rates are heavily negative, it reveals that sophisticated traders are paying significant premiums to short the market. Funding rates act as an empirical counterweight to social noise."

---

#### Q3: "Reddit aggressively blocks cloud IPs and discontinued free OAuth in 2025. How did you architect the 35% Historic Reddit sentiment pipeline to stay resilient?"
**Answer:**
"Reddit's public endpoints (`/r/x.json`) are heavily protected by Cloudflare bot management, returning HTTP 403 Forbidden on virtually all serverless cloud IPs (Vercel, AWS, Neon), while self-service OAuth app creation was discontinued in 2025.

Rather than giving up on community sentiment or writing brittle scrapers that break constantly, we engineered a dedicated historical ingestion pipeline in `lib/scrapers/reddit.ts`:

1. **Arctic Shift Archive Engine**: We bypass `reddit.com` entirely and route directly through **Arctic Shift** (`arctic-shift.photon-reddit.com`), a high-availability public Reddit archive mirror. Its 1–6 hour sync latency is ideal for calculating a multi-day community sentiment baseline.
2. **Cursor-Based Deep Pagination**: Arctic Shift sorts strictly by `created_utc`. In `fetchArcticShiftPaginated()`, we extract the oldest post's timestamp from each batch and pass it as `&before=${timestamp}` to the next page, traversing backwards through a 14-day window across 12+ subreddits (up to 10 pages per subreddit) with randomized 350ms–400ms jitter delays and desktop browser User-Agent pool rotation.
3. **Relevance & Content Filtering (Defense F)**: We map dedicated subreddits (`r/bitcoin`, `r/ethereum`, `r/solana`) directly, and filter broad forums (`r/CryptoCurrency`, `r/CryptoMarkets`) using coin-specific regexes (e.g. matching `pump.fun`, `raydium`, `phantom wallet`, `$sol` for SOL). The `isUsablePost` guard discards stickied mod megathreads, mod announcements, deleted authors/content, locked threads, and thin posts under 20 characters.
4. **AI Inference & Quantitative Rollup**: Posts are batch-inserted into Neon PostgreSQL with `(external_id, source_type)` deduplication, analyzed in batches of 3 by Meta Llama 3.2 11B Vision Instruct via Nvidia NIM, embedded with Nemotron-3 (1536d sliced vectors), and rolled up hourly in `rollupTimeseries()` applying 12-hour exponential half-life decay, a 0.70 Reddit credibility weight to dampen retail noise, and log-scaled upvote boosts.
5. **Instant Serving**: The `/api/analyze` endpoint averages the last 24 1-hour rollups from the past 7 days, serving the live 35% historic layer in under 150ms with zero API fees."

---

#### Q4: "Why did you replace ScrapeGraphAI with Cheerio and RSS feeds? What were the engineering trade-offs?"
**Answer:**
"In our initial prototype, we used `ScrapeGraphAI`, an LLM-powered scraping library that reads web pages and uses AI to extract structured text. While flexible, it proved completely unviable for production:
- **Latency**: Each scrape took 15 to 30 seconds because an LLM had to parse the full HTML tree.
- **Cost**: Scraping 50 articles an hour incurred substantial LLM token expenses.
- **Reliability**: News sites frequently blocked the underlying headless browser or threw anti-bot challenges.

We completely replaced it with a combination of `rss-parser` and `Cheerio`. RSS feeds give us instant, clean article metadata from 14 verified crypto outlets. Cheerio then downloads the raw HTML and strips scripts, sidebars, headers, and ads using targeted CSS container selectors in **under 40 milliseconds with zero API costs**. Furthermore, we built a 100% fallback mechanism: if Cheerio is blocked by Cloudflare on a specific domain, the scraper immediately falls back to the RSS item's title and rich description snippet, guaranteeing that zero discovered stories are dropped."

---

#### Q5: "How does the Live Ingestion Feed on the dashboard work, and how do you ensure it stays performant without causing layout shifts?"
**Answer:**
"The Live Ingestion Feed displays incoming signals in real-time within a fixed-height container (`h-[580px]`). 

To prevent layout shifts and jank:
1. We enforce strict vertical dimensions that align symmetrically with the right-hand Bento and Chart columns.
2. Each feed row renders a clean typographic hierarchy with fixed-width timestamp badges, source identifiers (News, Reddit, CoinGecko), and truncated headline text.
3. Instead of expanding cards in place (which causes cumulative layout shifts), we utilize smooth, animated Caret disclosure triggers that reveal the AI reasoning and metadata inline using CSS transitions.
4. The list uses virtual-friendly CSS scrolling and hairlines (`border-b border-white/[0.04]`), avoiding nested boxes and heavy box-shadow repaints during scroll events."

---

### Category B: AI Sentiment Engine & Vector Search

#### Q6: "How did you design the prompt and JSON output parsing for the Nvidia NIM Llama 3.2 model to prevent hallucinated or invalid schema errors?"
**Answer:**
"Large Language Models frequently introduce conversational fluff like *'Sure, here is your analysis:'* or emit unescaped quotes within JSON strings, which breaks `JSON.parse()`.

To guarantee bulletproof parsing:
1. **System Prompt Constraint**: We instruct the model with explicit system role boundaries, providing a strict JSON schema requiring four keys: `label` ('bullish' | 'bearish' | 'neutral'), `score` (float from -1.0 to 1.0), `confidence` (float from 0.0 to 1.0), and `reasoning` (one concise sentence).
2. **Deterministic Fallback Parser**: In `lib/ai/sentiment.ts`, we wrapped the parser in a custom regex-based extractor. If `JSON.parse(rawText)` fails, our fallback parser scans for regex patterns matching `"label":\s*"([^"]+)"`, `"score":\s*([-0-9.]+)`, and `"confidence":\s*([0-9.]+)`. If the score is valid but the label is missing, it dynamically derives the label based on numerical thresholds (`> 0.15` is bullish, `< -0.15` is bearish, otherwise neutral). This reduced ingestion parsing failures to 0%."

---

#### Q7: "How does the AI Semantic Vector Search in the Records section work under the hood? Why use pgvector instead of a dedicated vector database like Pinecone?"
**Answer:**
"When a user selects 'Semantic Search' in `/records` and enters a query like *'regulatory scrutiny and enforcement actions'*:
1. The query string is sent to our Nvidia NIM embedding endpoint hosting `nvidia/nemotron-3-embed-1b`, which returns a 1536-dimensional dense vector.
2. We query our Neon PostgreSQL database using Drizzle ORM, executing a cosine distance calculation using `pgvector`'s `<=>` operator:
   ```sql
   SELECT *, 1 - (embedding <=> $queryVector::vector) AS similarity
   FROM sentiment_records
   WHERE ticker_id = $tickerId
   ORDER BY similarity DESC
   LIMIT 20;
   ```
3. Each record is returned with a calculated `similarity` score that we display as a percentage match badge in the UI.

We chose **`pgvector` inside Neon PostgreSQL** over a standalone vector database like Pinecone or Weaviate to maintain transactional atomicity and eliminate dual-system synchronization headaches. With `pgvector`, our relational data (`raw_posts`, `tickers`, `sentiment_records`) and vector embeddings live in the exact same database. When a post is deleted or updated, everything cascades atomically in a single ACID transaction without having to write synchronization webhooks between PostgreSQL and an external vector service."

---

#### Q8: "You encountered an unexpected End-of-Life (HTTP 410 Gone) failure with your Nvidia NIM model. How did you handle that migration without downtime or schema corruption?"
**Answer:**
"In late August 2026, Nvidia decommissioned `meta/llama-3.1-8b-instruct` and `llama-nemotron-embed-1b-v2`, causing immediate HTTP 410 Gone errors on ingestion runs.

We executed a zero-downtime migration:
1. Upgraded our text generation model to `meta/llama-3.2-11b-vision-instruct`.
2. Migrated our embedding model to `nvidia/nemotron-3-embed-1b`.
3. **The Dimension Mismatch Challenge**: The new Nemotron model outputs 2048-dimensional vectors by default, whereas our production Neon PostgreSQL schema was locked to 1536 dimensions (matching the original Llama specification). Changing the database column would require rebuilding the entire table and dropping all historical embeddings.
4. **The Solution**: In `lib/ai/sentiment.ts`, we implemented mathematical vector slicing:
   ```typescript
   const rawVector = response.data[0].embedding;
   const slicedVector = rawVector.slice(0, 1536);
   ```
   This preserved complete compatibility with our existing database indexes, avoided any migration downtime, and retained all historical records while immediately restoring ingestion capabilities."

---

#### Q9: "What does the 'AI Classifier Confidence' metric in the Records section represent, and how is it visualized in the AI Verdict Scatter Matrix?"
**Answer:**
"'AI Classifier Confidence' represents the model's certainty in its semantic classification on a scale from 0.0 to 1.0 (0% to 100%). It is distinct from the sentiment score itself: an article can have an extreme sentiment score of `-0.95` (deeply bearish) with high confidence (`0.98`), or a mild score of `+0.20` with low confidence (`0.45`) due to conflicting or ambiguous language.

In the Records section, we visualize this relationship using the **AI Verdict Scatter Matrix**:
- The $x$-axis plots **Sentiment Score** from `-1.0` (Bearish, left) to `+1.0` (Bullish, right).
- The $y$-axis plots **Confidence** from `0.0` (bottom) to `1.0` (top).
- Each point represents an ingested record, color-coded by its label (Emerald, Rose, Zinc).
- This scatter plot immediately reveals market sentiment distribution: a healthy market displays tight clusters in the top-left or top-right corners (high confidence consensus), whereas uncertain markets produce scattered points along the lower center (low confidence neutrality)."

---

### Category C: Database, Concurrency & Performance

#### Q10: "Explain the PostgreSQL NULL-uniqueness issue you discovered in the `sentiment_timeseries` table and how you resolved it."
**Answer:**
"In our `sentiment_timeseries` table, we store hourly rollups. To track both source-specific rollups (e.g., Reddit only) and unified multi-source rollups, we had a `source_type` column where `NULL` represented the aggregate of all sources combined. We created a unique index on:
```sql
UNIQUE (ticker_id, bucket_start, interval, source_type)
```
**The Problem**: In ANSI SQL and standard PostgreSQL, `NULL` values are considered distinct from one another (`NULL != NULL`). Therefore, every time our background cron ran, the database did not recognize a new row with `source_type = NULL` as a duplicate of an existing row with `source_type = NULL`. Over several days, this created dozens of redundant rollup rows for the exact same hour, distorting our SVG historical charts and inflating post counts.

**The Solution**:
1. We wrote a cleanup migration script to identify and delete all duplicate historical rows, keeping only the latest rollup per bucket.
2. In `rollupTimeseries()` in `lib/ai/sentiment.ts`, we added an explicit pre-deletion guard: before executing batch inserts for a given bucket timestamp, we explicitly run a `DELETE` query targeting any existing record with that `(tickerId, bucketStart, interval, sourceType)`.
3. We implemented an in-memory deduplication layer across the API endpoints (`/api/analyze` and `/api/records`) using hash maps keyed by timestamp, guaranteeing that frontend charts render clean, non-overlapping coordinates."

---

#### Q11: "How do you achieve sub-150ms response times on `/api/analyze` when the endpoint combines five different data layers?"
**Answer:**
"Sub-150ms latency is achieved through strict **Read/Write separation and background pre-computation**:
1. **No Synchronous Web Scraping**: The GET `/api/analyze` endpoint *never* scrapes Reddit, CoinGecko, or Binance during a normal user request. That work is handled by background crons.
2. **Pre-computed Timeseries Rollups**: Instead of executing expensive `AVG()` and `SUM()` aggregates across thousands of rows in `raw_posts` and `sentiment_records` on every page load, the endpoint queries the pre-aggregated `sentiment_timeseries` table, which contains only 24 clean rows for a 24-hour period.
3. **Database Indexing**: All queries hit composite B-tree indexes: `(tickerId, collectedAt)` on `market_indicators` and `(tickerId, bucketStart)` on `sentiment_timeseries`.
4. **On-Demand Micro-Analysis Fallback**: If flash news posts arrive between cron intervals, the endpoint analyzes a maximum of **3 posts** inline using `Promise.all` with a strict 2-second timeout, rather than stalling the connection to process dozens of articles.
5. **Connection Pooling**: Neon serverless HTTP connection pooling eliminates TCP handshake and SSL negotiation latency on serverless invocations."

---

#### Q12: "How do you prevent race conditions when multiple users simultaneously hit the dashboard for a stale coin?"
**Answer:**
"We implement a distributed cache-locking pattern using the `scrape_cache` table:
1. When `/api/analyze` receives a request, it checks `lastFetchedAt` in `scrape_cache`.
2. If the cache is older than 30 minutes, before initiating any fetch, the worker updates the cache entry with `status = "in_progress"` and commits it.
3. If a concurrent user request arrives milliseconds later, it reads `status === "in_progress"`. Instead of launching a redundant scrape job, it immediately bypasses the scraper and serves the existing database snapshot.
4. Once the primary worker completes the scrape, it writes the new records and updates `status = "success"` with a refreshed timestamp. This guarantees that one—and only one—ingestion job runs per asset at any given moment."

---

#### Q13: "Why did you migrate from Vercel Crons to cron-job.org, and what specific bug did you have to fix during that integration?"
**Answer:**
"We migrated from Vercel Crons to `cron-job.org` primarily due to infrastructure constraints: Vercel's hobby tier restricts crons to once per day, whereas our flash news and funding rate layers require 30-minute intervals. `cron-job.org` offers an enterprise-grade REST API supporting sub-hourly schedules with full execution logs and automated retries.

During the migration, we resolved a subtle authentication payload bug:
- Initially, our setup script passed the `Authorization: Bearer <CRON_SECRET>` header at the root of the JSON payload.
- However, the `cron-job.org` REST API ignores root-level headers; it strictly requires custom headers to be nested inside an `extendedData.headers` object.
- Because the header was dropped, Vercel was receiving unauthenticated requests and returning HTTP 401 Unauthorized, leading `cron-job.org` to disable the jobs.
- Furthermore, `cron-job.org` requires the HTTP request method to be passed as an integer (`1` for POST, `0` for GET), whereas we were passing the string `"POST"`, causing requests to default to GET and fail with HTTP 405 Method Not Allowed.
- We updated `scripts/setup-cron-jobs.ts` with the correct nested payload structure and integer enum, resolving the issue permanently."

---

### Category D: Frontend Engineering, Next.js & UI/UX

#### Q14: "Why did you build custom SVG charts instead of using an established charting library like Recharts or Chart.js?"
**Answer:**
"We deliberately avoided external charting libraries for three reasons:
1. **Bundle Size & Load Speed**: Libraries like Recharts or Chart.js add anywhere from 150KB to 400KB of parsed JavaScript to the client bundle. Our custom SVG components are just pure JSX elements totaling under 5KB.
2. **SSR Hydration Mismatches**: Heavy charting libraries rely on dynamic DOM measurements (`ResizeObserver`, `getBoundingClientRect`) that cannot run during Next.js Server-Side Rendering. This frequently produces hydration mismatch warnings or visible flashes of unstyled content (FOUC). Custom SVGs render mathematically correct vector paths on the server immediately.
3. **Total Aesthetic Control**: Our UI demands an authentic cyber/HUD aesthetic—hairline grid ticks, dual-axis coordinate alignments, custom linear gradient horizon fills, and JetBrains Mono monospace telemetry tags. Achieving this in third-party libraries requires fighting against their built-in opinionated styling, whereas custom SVGs give us direct, pixel-level control."

---

#### Q15: "How did you eliminate React hydration mismatch bugs caused by third-party browser extensions?"
**Answer:**
"Browser extensions like MetaMask, Phantom, or ColorZilla often inject custom DOM attributes (such as `cz-shortcut-listen="true"`) or append scripts into the `<body>` before React has finished hydrating. When Next.js compares the server-rendered HTML with the client's initial DOM tree, it detects these injected attributes and throws fatal hydration mismatch warnings.

We resolved this with three defenses:
1. **Hydration Suppression**: Added `suppressHydrationWarning` to the root `<body>` tag in `app/layout.tsx`, instructing React to ignore attribute diffs introduced by client-side browser extensions.
2. **Deterministic Element IDs**: In animated SVG components (like `animated-beam.tsx`), replaced random client-side ID generation (`Math.random()`) with React's native `useId()` hook, ensuring server and client attribute IDs match identically.
3. **Global Rejection Interceptor**: Added an inline script in `<head>` that intercepts and neutralizes unhandled wallet extension promise rejections, preventing extension connection errors from triggering Next.js error overlays in development."

---

#### Q16: "Explain the architectural evolution from nested 'Double Bezel' cards to the minimalist `BeveledCard` design."
**Answer:**
"Our early UI iterations suffered from a common AI design flaw: 'cards inside cards inside cards'. Panels were encased in double nested borders with heavy glowing drop-shadows and vibrant laser flares. While visually striking at first glance, it severely cluttered the dashboard, reduced spatial padding, and caused visual fatigue.

We executed an 'anti-slop' design refactor:
1. Replaced the double-bezel wrappers with a unified `BeveledCard` component.
2. The new component uses a single, understated `#0C0C0E` obsidian matte background.
3. Perimeter boundaries were softened to a delicate hairline border (`border-white/[0.07]`), complemented by a subtle specular top highlight (`border-t-white/[0.12]`) that simulates top-down ambient lighting.
4. Stripped out colored glow flares and increased container padding from `p-4` to `p-6` and `p-8`.
5. The result is an interface where the data itself takes center stage, creating a calm, authoritative financial cockpit."

---

#### Q17: "How does the CRT `TerminalLoader` work, and why did you enforce a minimum display threshold of 1200ms?"
**Answer:**
"The `TerminalLoader` (`TerminalLoader.tsx`) is an interactive loading overlay rendered during asset switching or manual cache re-synchronization. It reinforces the terminal aesthetic with an SVG dial, a sweeping green laser scan line, an interactive 'click-to-boost' log accelerator, and a rotating crypto history fact ticker.

We implemented a **1200ms minimum display threshold**:
- In high-speed network environments, cached API requests often resolve in 80 to 100 milliseconds.
- If a loader appears and disappears in under 100ms, the human eye perceives it as an annoying screen flicker or visual glitch rather than an intentional state transition.
- By enforcing a minimum display duration of 1200ms using a timer promise, the terminal loading sequence plays out smoothly, the user reads the telemetry status, and the UI transitions calmly to the active dashboard without jarring micro-flashes."

---

### Category E: Antigravity AI Agent Workflows & Engineering Discipline

#### Q18: "How did you use Google Antigravity as an agentic pair programmer? Give a specific example where it solved a complex algorithmic or architectural problem."
**Answer:**
"Google Antigravity was used as an autonomous, high-context pair programmer rather than a passive code completion tool. We operated using structured workflows like `/plan`—first researching codebase context, formulating architectural blueprints, establishing edge-case safeguards, and gaining alignment before executing code modifications.

A prime example was the **Timeseries Recency Decay Algorithm** in `lib/ai/sentiment.ts`:
- We needed historical posts to lose influence over time so breaking news could establish market direction, but without dropping historical volume data entirely.
- Antigravity helped formulate an exponential half-life decay function:
  $$\text{Decay Weight} = \exp\left(-\frac{\Delta t}{\tau}\right)$$
  where $\tau = 12\text{ hours}$.
- During implementation, a critical bug surfaced: the initial code calculated decay relative to `Date.now()`. This meant that when historical rollups were computed for last week's data, all past posts were decayed to zero!
- Antigravity identified the flaw and corrected the equation to decay posts relative to their specific **bucket start time** rather than the current wall-clock time, preserving the authentic historical sentiment distribution."

---

#### Q19: "How did you ensure that `context.md` stayed strictly in sync with the codebase across dozens of refactors?"
**Answer:**
"We treated documentation as an active engineering constraint rather than an afterthought. Under our `AGENTS.md` rules, every prompt and pull request was governed by the **Context Synchronization Rule**: any addition, modification, or deletion of code, database schemas, or dependencies required an immediate update to `context.md`.

This practice yielded enormous benefits:
1. **Lossless Memory**: LLM context windows degrade when sessions stretch over days. Having `context.md` as the single source of truth allowed the AI agent to immediately understand the current database schema, recent bug fixes, and architectural decisions without re-reading hundreds of files.
2. **Preventing Regressions**: When refactoring components (such as eliminating double bezels or upgrading Nvidia NIM models), the agent could reference past gotchas (like the Postgres NULL-uniqueness issue or Turbopack root settings) and avoid re-introducing previously solved bugs."

---

#### Q20: "If you had to scale this architecture to track 1,000 cryptocurrencies with sub-second sentiment updates, how would you redesign the system?"
**Answer:**
"Scaling from 3 coins to 1,000 coins with sub-second latency would require transitioning from a pull-based batch architecture to an event-driven streaming architecture:

1. **Ingestion Layer (WebSockets & Pub/Sub)**:
   - Replace cron HTTP scraping with persistent WebSocket connections to exchange trade feeds (Binance, Bybit) and news firehoses (CryptoPanic, Twitter enterprise firehose).
   - Ingest raw messages into an Apache Kafka or AWS Kinesis stream partitioned by asset symbol.
2. **AI Inference Layer (Local LLM Cluster & Quantization)**:
   - Calling external cloud APIs (Nvidia NIM) for thousands of sub-second events would hit rate limits and become cost-prohibitive.
   - We would deploy self-hosted, vLLM-accelerated clusters running quantized smaller models (e.g., Llama 3.2 3B or fine-tuned RoBERTa-crypto) running on dedicated GPU instances (Nvidia H100s) with micro-batching.
3. **Database & Storage Layer (Distributed Timeseries & In-Memory Cache)**:
   - Replace serverless PostgreSQL with a specialized timeseries database like **ClickHouse** or **TimescaleDB** capable of ingesting millions of rows per second with real-time continuous aggregates.
   - Deploy **Redis / Dragonfly** as a distributed caching layer holding the latest blended scores in memory.
4. **Frontend Delivery (Server-Sent Events / WebSockets)**:
   - Replace HTTP client polling with a persistent WebSocket or Server-Sent Events (SSE) gateway, streaming deltas directly to the React dashboard gauge needle and ingestion feed."

---

## 8. Summary Checklist for Interview Preparation

- [x] **Core Architecture**: Understand the 4-layer blend (45/35/15/5) and why funding rates matter.
- [x] **Ingestion & Anti-blocking**: Know the 8 Reddit defenses, Cheerio DOM parsing, and the 100% RSS fallback.
- [x] **AI & Vectors**: Articulate the Nvidia Llama 3.2 JSON extraction, Nemotron-3 embeddings, and `pgvector` cosine similarity.
- [x] **Database Mechanics**: Be ready to explain the Postgres NULL-uniqueness gotcha and batch upsert pre-computations.
- [x] **Performance Optimization**: Know how read/write separation achieved sub-150ms dashboard loads.
- [x] **Frontend Engineering**: Explain why custom SVG charts were chosen over Recharts, and how hydration warnings were solved.
- [x] **Antigravity Tooling**: Confidently explain agentic pair programming, `/plan` workflows, custom anti-slop skills, and `context.md` synchronization.
