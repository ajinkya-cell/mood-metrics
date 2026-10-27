import React from "react";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { rawPosts, tickers } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { ArrowSquareOut, Newspaper, RedditLogo } from "@phosphor-icons/react/dist/ssr";
import DoubleBezel from "../components/DoubleBezel";
import { PageShell, PageHero } from "../components/editorial";

export const metadata = {
  title: "Raw Ingestion Feed | MoodMetrics",
  description: "View raw ingested social posts and article streams currently stored in SQL database.",
};

type PageProps = {
  searchParams: Promise<{
    symbol?: string;
    source?: string;
  }>;
};

export default async function FeedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeSymbol = (params.symbol ?? "ALL").toUpperCase();
  const activeSource = (params.source ?? "ALL").toUpperCase();

  // ── Construct SQL Where clauses ──
  const whereConditions = [];

  if (activeSymbol !== "ALL") {
    whereConditions.push(eq(tickers.symbol, activeSymbol));
  }

  if (activeSource !== "ALL") {
    whereConditions.push(eq(rawPosts.sourceType, activeSource.toLowerCase() as "reddit" | "coingecko" | "news_rss"));
  }

  // Fetch from database with join
  const feedItems = await db
    .select({
      id: rawPosts.id,
      title: rawPosts.title,
      content: rawPosts.content,
      sourceType: rawPosts.sourceType,
      url: rawPosts.url,
      upvotes: rawPosts.upvotes,
      postedAt: rawPosts.postedAt,
      tickerSymbol: tickers.symbol,
      tickerName: tickers.name,
    })
    .from(rawPosts)
    .innerJoin(tickers, eq(rawPosts.tickerId, tickers.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(rawPosts.postedAt))
    .limit(50);

  return (
    <PageShell>
      <PageHero micro="Raw database ingest" lead="Straight from the" accent="crawlers" description="Raw posts and publications exactly as the crawlers ingested them, before AI labelling." aside={<span className="ed-tag">{feedItems.length} items</span>} />
      <div className="px-4 md:px-5 py-5 border-t border-[var(--ed-border)]">
      {/* Filter Tabs */}
      <div className="flex flex-col gap-4 mb-8 ed-bento p-4">
        {/* Tickers Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-zinc-600 font-bold uppercase mr-3">
            ASSET COORDINATES:
          </span>
          {["ALL", "BTC", "ETH", "SOL"].map((sym) => (
            <Link
              key={sym}
              href={`/feed?symbol=${sym}&source=${activeSource}`}
              className={`px-3 py-1 rounded-md text-[10.5px] border transition-all duration-300 ${
                activeSymbol === sym
                  ? "bg-white/10 border-[var(--ed-border)] text-white font-bold"
                  : "bg-black/40 border-[var(--ed-border)] text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {sym}
            </Link>
          ))}
        </div>

        {/* Sources Filter */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--ed-border)] pt-3">
          <span className="text-[10px] text-zinc-600 font-bold uppercase mr-3">
            FEED INGESTION CHANNELS:
          </span>
          {["ALL", "REDDIT", "COINGECKO", "NEWS_RSS"].map((src) => (
            <Link
              key={src}
              href={`/feed?symbol=${activeSymbol}&source=${src}`}
              className={`px-3 py-1 rounded-md text-[10.5px] border transition-all duration-300 ${
                activeSource === src
                  ? "bg-white/10 border-[var(--ed-border)] text-white font-bold"
                  : "bg-black/40 border-[var(--ed-border)] text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {src.replace("_", " ")}
            </Link>
          ))}
        </div>
      </div>

      {/* Ingestion feed stream */}
      <div className="space-y-4">
        {feedItems.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-[var(--ed-border)] rounded-2xl bg-[var(--ed-card)]/40 font-sans text-xs">
            No database records found matching the active coordinate query parameters.
          </div>
        ) : (
          feedItems.map((item) => {
            const isReddit = item.sourceType === "reddit";

            return (
              <DoubleBezel key={item.id} className="w-full">
                <div className="flex justify-between items-start mb-2 text-[10px] text-zinc-600 border-b border-[var(--ed-border)] pb-2">
                  <div className="flex items-center gap-2">
                    {isReddit ? (
                      <RedditLogo size={10} className="text-rose-500" />
                    ) : (
                      <Newspaper size={10} className="text-emerald-400" />
                    )}
                    <span className="font-bold uppercase text-zinc-500">
                      [{item.sourceType.replace("_", " ")}]
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-[var(--ed-border)] text-zinc-400">
                      {item.tickerSymbol}
                    </span>
                  </div>
                  <span>
                    INGESTED:{" "}
                    {new Date(item.postedAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white mb-2 leading-relaxed font-sans">
                  {item.title || "NO TITLE DETECTED"}
                </h3>

                <p className="text-[11px] text-zinc-500 leading-relaxed font-sans line-clamp-3 mb-3">
                  {item.content}
                </p>

                <div className="flex justify-between items-center text-[9px] text-zinc-600 font-mono">
                  <span>UPVOTES: {item.upvotes ?? 0}</span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-zinc-500 hover:text-zinc-300 underline font-bold"
                    >
                      REDIRECT TO NODE <ArrowSquareOut size={8} />
                    </a>
                  )}
                </div>
              </DoubleBezel>
            );
          })
        )}
      </div>
    </div>
    </PageShell>
  );
}
