CREATE TABLE IF NOT EXISTS "guestbook_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"connections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS "raw_posts_external_id_unique";--> statement-breakpoint
ALTER TABLE "sentiment_records" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "sentiment_timeseries" ADD COLUMN IF NOT EXISTS "spot_price" numeric(20, 8);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "raw_posts_external_id_ticker_unique" ON "raw_posts" USING btree ("external_id","source_type","ticker_id");