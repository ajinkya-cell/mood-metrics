import Parser from "rss-parser";

async function testDataAcquisition() {
  console.log("=== TESTING ARCTIC SHIFT TIME RANGES & SUBREDDITS ===");
  
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = now - 7 * 24 * 60 * 60;

  const testUrls = [
    `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=bitcoin&limit=100&sort=desc`,
    `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=BitcoinMarkets&limit=50&sort=desc`,
    `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=btc&limit=50&sort=desc`,
    `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=ethereum&limit=100&sort=desc`,
    `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=ethtrader&limit=50&sort=desc`,
    `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=solana&limit=100&sort=desc`,
    `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=CryptoMarkets&limit=100&sort=desc`,
    `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=bitcoin&limit=50&before=${sevenDaysAgo}&sort=desc`,
  ];

  for (const u of testUrls) {
    try {
      const res = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
      if (res.ok) {
        const json: any = await res.json();
        const posts = json?.data ?? [];
        const oldest = posts[posts.length - 1];
        const oldestDate = oldest ? new Date(oldest.created_utc * 1000).toISOString() : "none";
        const newest = posts[0];
        const newestDate = newest ? new Date(newest.created_utc * 1000).toISOString() : "none";
        console.log(`[OK] ${u.split("?")[1]}: ${posts.length} posts (Range: ${oldestDate} to ${newestDate})`);
      } else {
        console.log(`[FAIL] ${u}: HTTP ${res.status}`);
      }
    } catch (e: any) {
      console.log(`[ERR] ${u}:`, e.message);
    }
  }

  console.log("\n=== TESTING NEWS DATA SOURCES ===");
  // Test CryptoCompare Free News API
  try {
    const ccRes = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN");
    if (ccRes.ok) {
      const ccJson: any = await ccRes.json();
      console.log(`[OK] CryptoCompare News API: ${ccJson.Data?.length} articles returned. Sample: "${ccJson.Data?.[0]?.title}" (${new Date(ccJson.Data?.[0]?.published_on * 1000).toISOString()})`);
    } else {
      console.log(`[FAIL] CryptoCompare News: HTTP ${ccRes.status}`);
    }
  } catch (e: any) {
    console.log(`[ERR] CryptoCompare News:`, e.message);
  }

  // Test Google News RSS
  const gNewsUrls = [
    "https://news.google.com/rss/search?q=Bitcoin+cryptocurrency&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=Ethereum+cryptocurrency&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=Solana+crypto&hl=en-US&gl=US&ceid=US:en",
  ];

  const parser = new Parser();
  for (const gUrl of gNewsUrls) {
    try {
      const feed = await parser.parseURL(gUrl);
      console.log(`[OK] Google News RSS (${gUrl.split("q=")[1].split("&")[0]}): ${feed.items.length} items. Latest: "${feed.items[0]?.title}" (${feed.items[0]?.pubDate})`);
    } catch (e: any) {
      console.log(`[ERR] Google News RSS:`, e.message);
    }
  }
}

testDataAcquisition().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
