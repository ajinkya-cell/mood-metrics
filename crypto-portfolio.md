{
    id: 1,
    title: "MoodMetrics (crypto-mood)",
    description: "MoodMetrics is a real-time cryptocurrency sentiment analysis engine that aggregates market sentiment from Reddit, CoinGecko, crypto news RSS, Binance funding rates, and the Fear & Greed Index. It uses AI (Nvidia NIM — Llama 3.1 8B) to analyze social posts and generate a blended sentiment score for major cryptocurrencies (BTC, ETH, SOL). Built with Next.js 16 and Drizzle ORM on Neon PostgreSQL, it features a tactical dashboard, AI Records viewer, strategy backtester, advanced quantitative tools (lag correlation, narrative clustering, whale vs. retail analysis), and a retro terminal-style loading screen — all wrapped in a premium dark UI with spring micro-interactions.",
    bigDes: [
      "Built a real-time multi-layer sentiment aggregation engine that fuses data from 5 independent sources — Reddit AI analysis, CoinGecko news, crypto RSS feeds, Binance perpetual funding rates, and the Fear & Greed Index — into a single blended sentiment score with configurable weightings (45/35/15/5).",
      "Integrated Llama 3.1 8B via Nvidia NIM for AI-powered sentiment classification, complete with a custom JSON fallback parser that extracts label, score, confidence, and reasoning from LLM output. Added pgvector embeddings for semantic similarity search across historical AI verdicts.",
      "Engineered a robust Reddit scraper with 8 anti-blocking defenses including exponential backoff, user-agent rotation, sequential execution with randomized jitter, Retry-After header respect, and an Arctic Shift fallback API — achieving reliable subreddit ingestion under aggressive rate limits.",
      "Replaced a paid ScrapeGraphAI news extraction pipeline with a custom Cheerio-based scraper that intelligently removes noise tags (scripts, footers, ads, sidebars), probes multiple container selectors, and validates articles against tracked tickers before insertion.",
      "Built a strategy backtester that simulates sentiment-driven trading strategies against historical database records with entry/exit condition limits, Monte Carlo fallback pricing, and comparative benchmark yield plots against passive hold.",
      "Implemented advanced quantitative tools: Lag Correlation analysis between sentiment and price across multiple time offsets, AI Narrative 2D projection using UMAP-like dimensionality reduction, Temporal Narrative Trajectory tracking via leader clustering on vector embeddings, and a Whale vs. Retail Crossover Index grounded in real database telemetry.",
      "Designed a premium dark UI with tactical aesthetic — animated SVG arc horizon masks, floating particle canvases, spring-animated sentiment gauge needles, retro CRT terminal loader with rotating crypto history facts, Obsidian-style guestbook dot grid, and hover-triggered typographic animations using Instrument Serif.",
      "Built the entire ingestion pipeline on cron-job.org with two scheduled jobs (30-min flash scraper, 6-hour Reddit batch), a scrape_cache table for duplicate prevention, and pre-computed 1-hour timeseries rollups with recency decay, source credibility weights, and log-scaled upvote boosts."
    ],
    images: [
      "/projects/crypto-mood/dashboard.png",
      "/projects/crypto-mood/records.png",
      "/projects/crypto-mood/backtester.png",
      "/projects/crypto-mood/advanced.png",
      "/projects/crypto-mood/landing.png",
    ],
    github: "https://github.com/ajinkya-cell/crypto-mood",
    liveDemo: "https://crypto-mood.vercel.app/",
    tags: ["Next.js", "TypeScript", "AI Sentiment", "PostgreSQL", "Web Scraping", "Data Visualization"],
    tagLogos: [
      { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
      { node: <SiTypescript />, title: "TypeScript", href: "https://www.typescriptlang.org/" },
      { node: <SiTailwindcss />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
      { node: <SiPostgresql />, title: "PostgreSQL", href: "https://www.postgresql.org/" },
      { node: <SiDrizzle />, title: "Drizzle ORM", href: "https://orm.drizzle.team" },
      { node: <SiReact />, title: "React", href: "https://react.dev" },
      { node: <SiVercel />, title: "Vercel", href: "https://vercel.com" },
      { node: <SiNvidia />, title: "Nvidia NIM", href: "https://www.nvidia.com/en-us/ai/" },
      { node: <SiReddit />, title: "Reddit API", href: "https://www.reddit.com/dev/api/" },
    ]
  }
