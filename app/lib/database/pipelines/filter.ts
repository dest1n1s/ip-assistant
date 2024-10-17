export const getChildFiltersPipeline = (category: string, path: string[]) => {
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
    {
      $sort:
        /**
         * specifications: The fields to sort.
         */
        {
          count: -1,
        },
    },
  ];
};

export const getFiltersPipeline = (category: string) => {
  return [
    {
      $group: {
        _id: `$${category}`,
        count: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
        count: 1,
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ];
};

export const getTimeFiltersPipeline = (category: string) => {
  return [
    {
      // Extract the year from judgedAt field
      $addFields: {
        year: {
          $year: `$${category}`,
        },
      },
    },
    {
      // Group by the year and count the number of documents
      $group: {
        _id: "$year",
        // Group by the extracted year
        count: {
          $sum: 1,
        }, // Count the number of documents per year
      },
    },
    {
      // Format the output to have the desired "name" field with the year and "count"
      $project: {
        _id: 0,
        // Exclude _id field
        name: {
          $toString: "$_id",
        },
        // Format the year as "YYYY"
        count: "$count", // Include the count
      },
    },
    {
      // Optionally, sort by year in ascending order (remove this stage if not needed)
      $sort: {
        name: -1,
      },
    },
  ];
};
