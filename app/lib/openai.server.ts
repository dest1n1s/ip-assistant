import { createOpenAI } from "@ai-sdk/openai";
import { env } from "./config";

export const openai = createOpenAI({
  apiKey: env.openaiApiKey,
  baseURL: env.openaiApiUrl,
});
