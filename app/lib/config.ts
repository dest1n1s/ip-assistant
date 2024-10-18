export const env = {
  mongodbDbName: process.env.MONGODB_DB_NAME || "ip-case",
  mongodbUrl: process.env.MONGODB_URL || "mongo://localhost:27017",
  embeddingInferenceUrl: process.env.EMBEDDING_INFERENCE_URL || "http://localhost:30832",
  openaiApiKey: process.env.OPENAI_API_KEY || "sk-1234567890",
  openaiApiUrl: process.env.OPENAI_API_URL || "https://api.openai.com/v1",
};
