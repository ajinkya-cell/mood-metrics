import { GET } from "../app/api/analyze/route";
import { NextRequest } from "next/server";

async function testRoute(symbol: string) {
  console.log(`\n=== Testing /api/analyze for ${symbol} ===`);
  const req = new NextRequest(`http://localhost:3000/api/analyze?symbol=${symbol}`);
  
  try {
    const res = await GET(req);
    console.log(`Status Code: ${res.status}`);
    const json = await res.json();
    if (res.status === 200) {
      console.log(`✅ Success! Ticker: ${json.ticker.symbol}`);
      console.log(`   Blended Sentiment Score: ${json.sentiment.score}`);
      console.log(`   Label: ${json.sentiment.label}`);
      console.log(`   L1 (Flash posts used): ${json.meta.flashPostsUsed}`);
      console.log(`   L2 (Historic buckets used): ${json.meta.historicBucketsUsed}`);
    } else {
      console.error(`❌ Error Response:`, json);
    }
  } catch (err: any) {
    console.error(`💥 Route crashed with error:`, err);
  }
}

async function run() {
  await testRoute("BTC");
  await testRoute("ETH");
  await testRoute("SOL");
}

run().then(() => process.exit(0));
