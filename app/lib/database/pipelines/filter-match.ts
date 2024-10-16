export const getFilterMatchPhase = (
  filters: { category: string; name: string }[],
  categoryPrefix: string = "",
) => {
  const getFilterCondition = ({ category, name }: { category: string; name: string }) => {
    if (category == "cause")
      return [
        {
          $in: [name, `${categoryPrefix}$${category}`],
        },
      ];
    return [];
  };

  if (filters.length === 0) return [];

  return [
    {
      $match: {
        $expr: {
          $and: [...filters.flatMap(getFilterCondition)],
        },
      },
    },
  ];
};
