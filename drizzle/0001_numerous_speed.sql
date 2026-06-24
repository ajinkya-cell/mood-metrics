CREATE TABLE "market_indicators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticker_id" uuid,
	"indicator_type" varchar(50) NOT NULL,
	"value" numeric(12, 6) NOT NULL,
	"label" varchar(50),
	"metadata" jsonb,
	"collected_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "market_indicators" ADD CONSTRAINT "market_indicators_ticker_id_tickers_id_fk" FOREIGN KEY ("ticker_id") REFERENCES "public"."tickers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mi_ticker_type_idx" ON "market_indicators" USING btree ("ticker_id","indicator_type");--> statement-breakpoint
CREATE INDEX "mi_collected_at_idx" ON "market_indicators" USING btree ("collected_at");