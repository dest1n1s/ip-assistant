import { getFilterMatchPhase } from "./filter-match";

export const getSearchPipeline = (
  filter?: { category: string; name: string }[],
  scoreThreshold = 1,
  limit = 10,
  skip = 0,
) => {
  const filterMatchPhase = filter ? getFilterMatchPhase(filter) : [];

  return [
    ...filterMatchPhase,
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
