import { Case } from "../types/case";
import { db, mongoConnectPromise } from "./mongo.server";

export const listAllCases = async () => {
  await mongoConnectPromise;
  const cases = db.collection<Case>("case");
  const result = await cases.find().skip(10).limit(10).toArray();
  console.log(result);
  return result;
};
