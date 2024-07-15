import { Case } from "../types/case";
import { db, mongoConnectPromise } from "./mongo.server";
import { getSearchPipeline } from "./pipelines.server";

export const listAllCases = async () => {
  await mongoConnectPromise;
  const cases = db.collection<Case>("case");
  const result = await cases.find().skip(10).limit(10).toArray();
  const searchResult = await cases
    .aggregate(
      getSearchPipeline("齐鲁少年军校", [
        { category: "cause", name: "著作权权属、侵权纠纷" },
      ])
    )
    .toArray();
  console.log(searchResult);
  return result;
};
