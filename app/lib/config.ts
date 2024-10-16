export const env = {
  mongodbDbName: process.env.MONGODB_DB_NAME || "ip-case",
  mongodbUrl: process.env.MONGODB_URL || "mongo://localhost:27017",
  embeddingInferenceUrl: process.env.EMBEDDING_INFERENCE_URL || "http://localhost:30832",
};
