import OpenAI from "openai";
import { env } from "./config";

export const openai = new OpenAI({
  apiKey: env.openaiApiKey,
  baseURL: env.openaiApiUrl,
});
