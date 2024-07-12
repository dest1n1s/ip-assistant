import { env } from "~/lib/config";
import { MongoClient, ServerApiVersion } from "mongodb";

const mongoClient = new MongoClient(env.mongodbUrl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export const db = mongoClient.db(env.mongodbDbName);

export const mongoConnectPromise = mongoClient.connect();

export const withMongoSession = async <T>(callback: () => Promise<T>) => {
  await mongoConnectPromise;
  const session = mongoClient.startSession();
  try {
    return await session.withTransaction(callback);
  } finally {
    session.endSession();
  }
};
