/**
 * check-ai-health.ts
 * Run: npx tsx --env-file=.env scripts/check-ai-health.ts
 *
 * Sends one known post through the NIM chat + embedding models. Exits 1 if
 * either is down. First step of every GitHub Actions ingest run, so a retired
 * model fails the run and triggers the alert issue.
 */

import { checkAIHealth, SENTIMENT_MODEL, EMBEDDING_MODEL } from "@/lib/ai/sentiment";

// A missing or rejected key fails every model, which reads like a retired
// model; say what it really is so nobody swaps models for nothing
if (!process.env.NVIDIA_API_KEY) {
  console.error(
    "❌ NVIDIA_API_KEY is not set. In GitHub Actions add it under Settings → Secrets and variables → Actions → Repository secrets."
  );
  process.exit(1);
}

checkAIHealth()
  .then(({ ok, chat, embedding }) => {
    console.log(`Chat model      ${SENTIMENT_MODEL}: ${chat}`);
    console.log(`Embedding model ${EMBEDDING_MODEL}: ${embedding}`);
    if (!ok && /unauthorized|forbidden|401|403/i.test(chat)) {
      console.error("\n❌ NVIDIA rejected the API key (expired, revoked or mistyped). Update the NVIDIA_API_KEY secret.");
      process.exitCode = 1;
      return;
    }
    if (!ok) {
      console.error(
        "\n❌ AI model health check failed. Pick a working model from " +
          "https://integrate.api.nvidia.com/v1/models and update SENTIMENT_MODEL / EMBEDDING_MODEL in lib/ai/sentiment.ts."
      );
      process.exitCode = 1;
      return;
    }
    console.log("\n✅ AI models healthy");
  })
  .catch((e) => {
    console.error("Health check crashed:", e);
    process.exitCode = 1;
  });
