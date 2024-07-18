import { Case } from "../types/case";
import { db, mongoConnectPromise } from "./mongo.server";
import { getFilterPipeline, getSearchPipeline } from "./pipelines.server";

export const search = async (
  query?: string,
  filter?: { category: string; name: string }[],
  scoreThreshold = 3,
  pageSize = 10,
  page = 0
) => {
  await mongoConnectPromise;
  const cases = db.collection<Case>("case");
  const result = await cases
    .aggregate(
      // getSearchPipeline("齐鲁少年军校", [
      //   { category: "cause", name: "著作权权属、侵权纠纷" },
      // ])
      getSearchPipeline(
        query,
        filter,
        scoreThreshold,
        pageSize,
        page * pageSize
      )
    )
    .toArray();
  return result;
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
