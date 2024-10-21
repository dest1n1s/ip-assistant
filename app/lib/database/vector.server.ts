import { cache } from "../cache.server";
import { env } from "../config";
import { logger } from "../logging.server";

export const generateEmbedding = async (query: string) => {
  const cacheKey = JSON.stringify({ query, method: "generateEmbedding" });
  const inCache = cache.get<number[]>(cacheKey);
  if (inCache) {
    logger.info(`[generateEmbedding] Query: ${query}. Cache hit.`);
    return inCache;
  }
  logger.info(`[generateEmbedding] Query: ${query}. Start.`);

  const vector = await fetch(`${env.embeddingInferenceUrl}/generate_embedding/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: query }),
  })
    .then(response => response.json())
    .then(data => data.embedding as number[])
    .catch(error => {
      console.error(error);
      logger.error(`[generateEmbedding] Query: ${query || "Empty"}, Error: ${error}`);
      return null;
    });

  if (!vector) {
    return null;
  }

  logger.info(`[generateEmbedding] Query: ${query}. Vector generated.`);
  cache.set(cacheKey, vector);
};
