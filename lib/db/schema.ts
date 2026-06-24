import { 
  boolean, 
  index, 
  integer, 
  numeric, 
  pgEnum, 
  pgTable, 
  text, 
  timestamp, 
  uniqueIndex, 
  uuid, 
  varchar,
  jsonb
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const sentimentLabelEnum = pgEnum("sentiment_label", [
  "bullish",
  "bearish",
  "neutral"
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "reddit",
  "coingecko",
  "news_rss"
]);

export const intervalEnum = pgEnum("interval_type", ["1h", "4h", "1d"]);

// ─── Tickers ──────────────────────────────────────────────────────────────────

export const tickers = pgTable("tickers", {
  id: uuid("id").defaultRandom().primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  coingeckoId: varchar("coingecko_id", { length: 100 }),
  redditName: varchar("reddit_name", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// ─── Raw Posts ────────────────────────────────────────────────────────────────

export const rawPosts = pgTable("raw_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tickerId: uuid("ticker_id")
    .references(() => tickers.id, { onDelete: "cascade" })
    .notNull(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  externalId: varchar("external_id", { length: 500 }),
  title: varchar("title", { length: 500 }),
  content: text("content").notNull(),
  author: varchar("author", { length: 200 }),
  url: varchar("url", { length: 1000 }),
  upvotes: integer("upvotes").default(0),
  commentCount: integer("comment_count").default(0),
  postedAt: timestamp("posted_at").notNull(),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull()
},
(t) => [
  index("raw_posts_ticker_idx").on(t.tickerId),
  index("raw_posts_posted_at_idx").on(t.postedAt),
  index("raw_posts_source_idx").on(t.sourceType),
  uniqueIndex("raw_posts_external_id_unique").on(t.externalId, t.sourceType),
]);

// ─── Sentiment Records ────────────────────────────────────────────────────────

export const sentimentRecords = pgTable("sentiment_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .references(() => rawPosts.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  tickerId: uuid("ticker_id")
    .references(() => tickers.id, { onDelete: "cascade" })
    .notNull(),
  label: sentimentLabelEnum("label").notNull(),
  score: numeric("score", { precision: 4, scale: 3 }).notNull(),
  confidence: numeric("confidence", { precision: 4, scale: 3 }),
  reasoning: text("reasoning"),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
},
(t) => [
  index("sentiment_ticker_idx").on(t.tickerId),
  index("sentiment_analyzed_at_idx").on(t.analyzedAt)
]);

// ─── Sentiment Timeseries ─────────────────────────────────────────────────────

export const sentimentTimeseries = pgTable("sentiment_timeseries", {
  id: uuid("id").defaultRandom().primaryKey(),
  tickerId: uuid("ticker_id")
    .references(() => tickers.id, { onDelete: "cascade" })
    .notNull(),
  sourceType: sourceTypeEnum("source_type"), // Fixed case typing here
  bucketStart: timestamp("bucket_start").notNull(),
  interval: intervalEnum("interval").notNull(),
  avgScore: numeric("avg_score", { precision: 5, scale: 4 }),
  totalPosts: integer("total_posts").default(0).notNull(),
  bullishCount: integer("bullish_count").default(0).notNull(),
  bearishCount: integer("bearish_count").default(0).notNull(),
  neutralCount: integer("neutral_count").default(0).notNull(),
  volumeWeightedScore: numeric("volume_weighted_score", { precision: 5, scale: 4 }),
},
(t) => [
  index("ts_ticker_bucket_idx").on(t.tickerId, t.bucketStart),
  uniqueIndex("ts_unique_bucket").on(
    t.tickerId,
    t.bucketStart,
    t.interval,
    t.sourceType // Fixed case tracking here
  )
]);

// ─── Scrape Cache ─────────────────────────────────────────────────────────────

export const scrapeCache = pgTable("scrape_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  tickerId: uuid("ticker_id")
    .references(() => tickers.id, { onDelete: "cascade" })
    .notNull(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  lastFetchedAt: timestamp("last_fetched_at").defaultNow().notNull(),
  postCount: integer("post_count").default(0),
  status: varchar("status", { length: 20 }).default("success"), // Fixed trailing space typo here
  errorMessage: text("error_message")
},
(t) => [
  uniqueIndex("scrape_cache_unique").on(t.tickerId, t.sourceType),
]);

// ─── Market Indicators ────────────────────────────────────────────────────────

export const marketIndicators = pgTable("market_indicators", {
  id:             uuid("id").defaultRandom().primaryKey(),
  tickerId:       uuid("ticker_id")
                    .references(() => tickers.id, { onDelete: "cascade" }),
  indicatorType:  varchar("indicator_type", { length: 50 }).notNull(),
  // 'fear_greed'  → global (tickerId is null)
  // 'funding_rate' → per-ticker (tickerId is set)
  value:          numeric("value", { precision: 12, scale: 6 }).notNull(),
  label:          varchar("label", { length: 50 }),
  // 'extreme fear' | 'fear' | 'neutral' | 'greed' | 'extreme greed' (F&G)
  // 'bullish' | 'bearish' | 'neutral' (funding rate classification)
  metadata:       jsonb("metadata"),
  // Extra data: annualizedRate for funding, timestamp various sources
  collectedAt:    timestamp("collected_at").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("mi_ticker_type_idx").on(t.tickerId, t.indicatorType),
  index("mi_collected_at_idx").on(t.collectedAt),
]);

// ─── Type Inferences ──────────────────────────────────────────────────────────

export type Ticker = typeof tickers.$inferSelect;
export type NewTicker = typeof tickers.$inferInsert;
export type RawPost = typeof rawPosts.$inferSelect;
export type NewRawPost = typeof rawPosts.$inferInsert;
export type SentimentRecord = typeof sentimentRecords.$inferSelect;
export type NewSentimentRecord = typeof sentimentRecords.$inferInsert;
export type SentimentTimeseries = typeof sentimentTimeseries.$inferSelect;
export type ScrapeCache = typeof scrapeCache.$inferSelect;
export type MarketIndicator = typeof marketIndicators.$inferSelect;
export type NewMarketIndicator = typeof marketIndicators.$inferInsert;