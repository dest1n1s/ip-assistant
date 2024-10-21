import { getFilterMatchPhase, getFilterMQL, getSearchFilterPhase } from "./filter-match";

export const getHybridSearchPipeline = (
  query: {
    text: string;
    vector: number[];
  },
  filters?: { category: string; name: string }[],
  scoreThreshold = 1,
  limit = 10,
  skip = 0,
  type: "vector-only" | "text-only" | "hybrid" = "hybrid",
) => {
  const vectorSearchPipeline =
    type === "vector-only" || type === "hybrid"
      ? [
          {
            $vectorSearch: {
              index: "vector_index_bge_m3",
              path: "bgeM3Embedding",
              queryVector: query.vector,
              filters: filters ? getFilterMQL(filters) : {},
              numCandidates: 150,
              limit: limit + skip,
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
      : [
          {
            $match: { _id: { $eq: null } }, // No documents will have _id as null
          },
        ];

  // Text search pipeline on 'case' collection
  const textSearchPipeline =
    type === "text-only" || type === "hybrid"
      ? [
          {
            $search: {
              compound: {
                must: [
                  {
                    text: {
                      query: query.text,
                      path: [
                        "title",
                        "name",
                        "subtitle",
                        { wildcard: "keywords.*" },
                        { wildcard: "content.*" },
                      ],
                    },
                  },
                ],
                filter: filters ? getSearchFilterPhase(filters) : [],
              },
            },
          },
          {
            $limit: limit + skip,
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
      : [
          {
            $match: { _id: { $eq: null } }, // No documents will have _id as null
          },
        ];

  const matchPhase = filters ? getFilterMatchPhase(filters, "case.") : [];

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
          $add: [
            { $pow: ["$textScore", 2] }, // textScore^2
            { $pow: [{ $multiply: [10, "$vectorScore"] }, 2] }, // (10 * vectorScore)^2
          ],
        },
      },
    },
    ...matchPhase,
    { $sort: { sortScore: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];
};

export const getLawHybridSearchPipeline = (
  query: {
    text: string;
    vector: number[];
  },
  scoreThreshold = 1,
  limit = 10,
  skip = 0,
  type: "vector-only" | "text-only" | "hybrid" = "hybrid",
) => {
  const vectorSearchPipeline =
    type === "vector-only" || type === "hybrid"
      ? [
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: query.vector,
              numCandidates: 150,
              limit: (limit + skip) * 5,
            },
          },
          {
            $set: {
              vectorScore: { $meta: "vectorSearchScore" },
              source: "vector",
            },
          },
        ]
      : [
          {
            $match: { _id: { $eq: null } }, // No documents will have _id as null
          },
        ];

  // Text search pipeline on 'case' collection
  const textSearchPipeline =
    type === "text-only" || type === "hybrid"
      ? [
          {
            $search: {
              text: {
                query: query.text,
                path: ["content"],
              },
              highlight: {
                path: "content",
              },
            },
          },
          {
            $limit: (limit + skip) * 5,
          },
          {
            $set: {
              textScore: { $meta: "searchScore" },
              highlights: {
                $meta: "searchHighlights",
              },
              source: "text",
            },
          },
        ]
      : [
          {
            $match: { _id: { $eq: null } }, // No documents will have _id as null
          },
        ];

  // Combine both pipelines using $unionWith
  return [
    ...vectorSearchPipeline,
    {
      $unionWith: {
        coll: "lawContent",
        pipeline: textSearchPipeline,
      },
    },
    {
      $group: {
        _id: "$lawId",
        vectorScore: {
          $max: {
            $cond: [{ $eq: ["$source", "vector"] }, "$vectorScore", 0],
          },
        },
        textScore: {
          $max: {
            $cond: [{ $eq: ["$source", "text"] }, "$textScore", 0],
          },
        },
        path: {
          $topN: {
            output: "$path",
            sortBy: { vectorScore: 1 },
            n: 3,
          },
        },
      },
    },
    {
      $set: {
        sortScore: {
          $add: [
            { $pow: ["$textScore", 2] }, // textScore^2
            { $pow: [{ $multiply: [10, "$vectorScore"] }, 2] }, // (10 * vectorScore)^2
          ],
        },
      },
    },
    { $sort: { sortScore: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "law",
        localField: "_id",
        foreignField: "_id",
        as: "law",
      },
    },
    { $unwind: "$law" },
  ];
};
