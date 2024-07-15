[
  {
    $search:
      /**
       * index: The name of the Search index.
       * text: Analyzed search, with required fields of query and path, the analyzed field(s) to search.
       * compound: Combines ops.
       * span: Find in text field regions.
       * exists: Test for presence of a field.
       * near: Find near number or date.
       * range: Find in numeric or date range.
       */
      {
        text: {
          query: "齐鲁少年军校",
          path: {
            wildcard: "content.*",
          },
        },
      },
  },
  {
    $addFields:
      /**
       * specifications: The fields to
       *   include or exclude.
       */
      {
        searchScore: {
          $meta: "searchScore",
        },
      },
  },
  {
    $match:
      /**
       * query: The query in MQL.
       */
      {
        $expr: {
          $gt: ["$searchScore", 3],
        },
      },
  },
  {
    $match:
      /**
       * query: The query in MQL.
       */
      {
        $expr: {
          $in: ["著作权权属、侵权纠纷", "$cause"],
        },
      },
  },
  {
    $group:
      /**
       * _id: The id of the group.
       * fieldN: The first field name.
       */
      {
        _id: null,
        count: {
          $count: {},
        },
      },
  },
];
