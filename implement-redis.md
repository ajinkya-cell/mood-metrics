# Implementation Plan — Upstash Redis Caching & Scraper Locking

This plan outlines the integration of **Upstash Redis** into the project. It introduces serverless caching to speed up the dashboard API responses to ~20ms, and distributed locking to prevent duplicate concurrent scraper requests from rate-limiting our API keys.

---

## Technical Overview

- **Service:** Upstash Redis (serverless REST-based Redis client).
- **Libraries:** `@upstash/redis` (lightweight edge-compatible client).
- **Resilience Fallback:** The Redis client is designed to fall back gracefully to direct database queries if the Redis credentials are not configured in environment variables, ensuring that local development and builds work without configuration dependencies.

---

## Proposed Changes

### 1. Install Dependencies
We will install the `@upstash/redis` library.
- Command: `npm install @upstash/redis`

### 2. Configure Environment Variables
We will declare the new environment variables for local testing inside `.env`.
```bash
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

### 3. Create Redis Client Utility
We will create a helper client file.

#### [NEW] [client.ts (lib/redis)](file:///C:/Users/ajink/OneDrive/Desktop/personal%20-%20coding%20-%20ventures/crypto-mood/lib/redis/client.ts)
- Initialize the `@upstash/redis` client.
- Check for `process.env.UPSTASH_REDIS_REST_URL` and `process.env.UPSTASH_REDIS_REST_TOKEN`. If either is missing, export `redis = null` and log a warning to ensure local fallback runs cleanly.

### 4. Integrate Caching & Locking in API
We will update the dashboard's query endpoint to use Redis.

#### [MODIFY] [analyze/route.ts](file:///C:/Users/ajink/OneDrive/Desktop/personal%20-%20coding%20-%20ventures/crypto-mood/app/api/analyze/route.ts)
- **Cache Hit Check:** At the top of the route, check if `redis` is configured. If so, query `analyze:{symbol}`. If data is cached, return it instantly (reducing response latency to ~15ms).
- **Distributed Scraper Lock:** If flash scrapers need to run, check if a lock key `lock:scrape:{symbol}` is active in Redis:
  - If a lock exists, skip scraping (let another thread/lambda handle it) to avoid concurrent rate-limiting.
  - If no lock exists, set `lock:scrape:{symbol}` with a 30-second expiry, execute the scraper tasks, and delete the lock upon completion.
- **Cache Write:** Before returning the newly computed analysis, write it to `analyze:{symbol}` with an expiration TTL of 15 minutes (`900` seconds) to keep data fresh while saving serverless database calls.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to confirm everything compiles successfully without type or static-generation errors.

### Manual Verification
- Verify that searches load instantly (within milliseconds) once a coin has been requested once.
- Confirm that the console logs show `[Redis] Cache hit for ETH` and `[Redis] Cached fresh analysis for ETH`.
- Confirm that deleting the cache keys or modifying environment variables triggers the fallback mode correctly.
