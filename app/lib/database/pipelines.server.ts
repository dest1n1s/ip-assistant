export const getHybridSearchPipeline = (
  query?: {
    text: string;
    vector: number[];
  },
  filter?: { category: string; name: string }[],
  scoreThreshold = 1,
  limit = 10,
  skip = 0
) => {
  // Vector search pipeline on 'caseEmbeddings' collection
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
    ...(filter && filter.length > 0
      ? [
          {
            $match: {
              $and: filter.map((f) => ({
                [`case.${f.category}`]: f.name,
              })),
            },
          },
        ]
      : []),
    { $sort: { sortScore: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];
};

export const getSearchPipeline = (
  filter?: { category: string; name: string }[],
  scoreThreshold = 1,
  limit = 10,
  skip = 0
) => {
  return [
    {
      $match:
        /**
         * query: The query in MQL.
         */
        {
          $expr: {
            $and: [
              ...(filter?.map((f) => ({
                $in: [f.name, `$${f.category}`],
              })) || []),
            ],
          },
        },
    },
    {
      $skip:
        /**
         * Provide the number of documents to skip.
         */
        skip,
    },
    {
      $limit:
        /**
         * Provide the number of documents to limit.
         */
        limit,
    },
  ];
};

export const getFilterPipeline = (category: string, path: string[]) => {
  return [
    ...(path.length > 0
      ? [
          {
            $match: {
              [category]: {
                $all: path,
              },
            },
          },
        ]
      : []),
    {
      $unwind:
        /**
         * path: Path to the array field.
         * includeArrayIndex: Optional name for index.
         * preserveNullAndEmptyArrays: Optional
         *   toggle to unwind null and empty values.
         */
        {
          path: `$${category}`,
          includeArrayIndex: "unwindIndex",
        },
    },
    {
      $match:
        /**
         * query: The query in MQL.
         */
        {
          unwindIndex: path.length,
        },
    },
    {
      $group:
        /**
         * _id: The id of the group.
         * fieldN: The first field name.
         */
        {
          _id: [`$${category}`, "$unwindIndex"],
          count: {
            $count: {},
          },
        },
    },
    {
      $project: {
        _id: 0,
        name: {
          $arrayElemAt: ["$_id", 0],
        },
        index: {
          $arrayElemAt: ["$_id", 1],
        },
        count: 1,
      },
    },
    {
      $lookup:
        /**
         * from: The target collection.
         * localField: The local join field.
         * foreignField: The target join field.
         * as: The name for the results.
         * pipeline: Optional pipeline to run on the foreign collection.
         * let: Optional variables to use in the pipeline field stages.
         */
        {
          from: `${category}-relation`,
          localField: "name",
          foreignField: "first",
          as: "hasChildren",
        },
    },
    {
      $project:
        /**
         * specifications: The fields to
         *   include or exclude.
         */
        {
          count: 1,
          name: 1,
          hasChildren: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$hasChildren",
                    as: "hasChildren",
                    cond: {
                      $eq: ["$index", "$$hasChildren.index"],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
    },
  ];
};
