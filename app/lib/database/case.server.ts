import { Case } from "../types/case";
import { db, mongoConnectPromise } from "./mongo.server";
import {
  getFilterPipeline,
  getHybridSearchPipeline,
  getSearchPipeline,
} from "./pipelines.server";

export const search = async (
  query?: string,
  filter?: { category: string; name: string }[],
  scoreThreshold = 3,
  pageSize = 10,
  page = 0
) => {
  await mongoConnectPromise;
  if (query) {
    const vector: number[] = await fetch(
      "http://10.176.52.122:30832/generate_embedding/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: query }),
      }
    )
      .then((response) => response.json())
      .then((data) => data.embedding)
      .catch((error) => console.error("Error:", error));
    const pipeline = getHybridSearchPipeline(
      {
        text: query,
        vector,
      },
      filter,
      scoreThreshold,
      pageSize,
      page * pageSize
    );
    return db
      .collection("caseEmbeddings")
      .aggregate(pipeline)
      .toArray()
      .then((result) => {
        return result.map((r) => r.case);
      });
  } else {
    const pipeline = getSearchPipeline(filter, scoreThreshold, pageSize, page);
    return db.collection("case").aggregate(pipeline).toArray();
  }
};

export const retrieveChildFilters = async (
  category: string,
  path: string[]
) => {
  await mongoConnectPromise;
  const cases = db.collection<Case>("case");
  const result = await cases
    .aggregate<{ name: string; count: number; hasChildren: boolean }>(
      getFilterPipeline(category, path)
    )
    .toArray();
  return result;
};
