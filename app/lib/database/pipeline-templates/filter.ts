[
  {
    $match: {
      cause: {
        $all: ["民事", "知识产权合同纠纷"],
      },
    },
  },
  {
    $unwind:
      /**
       * path: Path to the array field.
       * includeArrayIndex: Optional name for index.
       * preserveNullAndEmptyArrays: Optional
       *   toggle to unwind null and empty values.
       */
      {
        path: "$cause",
        includeArrayIndex: "unwindIndex",
      },
  },
  {
    $match:
      /**
       * query: The query in MQL.
       */
      {
        unwindIndex: 2,
      },
  },
  {
    $group:
      /**
       * _id: The id of the group.
       * fieldN: The first field name.
       */
      {
        _id: "$cause",
        count: {
          $count: {},
        },
      },
  },
  {
    $project: {
      name: "$_id",
      count: 1,
    },
  },
];
