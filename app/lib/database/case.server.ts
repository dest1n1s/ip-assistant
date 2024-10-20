import { env } from "../config";
import { Case } from "../types/case";
import { db, mongoConnectPromise } from "./mongo.server";
import {
  getChildFiltersPipeline,
  getFiltersPipeline,
  getHybridSearchPipeline,
  getSearchPipeline,
  getTimeFiltersPipeline,
} from "./pipelines";
import { writeFileSync } from "fs";

export const search = async (
  query?: string,
  filters?: { category: string; name: string }[],
  scoreThreshold = 3,
  pageSize = 10,
  page = 0,
  type: "vector-only" | "text-only" | "hybrid" = "hybrid",
) => {
  await mongoConnectPromise;
  if (query) {
    const vector: number[] = await fetch(`${env.embeddingInferenceUrl}/generate_embedding/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: query }),
    })
      .then(response => response.json())
      .then(data => data.embedding)
      .catch(error => console.error("Error:", error));
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

    writeFileSync("pipeline.json", JSON.stringify(pipeline, null, 2));

    return db
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
  } else {
    const pipeline = getSearchPipeline(filters, scoreThreshold, pageSize, page);
    return db.collection("case").aggregate(pipeline).toArray();
  }
};

export const retrieveChildFilters = async (category: string, path: string[]) => {
  await mongoConnectPromise;
  const cases = db.collection<Case>("case");
  const result = await cases
    .aggregate<{
      name: string;
      count: number;
      hasChildren: boolean;
    }>(getChildFiltersPipeline(category, path))
    .toArray();
  return result;
};

export const retrieveFilters = async (category: string) => {
  await mongoConnectPromise;
  const cases = db.collection<Case>("case");
  const result = await cases
    .aggregate<{
      name: string;
      count: number;
    }>(getFiltersPipeline(category))
    .toArray();
  return result.filter(r => r.name).map(r => ({ ...r, hasChildren: false }));
};

export const retrieveTimeFilters = async (category: string) => {
  await mongoConnectPromise;
  const cases = db.collection<Case>("case");
  const result = await cases
    .aggregate<{
      name: string;
      count: number;
    }>(getTimeFiltersPipeline(category))
    .toArray();
  return result.map(r => ({ ...r, hasChildren: false, displayName: `${r.name} 年` }));
};

export const getCase = async (name: string) => {
  await mongoConnectPromise;
  const cases = db.collection<Case>("case");
  return cases.findOne({ name });
};
