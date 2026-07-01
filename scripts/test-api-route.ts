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
      console.log(`Success! Ticker: ${json.ticker.symbol} (${json.ticker.name})`);
      console.log(`Blended Sentiment Score: ${json.sentiment.score}`);
      console.log(`Blended Sentiment Label: ${json.sentiment.label}`);
      console.log(`Meta:`, json.meta);
    } else {
      console.error(`Error Response:`, json);
    }
  } catch (err: any) {
    console.error(`Route crashed with error:`, err);
  }
}

async function run() {
  // Mock Next.js globals if necessary, or just run the GET handler
  // Wait, NextRequest needs a valid URL
  await testRoute("BTC");
  await testRoute("ETH");
  await testRoute("SOL");
}

run().then(() => process.exit(0));
