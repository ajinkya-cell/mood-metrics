# Implementation Plan: Multi-Page Crypto-Mood Portal Expansion

This plan outlines the architecture, layout systems, routing structure, and design details for expanding the **crypto-mood** application into a vast, high-agency multi-page platform. 

---

## 1. Route Map & Structural Architecture

We will restructure the application directory to use standard Next.js App Router folders.

```
app/
├── layout.tsx                   # Main HTML shell with global navbar, fonts, and dark theme
├── page.tsx                     # [NEW] Awwwards-tier visual Landing Page
├── dashboard/
│   └── page.tsx                 # [NEW] Telemetry Dashboard (relocated from app/page.tsx)
├── methodology/
│   └── page.tsx                 # [NEW] "How it Works" / Algorithm Mathematical Breakdown
├── roadmap/
│   └── page.tsx                 # [NEW] "Future Enhancements" and interactive timeline
├── feed/
│   └── page.tsx                 # [NEW] Real-time Ingested Articles & Posts Stream
├── news/
│   └── page.tsx                 # [NEW] Dedicated RSS News Feed stream (RSS and CoinGecko news)
├── markets/
│   └── page.tsx                 # [NEW] Quantitative Market Analysis & Volume Momentum comparison
├── simulator/
│   └── page.tsx                 # [NEW] Interactive Weight Simulator & Backtester
└── components/                  # Shared UI components
    ├── Dashboard.tsx            # Existing dashboard layout
    ├── DoubleBezel.tsx          # Doppelrand container
    ├── SentimentChart.tsx       # SVG chart
    └── GlobalNav.tsx            # [NEW] Shared header navigation with page links
```

---

## 2. Page Specifications & Designs

### A. The Landing Page (`/`)
* **Objective:** First impression. Highly spatial, immersive visual assets, strong value props.
* **Layout Structure:**
  * **Asymmetric Hero Section:** Massive header text (`text-6xl md:text-8xl tracking-tight leading-none text-white`) stating the core premise (e.g. *Ingesting panic. Quantifying greed.*) offset by a preview of active crypto sentiment metrics.
  * **Trust Logos Strip:** A monochrome, clean SVG logo wall showing Simple Icons (`simple-icons` CDN) for major platforms.
  * **Interactive Feature Bento Grid:** Explains the 4-layer data sources using responsive bento tiles.
  * **Live Telemetry Call-Out:** A mini preview card showing the live BTC blended score dynamically.
  * **Newsletter Subscription / Alert CTA:** A dark form to capture email sign-ups for daily reports (WCAG compliant contrast inputs).

### B. Methodology Page (`/methodology`)
* **Objective:** Transparency. Explains the "what" and the "how."
* **Content & Layout:**
  * **Formula Breakdown:** Interactive LaTeX-like blocks showing the `40/30/15/15` blend weights.
  * **Normalizing Logic Explainer:** Detailed cards detailing how data ranges are clamped and mapped to `-1.0..+1.0`:
    * *Fear & Greed:* Linear shift (`(value - 50) / 50`)
    * *Funding Rates:* Margin-capped relative leverage scale (`rate / 0.001`)
    * *Flash Layer & Reddit:* Natural Language Processing score ranges from Llama 3.1.
  * **AI Ingestion Explainer:** Flow chart showcasing scraping $\rightarrow$ cleanup $\rightarrow$ prompt formulation $\rightarrow$ Llama parsing.

### C. Future Roadmap (`/roadmap`)
* **Objective:** Community engagement. Outlines where we are going.
* **Features:**
  * **Interactive Status Timeline:** A vertical timeline (spring anim entrance) dividing enhancements into:
    * `Deployed Layers` (Flash, Historic, Funding, F&G).
    * `Phase 2: Orderbook Dynamics` (Orderbook imbalance, Net flows, Whale wallets).
    * `Phase 3: Deep NLP Expansion` (X/Twitter APIs, Telegram bots, Youtube transcription).
    * `Phase 4: Auto Alert Agents` (Webhooks, Discord alerts).

### D. Ingested News Feed (`/feed`)
* **Objective:** Direct database access. Shows the raw feeds of posts and articles that drive the sentiment scores.
* **Features:**
  * **Direct Server Query:** Server Components querying `db.query.rawPosts.findMany`.
  * **Filters Bar:** Interactive tabs to filter by asset (`All`, `BTC`, `ETH`, `SOL`) and source type (`Reddit`, `CoinGecko`, `News RSS`).
  * **CMD Tabular Feed Rows:** A clean, monospaced view showing details of each raw item (Title, Timestamp, Upvote/Comment counts, Source Link).

### E. RSS News Stream (`/news`)
* **Objective:** Dedicated news aggregator. Focuses specifically on traditional publications and aggregated CoinGecko news.
* **Features:**
  * Displays latest articles with publication sources (e.g. CoinDesk, Decrypt, Cointelegraph).
  * Grouped search filters and article text previews.

### F. Quantitative Markets Page (`/markets`)
* **Objective:** Professional quant cockpit. Compares price, cap, volume, and community indicators.
* **Features:**
  * Displays live price, 24h price change, market cap, and 24h trading volume.
  * **Volume Momentum Metrics:** Compares current 24h volume against the 7-day average (`volume24h / volume7dAvg`) to identify sudden trading surges.
  * **Community Metrics:** Compares CoinGecko community votes (`geckoSentimentUp` vs `geckoSentimentDown`), Reddit subscribers, and Twitter followers.

### G. Suggested Page: Weight Simulator (`/simulator`)
* **Objective:** High interactivity. Lets users play with the formula weights and simulate scores.
* **Features:**
  * **Interactive Range Sliders:** Adjust weights for the 4 layers (constrained so the sum always equals 100%).
  * **Live Simulated Line Graph:** Instantly recalculates the 24-hour sentiment scores using the custom weights and plots the new line dynamically in SVG.

---

## 3. Visual & Motion Choreography
* **Global Navigation**: A sticky header across all pages with custom blur `backdrop-blur-xl bg-[#050505]/60`.
* **Page Transitions**: Every page is wrapped in a Framer Motion container with standard exit/enter spring animation fades.
* **Double-Bezel Consistency**: All panels across the methodology, roadmap, and simulator pages use the nested Doppelrand frame layout.

---

## Proposed Changes

### [Multi-Page Frontend]

#### [NEW] [frontend-implementation.md](file:///C:/Users/ajink/OneDrive/Desktop/personal%20-%20coding%20-%20ventures/crypto-mood/frontend-implementation.md)
* Update plan file in project root.

#### [NEW] [app/components/GlobalNav.tsx](file:///C:/Users/ajink/OneDrive/Desktop/personal%20-%20coding%20-%20ventures/crypto-mood/app/components/GlobalNav.tsx)
* Shared navbar layout component containing link indicators.

#### [NEW] [app/dashboard/page.tsx](file:///C:/Users/ajink/OneDrive/Desktop/personal%20-%20coding%20-%20ventures/crypto-mood/app/dashboard/page.tsx)
* Wraps the existing `<Dashboard />` client container for the `/dashboard` path.

#### [NEW] [app/methodology/page.tsx](file:///C:/Users/ajink/OneDrive/Desktop/personal%20-%20coding%20-%20ventures/crypto-mood/app/methodology/page.tsx)
* Algorithm visualization and formulas page.

#### [NEW] [app/roadmap/page.tsx](file:///C:/Users/ajink/OneDrive/Desktop/personal%20-%20coding%20-%20ventures/crypto-mood/app/roadmap/page.tsx)
* Vertical status timeline detailing future features.

#### [NEW] [app/feed/page.tsx](file:///C:/Users/ajink/OneDrive/Desktop/personal%20-%20coding%20-%20ventures/crypto-mood/app/feed/page.tsx)
* Server Component querying latest raw ingested data records directly from PostgreSQL.

#### [NEW] [app/news/page.tsx](file:///C:/Users/ajink/OneDrive/Desktop/personal%20-%20coding%20-%20ventures/crypto-mood/app/news/page.tsx)
* News page showing traditional publication RSS streams.

#### [NEW] [app/markets/page.tsx](file:///C:/Users/ajink/OneDrive/Desktop/personal%20-%20coding%20-%20ventures/crypto-mood/app/markets/page.tsx)
* Quantitative comparisons page showing volume momentum, market cap, and community metrics.

#### [NEW] [app/simulator/page.tsx](file:///C:/Users/ajink/OneDrive/Desktop/personal%20-%20coding%20-%20ventures/crypto-mood/app/simulator/page.tsx)
* Custom weights slider dashboard linked to interactive SVG plotting.

#### [MODIFY] [app/page.tsx](file:///C:/Users/ajink/OneDrive/Desktop/personal%20-%20coding%20-%20ventures/crypto-mood/app/page.tsx)
* Replace current Dashboard direct mount with the new visual landing page layout.

---

## Verification Plan

### Automated Tests
* Run `npm run lint` and `npm run build` to confirm all routes generate correctly without static build or typing errors.

### Manual Verification
* Run dev server (`npm run dev`) and click through all pages: `/`, `/dashboard`, `/methodology`, `/roadmap`, `/feed`, `/news`, `/markets`, and `/simulator` to verify paths, active link markers, transitions, and sliders.
