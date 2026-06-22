# crypto-mood — Project Context

## What is this?

A **Next.js** app that aggregates crypto market sentiment from multiple sources (Reddit, CoinGecko, crypto news RSS), analyzes posts with **AI (Anthropic Claude)**, and produces a blended sentiment score for major cryptocurrencies (BTC, ETH, SOL).

---

## Architecture (Two-Layer Sentiment)

```
                     ┌──────────────────────────────────────┐
                     │         CRON SCHEDULERS              │
                     │  Flash (30min): CoinGecko + News RSS │
                     │  Historic (6h): Reddit + AI analyze  │
                     └──────┬──────────────┬────────────────┘
                            │              │
                ┌───────────▼──┐    ┌──────▼──────────┐
                │  FLASH LAYER │    │ HISTORIC LAYER  │
                │  (60%)       │    │ (40%)           │
                │              │    │                 │
                │ coingecko.ts │    │ reddit.ts       │
                │ news.ts      │    │ sentiment.ts    │
                └───────┬──────┘    └────────┬────────┘
                        │                    │
                        └────────┬───────────┘
                                 │
                      ┌──────────▼──────────┐
                      │    /api/analyze     │
                      │  Blends 60/40       │
                      │  Returns JSON       │
                      └─────────────────────┘
```

- **Flash Layer** (runs every 30 min) — CoinGecko API + crypto news RSS feeds
- **Historical Layer** (runs every 6 hours) — Reddit subreddit scraping + AI analysis
- **Blend** — `analyze` endpoint blends 60% flash / 40% historical

---

## Tech Stack

| Category | Library | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 16.2.9 | App Router |
| UI | React | 19.2.4 | — |
| Language | TypeScript | ^5 | — |
| Styling | Tailwind CSS | ^4 | Utility-first CSS |
| Font | Geist | bundled | Vercel font family |
| Database | Drizzle ORM + Neon (PostgreSQL) | 0.45.2 | Type-safe SQL |
| AI | Vercel AI SDK + Anthropic Claude Haiku 4.5 | 6.0.208 | Sentiment analysis |
| Scraping | cheerio + rss-parser | 1.2.0 / 3.13.0 | News extraction |

---

## Database Schema (5 tables + 3 enums)

### Enums
- `sentiment_label` — `bullish` / `bearish` / `neutral`
- `source_type` — `reddit` / `coingecko` / `news_rss`
- `interval_type` — `1h` / `4h` / `1d`

### Tables
1. **`tickers`** — Crypto metadata (symbol, name, coingecko_id, reddit_name, is_active)
2. **`raw_posts`** — Scraped posts from all sources (ticker FK, source_type, title, content, url, upvotes, posted_at)
3. **`sentiment_records`** — AI analysis per post (post_id FK, ticker FK, label, score -1..1, confidence 0..1, reasoning)
4. **`sentiment_timeseries`** — Pre-aggregated hourly buckets (ticker FK, bucket_start, interval, avg_score, bullish/bearish/neutral counts)
5. **`scrape_cache`** — Prevents redundant scraping (ticker + source_type unique, last_fetched_at, status, error)

---

## Key Files

| File | Role |
|---|---|
| `app/api/analyze/route.ts` | `GET /api/analyze?symbol=BTC` — blends & returns sentiment |
| `app/api/cron/scrape-flash/route.ts` | `POST` — CoinGecko + news RSS (30 min cron) |
| `app/api/cron/scrape-reddit/route.ts` | `POST` — Reddit scrape + AI + timeseries (6h cron) |
| `app/api/search/route.ts` | `GET /api/search?q=bit` — ticker search |
| `lib/db/schema.ts` | Full Drizzle schema |
| `lib/db/client.ts` | Neon + Drizzle client |
| `lib/db/seed.ts` | Seeds BTC/ETH/SOL tickers |
| `lib/scrapers/coingecko.ts` | CoinGecko price + news scraper |
| `lib/scrapers/news.ts` | RSS news scraper (cheerio) |
| `lib/scrapers/news-scrapegraph.ts` | **Legacy** — replaced by news.ts |
| `lib/scrapers/reddit.ts` | Reddit scraper (8 defenses) |
| `lib/ai/sentiment.ts` | AI analysis engine (Claude Haiku) |

---

## API Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/analyze?symbol=BTC` | None | Get blended sentiment |
| POST | `/api/cron/scrape-flash` | Bearer CRON_SECRET | Scrape CoinGecko + RSS |
| POST | `/api/cron/scrape-reddit` | Bearer CRON_SECRET | Scrape Reddit + AI analyze |
| GET | `/api/search?q=bit` | None | Search tickers |

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `REDDIT_CLIENT_ID` | Reddit script app (unused — uses public JSON API) |
| `REDDIT_CLIENT_SECRET` | (unused) |
| `REDDIT_USERNAME` | (unused) |
| `REDDIT_PASSWORD` | (unused) |
| `SCRAPEGRAPH_API_KEY` | Legacy scraper only |
| `OPENAI_API_KEY` | Configured but unused (uses Anthropic) |
| `CRON_SECRET` | Shared secret for cron auth |
| `NODE_ENV` | `development` |

---

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npx tsx lib/db/seed.ts` | Seed BTC/ETH/SOL tickers |

---

## Key Design Decisions

- **Reddit uses public JSON API** (no OAuth) — OAuth creds in `.env` are unused
- **News scraper uses Cheerio** (free) — migrated from ScrapeGraphAI (paid)
- **AI uses Claude Haiku** — cheapest/fastest Claude model; 50 posts max per run with 200ms delays
- **pnpm** is preferred package manager (but npm lockfiles exist)
- **No frontend yet** — `app/page.tsx` is still the default Next.js starter; all functionality is API-only
- **No tests** — no test framework is set up
- **Serverless-ready** — built for Vercel + Neon HTTP driver

---

## Git History

```
f430a4e  2026-06-21  added : news with cheerio && removed : news scrapegraphai
16ea01e  2026-06-15  updated : coingecko scrapper
6e6b84c  2026-06-15  added : news scrapper
b2d636f  2026-06-15  added : reddit scraper
45c5c41  2026-06-14  added : coingecko scraper
476ca2e  2026-06-12  work : db ready for phase 1
9c8db16  2026-06-12  Initial commit from Create Next App
```

---

## Next Steps / Known Gaps

- [ ] Build a frontend UI (dashboard, charts, etc.)
- [ ] Add proper README with project docs
- [ ] Add tests
- [ ] Decide on single package manager (pnpm vs npm)
- [ ] Wire up Reddit OAuth if public JSON API rate-limits become an issue
