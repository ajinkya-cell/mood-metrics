import React from "react";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { rawPosts, tickers } from "@/lib/db/schema";
import { desc, eq, and, or } from "drizzle-orm";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import DoubleBezel from "../components/DoubleBezel";
import { PageShell, PageHero } from "../components/editorial";

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
    <PageShell>
      <PageHero micro="Publication archives" lead="The news," accent="aggregated" description="A dedicated stream of traditional RSS publications and curated market updates." aside={<span className="ed-tag">{newsItems.length} articles</span>} />
      <div className="px-4 md:px-5 py-5 border-t border-[var(--ed-border)]">
      {/* Asset coordinates filter */}
      <div className="flex flex-wrap items-center gap-2 mb-8 ed-bento p-4">
        <span className="text-[10px] text-zinc-600 font-bold uppercase mr-3">
          FILTER BY ASSET:
        </span>
        {["ALL", "BTC", "ETH", "SOL"].map((sym) => (
          <Link
            key={sym}
            href={`/news?symbol=${sym}`}
            className={`px-3.5 py-1 rounded-md text-[10.5px] border transition-all duration-300 ${
              activeSymbol === sym
                ? "bg-white/10 border-[var(--ed-border)] text-white font-bold"
                : "bg-black/40 border-[var(--ed-border)] text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {sym}
          </Link>
        ))}
      </div>

      {/* Grid Layout of news articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {newsItems.length === 0 ? (
          <div className="col-span-full text-center py-20 text-zinc-500 border border-[var(--ed-border)] rounded-2xl bg-[var(--ed-card)]/40 font-sans text-xs">
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
                  <div className="flex justify-between items-baseline text-[9.5px] text-zinc-500 border-b border-[var(--ed-border)] pb-2 mb-3">
                    <span className="uppercase text-emerald-400 font-bold">
                      [{publisher}]
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-[var(--ed-border)] text-zinc-400">
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
                  <div className="flex justify-between items-center text-[9px] text-zinc-600 border-t border-[var(--ed-border)] pt-3 mt-3">
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
    </PageShell>
  );
}
