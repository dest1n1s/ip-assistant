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
