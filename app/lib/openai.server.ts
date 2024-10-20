import { createOpenAI } from "@ai-sdk/openai";
import { fetch } from "undici";
import { env } from "./config";

export const openai = createOpenAI({
  apiKey: env.openaiApiKey,
  baseURL: env.openaiApiUrl,
  // @ts-ignore
  fetch: fetch, // Use undici for fetching, to deal with Remix's fetch polyfill
});
