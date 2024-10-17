import fs from "fs";
import { getFilterMatchPhase } from "./filter-match";

export const getHybridSearchPipeline = (
  query?: {
    text: string;
    vector: number[];
  },
  filters?: { category: string; name: string }[],
  scoreThreshold = 1,
  limit = 10,
  skip = 0,
) => {
  const vectorSearchPipeline = query
    ? [
        {
          $vectorSearch: {
            index: "vector_index_bge_m3",
            path: "bgeM3Embedding",
            queryVector: query.vector,
            numCandidates: 150,
            limit: limit,
          },
        },
        {
          $project: {
            _id: 0,
            caseId: 1,
            searchScore: { $meta: "vectorSearchScore" },
            source: "vector",
          },
        },
        {
          $lookup: {
            from: "case",
            localField: "caseId",
            foreignField: "_id",
            as: "case",
          },
        },
        { $unwind: "$case" },
        {
          $project: {
            caseId: 1,
            searchScore: 1,
            case: "$case", // Include the entire case document
            source: 1,
          },
        },
      ]
    : [];

  // Text search pipeline on 'case' collection
  const textSearchPipeline = query
    ? [
        {
          $search: {
            text: {
              query: query.text,
              path: ["title", { wildcard: "content.*" }],
            },
          },
        },
        {
          $project: {
            _id: 0,
            caseId: "$_id",
            searchScore: { $meta: "searchScore" },
            case: "$$ROOT", // Include the entire document
            source: "text",
          },
        },
      ]
    : [];

  const matchPhase = filters ? getFilterMatchPhase(filters, "case.") : [];

  // Write pipeline to file
  fs.writeFileSync("pipeline.json", JSON.stringify(matchPhase, null, 2));

  // Combine both pipelines using $unionWith
  return [
    ...vectorSearchPipeline,
    {
      $unionWith: {
        coll: "case",
        pipeline: textSearchPipeline,
      },
    },
    {
      $group: {
        _id: "$caseId",
        vectorScore: {
          $max: {
            $cond: [{ $eq: ["$source", "vector"] }, "$searchScore", 0],
          },
        },
        textScore: {
          $max: {
            $cond: [{ $eq: ["$source", "text"] }, "$searchScore", 0],
          },
        },
        case: { $first: "$case" }, // Retain the full case document
      },
    },
    {
      $set: {
        sortScore: {
          $add: [{ $multiply: [10, "$vectorScore"] }, "$textScore"],
        },
      },
    },
    ...matchPhase,
    { $sort: { sortScore: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];
};
