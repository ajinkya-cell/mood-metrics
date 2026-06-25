import React from "react";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { rawPosts, tickers } from "@/lib/db/schema";
import { desc, eq, and, or } from "drizzle-orm";
import { Newspaper, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import DoubleBezel from "../components/DoubleBezel";

export const metadata = {
  title: "Publications News Feed | MoodMetrics",
  description: "View traditional RSS publications news and CoinGecko reports extracted by our ingestion layers.",
};

type PageProps = {
  searchParams: Promise<{
    symbol?: string;
  }>;
};

export default async function NewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeSymbol = (params.symbol ?? "ALL").toUpperCase();

  // ── Construct SQL Where clauses ──
  const whereConditions = [
    or(
      eq(rawPosts.sourceType, "news_rss"),
      eq(rawPosts.sourceType, "coingecko")
    )
  ];

  if (activeSymbol !== "ALL") {
    whereConditions.push(eq(tickers.symbol, activeSymbol));
  }

  // Fetch only publication articles
  const newsItems = await db
    .select({
      id: rawPosts.id,
      title: rawPosts.title,
      content: rawPosts.content,
      sourceType: rawPosts.sourceType,
      author: rawPosts.author,
      url: rawPosts.url,
      postedAt: rawPosts.postedAt,
      tickerSymbol: tickers.symbol,
      tickerName: tickers.name,
    })
    .from(rawPosts)
    .innerJoin(tickers, eq(rawPosts.tickerId, tickers.id))
    .where(and(...whereConditions))
    .orderBy(desc(rawPosts.postedAt))
    .limit(50);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 select-none overflow-hidden pb-20 font-mono">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-[#0C0C0E] text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-500 font-bold mb-4">
            <Newspaper size={12} />
            PUBLICATION ARCHIVES
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-sans">
            Traditional News Feed
          </h1>
          <p className="text-zinc-500 text-sm mt-1 max-w-2xl font-sans">
            Dedicated stream of aggregated traditional RSS publications and curated market updates.
          </p>
        </div>

        <span className="text-[10px] text-zinc-600 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full font-bold">
          TOTAL READOUT: {newsItems.length} ARTICLES
        </span>
      </div>

      {/* Asset coordinates filter */}
      <div className="flex flex-wrap items-center gap-2 mb-8 bg-zinc-950/20 p-4 border border-white/5 rounded-2xl">
        <span className="text-[10px] text-zinc-600 font-bold uppercase mr-3">
          FILTER BY ASSET:
        </span>
        {["ALL", "BTC", "ETH", "SOL"].map((sym) => (
          <Link
            key={sym}
            href={`/news?symbol=${sym}`}
            className={`px-3.5 py-1 rounded-md text-[10.5px] border transition-all duration-300 ${
              activeSymbol === sym
                ? "bg-white/10 border-white/10 text-white font-bold"
                : "bg-black/40 border-white/5 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {sym}
          </Link>
        ))}
      </div>

      {/* Grid Layout of news articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {newsItems.length === 0 ? (
          <div className="col-span-full text-center py-20 text-zinc-500 border border-white/5 rounded-2xl bg-[#0C0C0E]/40 font-sans text-xs">
            No publication articles found matching the active asset coordinate query.
          </div>
        ) : (
          newsItems.map((item) => {
            // Extrapolate publisher domain or name
            let publisher = item.author || "News Source";
            if (item.url) {
              try {
                const domain = new URL(item.url).hostname.replace("www.", "");
                publisher = domain.charAt(0).toUpperCase() + domain.slice(1);
              } catch {}
            }

            return (
              <DoubleBezel key={item.id} className="flex flex-col h-72">
                <div className="flex flex-col justify-between h-full p-6">
                  {/* Article header details */}
                  <div className="flex justify-between items-baseline text-[9.5px] text-zinc-500 border-b border-white/5 pb-2 mb-3">
                    <span className="uppercase text-emerald-400 font-bold">
                      [{publisher}]
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-400">
                      {item.tickerSymbol}
                    </span>
                  </div>

                  {/* Title & snippet */}
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-white mb-2 leading-relaxed font-sans line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-sans line-clamp-4">
                      {item.content}
                    </p>
                  </div>

                  {/* Footer details */}
                  <div className="flex justify-between items-center text-[9px] text-zinc-600 border-t border-white/5 pt-3 mt-3">
                    <span>
                      PUBLISHED:{" "}
                      {new Date(item.postedAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-zinc-500 hover:text-zinc-300 underline font-bold"
                      >
                        FULL ARTICLE <ArrowSquareOut size={8} />
                      </a>
                    )}
                  </div>
                </div>
              </DoubleBezel>
            );
          })
        )}
      </div>
    </div>
  );
}
