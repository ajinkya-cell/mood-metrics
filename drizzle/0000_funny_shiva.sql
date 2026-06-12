CREATE TYPE "public"."interval_type" AS ENUM('1h', '4h', '1d');--> statement-breakpoint
CREATE TYPE "public"."sentiment_label" AS ENUM('bullish', 'bearish', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('reddit', 'coingecko', 'news_rss');--> statement-breakpoint
CREATE TABLE "raw_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticker_id" uuid NOT NULL,
	"source_type" "source_type" NOT NULL,
	"external_id" varchar(500),
	"title" varchar(500),
	"content" text NOT NULL,
	"author" varchar(200),
	"url" varchar(1000),
	"upvotes" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"posted_at" timestamp NOT NULL,
	"scraped_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticker_id" uuid NOT NULL,
	"source_type" "source_type" NOT NULL,
	"last_fetched_at" timestamp DEFAULT now() NOT NULL,
	"post_count" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'success',
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "sentiment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"ticker_id" uuid NOT NULL,
	"label" "sentiment_label" NOT NULL,
	"score" numeric(4, 3) NOT NULL,
	"confidence" numeric(4, 3),
	"reasoning" text,
	"analyzed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sentiment_records_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE TABLE "sentiment_timeseries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticker_id" uuid NOT NULL,
	"source_type" "source_type",
	"bucket_start" timestamp NOT NULL,
	"interval" interval_type NOT NULL,
	"avg_score" numeric(5, 4),
	"total_posts" integer DEFAULT 0 NOT NULL,
	"bullish_count" integer DEFAULT 0 NOT NULL,
	"bearish_count" integer DEFAULT 0 NOT NULL,
	"neutral_count" integer DEFAULT 0 NOT NULL,
	"volume_weighted_score" numeric(5, 4)
);
--> statement-breakpoint
CREATE TABLE "tickers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"coingecko_id" varchar(100),
	"reddit_name" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tickers_symbol_unique" UNIQUE("symbol"),
	CONSTRAINT "tickers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "raw_posts" ADD CONSTRAINT "raw_posts_ticker_id_tickers_id_fk" FOREIGN KEY ("ticker_id") REFERENCES "public"."tickers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_cache" ADD CONSTRAINT "scrape_cache_ticker_id_tickers_id_fk" FOREIGN KEY ("ticker_id") REFERENCES "public"."tickers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentiment_records" ADD CONSTRAINT "sentiment_records_post_id_raw_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."raw_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentiment_records" ADD CONSTRAINT "sentiment_records_ticker_id_tickers_id_fk" FOREIGN KEY ("ticker_id") REFERENCES "public"."tickers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentiment_timeseries" ADD CONSTRAINT "sentiment_timeseries_ticker_id_tickers_id_fk" FOREIGN KEY ("ticker_id") REFERENCES "public"."tickers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "raw_posts_ticker_idx" ON "raw_posts" USING btree ("ticker_id");--> statement-breakpoint
CREATE INDEX "raw_posts_posted_at_idx" ON "raw_posts" USING btree ("posted_at");--> statement-breakpoint
CREATE INDEX "raw_posts_source_idx" ON "raw_posts" USING btree ("source_type");--> statement-breakpoint
CREATE UNIQUE INDEX "raw_posts_external_id_unique" ON "raw_posts" USING btree ("external_id","source_type");--> statement-breakpoint
CREATE UNIQUE INDEX "scrape_cache_unique" ON "scrape_cache" USING btree ("ticker_id","source_type");--> statement-breakpoint
CREATE INDEX "sentiment_ticker_idx" ON "sentiment_records" USING btree ("ticker_id");--> statement-breakpoint
CREATE INDEX "sentiment_analyzed_at_idx" ON "sentiment_records" USING btree ("analyzed_at");--> statement-breakpoint
CREATE INDEX "ts_ticker_bucket_idx" ON "sentiment_timeseries" USING btree ("ticker_id","bucket_start");--> statement-breakpoint
CREATE UNIQUE INDEX "ts_unique_bucket" ON "sentiment_timeseries" USING btree ("ticker_id","bucket_start","interval","source_type");