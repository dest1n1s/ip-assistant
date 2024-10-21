import { writeFileSync } from "fs";
import { cache } from "../cache.server";
import { logger } from "../logging.server";
import { Case } from "../types/case";
import { Law } from "../types/law";
import { db, mongoConnectPromise } from "./mongo.server";
import {
  getChildFiltersPipeline,
  getFiltersPipeline,
  getHybridSearchPipeline,
  getLawHybridSearchPipeline,
  getSearchPipeline,
  getTimeFiltersPipeline,
} from "./pipelines";
import { generateEmbedding } from "./vector.server";

export const search = async (config: {
  query?: string;
  filters?: { category: string; name: string }[];
  scoreThreshold?: number;
  pageSize?: number;
  page?: number;
  type?: "vector-only" | "text-only" | "hybrid";
}): Promise<Case[]> => {
  const filterString = config.filters?.map(f => `${f.category}:${f.name}`).join(",") || "Empty";

  const {
    query,
    filters = [],
    scoreThreshold = 1,
    pageSize = 10,
    page = 0,
    type = "hybrid",
  } = config;
  const cacheKey = JSON.stringify({ ...config, method: "search" });

  const inCache = cache.get<Case[]>(cacheKey);
  if (inCache) {
    logger.info(`[search] Query: ${config.query || "Empty"}, Filters: ${filterString}. Cache hit.`);
    return inCache;
  }
  logger.info(`[search] Query: ${config.query || "Empty"}, Filters: ${filterString}. Start.`);

  await mongoConnectPromise;
  if (query) {
    const vector = await generateEmbedding(query);
    if (!vector) {
      return [];
    }

    const pipeline = getHybridSearchPipeline(
      {
        text: query,
        vector,
      },
      filters,
      scoreThreshold,
      pageSize,
      page * pageSize,
      type,
    );

    const result = await db
      .collection("caseEmbeddings")
      .aggregate(pipeline)
      .toArray()
      .then(result => {
        return result.map(r => ({
          textScore: r.textScore,
          vectorScore: r.vectorScore,
          sortScore: r.sortScore,
          ...r.case,
        }));
      });

    cache.set(cacheKey, result);
    logger.info(`[search] Query: ${config.query || "Empty"}, Filters: ${filterString}. End.`);
    return result;
  } else {
    const pipeline = getSearchPipeline(filters, scoreThreshold, pageSize, page);
    const result = (await db.collection("case").aggregate(pipeline).toArray()) as Case[];
    cache.set(cacheKey, result);
    logger.info(`[search] Query: ${config.query || "Empty"}, Filters: ${filterString}. End.`);
    return result;
  }
};

export const searchForLaws = async (config: {
  query?: string;
  scoreThreshold?: number;
  pageSize?: number;
  page?: number;
  type?: "vector-only" | "text-only" | "hybrid";
}): Promise<Law[]> => {
  const { query, scoreThreshold = 1, pageSize = 10, page = 0, type = "hybrid" } = config;
  const cacheKey = JSON.stringify({ ...config, method: "searchForLaws" });

  const inCache = cache.get<Law[]>(cacheKey);
  if (inCache) {
    logger.info(`[searchForLaws] Query: ${config.query || "Empty"}. Cache hit.`);
    return inCache;
  }
  logger.info(`[searchForLaws] Query: ${config.query || "Empty"}. Start.`);

  await mongoConnectPromise;
  if (query) {
    const vector = await generateEmbedding(query);
    if (!vector) {
      return [];
    }

    const pipeline = getLawHybridSearchPipeline(
      {
        text: query,
        vector,
      },
      scoreThreshold,
      pageSize,
      page * pageSize,
      type,
    );

    writeFileSync("pipeline.json", JSON.stringify(pipeline, null, 2));

    const result = await db
      .collection("lawContent")
      .aggregate(pipeline)
      .toArray()
      .then(result => {
        return result.map(r => ({
          textScore: r.textScore,
          vectorScore: r.vectorScore,
          sortScore: r.sortScore,
          path: r.path,
          ...r.law,
        }));
      });

    cache.set(cacheKey, result);
    logger.info(`[searchForLaws] Query: ${config.query || "Empty"}. End.`);
    return result;
  } else {
    const result = (await db
      .collection<Law>("law")
      .find()
      .skip(page * pageSize)
      .limit(pageSize)
      .toArray()) as Law[];
    cache.set(cacheKey, result);
    logger.info(`[searchForLaws] Query: ${config.query || "Empty"}. End.`);
    return result;
  }
};

export const retrieveChildFilters = async (category: string, path: string[]) => {
  const cacheKey = JSON.stringify({ category, path, method: "retrieveChildFilters" });
  const inCache = cache.get<
    {
      name: string;
      count: number;
      hasChildren: boolean;
    }[]
  >(cacheKey);
  if (inCache) {
    logger.info(
      `[retrieveChildFilters] Category: ${category}, Path: ${path.join("/") || "Empty"}. Cache hit.`,
    );
    return inCache;
  }

  logger.info(
    `[retrieveChildFilters] Category: ${category}, Path: ${path.join("/") || "Empty"}. Start.`,
  );

  await mongoConnectPromise;
  const cases = db.collection<Case>("case");
  const result = await cases
    .aggregate<{
      name: string;
      count: number;
      hasChildren: boolean;
    }>(getChildFiltersPipeline(category, path))
    .toArray();

  cache.set(cacheKey, result);
  logger.info(
    `[retrieveChildFilters] Category: ${category}, Path: ${path.join("/") || "Empty"}. End.`,
  );
  return result;
};

export const retrieveFilters = async (category: string) => {
  const cacheKey = JSON.stringify({ category, method: "retrieveFilters" });
  const inCache = cache.get<
    {
      name: string;
      count: number;
      hasChildren: boolean;
    }[]
  >(cacheKey);
  if (inCache) {
    logger.info(`[retrieveFilters] Category: ${category}. Cache hit.`);
    return inCache;
  }

  logger.info(`[retrieveFilters] Category: ${category}. Start.`);

  await mongoConnectPromise;
  const cases = db.collection<Case>("case");
  const result = await cases
    .aggregate<{
      name: string;
      count: number;
    }>(getFiltersPipeline(category))
    .toArray();
  const resultFiltered = result.filter(r => r.name).map(r => ({ ...r, hasChildren: false }));

  cache.set(cacheKey, resultFiltered);
  logger.info(`[retrieveFilters] Category: ${category}. End.`);
  return resultFiltered;
};

export const retrieveTimeFilters = async (category: string) => {
  const cacheKey = JSON.stringify({ category });
  const inCache = cache.get<
    {
      name: string;
      count: number;
      hasChildren: boolean;
      displayName: string;
    }[]
  >(cacheKey);
  if (inCache) {
    logger.info(`[retrieveTimeFilters] Category: ${category}. Cache hit.`);
    return inCache;
  }
  logger.info(`[retrieveTimeFilters] Category: ${category}. Start.`);

  await mongoConnectPromise;
  const cases = db.collection<Case>("case");
  const result = await cases
    .aggregate<{
      name: string;
      count: number;
    }>(getTimeFiltersPipeline(category))
    .toArray();
  const resultMapped = result.map(r => ({ ...r, hasChildren: false, displayName: `${r.name} 年` }));

  cache.set(cacheKey, resultMapped);
  logger.info(`[retrieveTimeFilters] Category: ${category}. End.`);
  return resultMapped;
};

export const getCase = async (name: string) => {
  const cacheKey = JSON.stringify({ name, method: "getCase" });
  const inCache = cache.get<Case>(cacheKey);
  if (inCache) {
    logger.info(`[getCase] Name: ${name}. Cache hit.`);
    return inCache;
  }
  logger.info(`[getCase] Name: ${name}. Start.`);

  await mongoConnectPromise;
  const cases = db.collection<Case>("case");
  const result = cases.findOne({ name });

  cache.set(cacheKey, result);
  logger.info(`[getCase] Name: ${name}. End.`);
  return result;
};

export const getLaw = async (title: string) => {
  const cacheKey = JSON.stringify({ title, method: "getLaw" });
  const inCache = cache.get<Law>(cacheKey);
  if (inCache) {
    logger.info(`[getLaw] Title: ${title}. Cache hit.`);
    return inCache;
  }
  logger.info(`[getLaw] Title: ${title}. Start.`);

  await mongoConnectPromise;
  const laws = db.collection<Law>("law");
  const result = laws.findOne({ title });

  cache.set(cacheKey, result);
  logger.info(`[getLaw] Title: ${title}. End.`);
  return result;
};
