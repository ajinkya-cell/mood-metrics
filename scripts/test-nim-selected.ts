import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

async function run() {
  const apiKey = process.env.NVIDIA_API_KEY;
  const nim = createOpenAICompatible({
    name: "nim",
    baseURL: "https://integrate.api.nvidia.com/v1",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  console.log("--- Testing llama-3.2-11b-vision-instruct ---");
  try {
    const t0 = Date.now();
    const res = await generateText({
      model: nim.chatModel("meta/llama-3.2-11b-vision-instruct"),
      prompt: `Respond with JSON: {"label": "bullish", "score": 0.5, "confidence": 0.8, "reasoning": "Test"}`,
    });
    console.log(`meta/llama-3.2-11b-vision-instruct: ${Date.now() - t0}ms -> ${res.text}`);
  } catch (e: any) {
    console.log(`Error: ${e.message}`);
  }

  console.log("\n--- Testing llama-3.1-nemotron-70b-instruct ---");
  try {
    const t0 = Date.now();
    const res = await generateText({
      model: nim.chatModel("nvidia/llama-3.1-nemotron-70b-instruct"),
      prompt: `Respond with JSON: {"label": "bullish", "score": 0.5, "confidence": 0.8, "reasoning": "Test"}`,
    });
    console.log(`nvidia/llama-3.1-nemotron-70b-instruct: ${Date.now() - t0}ms -> ${res.text}`);
  } catch (e: any) {
    console.log(`Error: ${e.message}`);
  }

  console.log("\n--- Testing ibm/granite-3.0-8b-instruct ---");
  try {
    const t0 = Date.now();
    const res = await generateText({
      model: nim.chatModel("ibm/granite-3.0-8b-instruct"),
      prompt: `Respond with JSON: {"label": "bullish", "score": 0.5, "confidence": 0.8, "reasoning": "Test"}`,
    });
    console.log(`ibm/granite-3.0-8b-instruct: ${Date.now() - t0}ms -> ${res.text}`);
  } catch (e: any) {
    console.log(`Error: ${e.message}`);
  }

  console.log("\n--- Testing Embedding: nvidia/llama-3.2-nv-embedqa-1b-v1 ---");
  try {
    const t0 = Date.now();
    const res = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nvidia/llama-3.2-nv-embedqa-1b-v1",
        input: ["Bitcoin market sentiment"],
        encoding_format: "float",
        input_type: "passage",
      }),
    });
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      const data: any = await res.json();
      console.log(`Vector dimension: ${data.data?.[0]?.embedding?.length} in ${Date.now() - t0}ms`);
    } else {
      console.log(`Error body:`, await res.text());
    }
  } catch (e: any) {
    console.log(`Error: ${e.message}`);
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
