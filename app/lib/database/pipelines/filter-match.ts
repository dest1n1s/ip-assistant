export const getFilterMatchPhase = (
  filters: { category: string; name: string }[],
  categoryPrefix: string = "",
) => {
  const getFilterCondition = ({
    category,
    name,
  }: {
    category: string;
    name: string;
  }): Record<string, any>[] => {
    if (category == "cause")
      return [
        {
          $in: [name, `$${categoryPrefix}${category}`],
        },
      ] as const;
    else if (category == "judgedAt")
      return [
        {
          $and: [
            {
              $gte: [`$${categoryPrefix}${category}`, new Date(`${name}-01-01`)],
            },
            {
              $lt: [`$${categoryPrefix}${category}`, new Date(`${parseInt(name) + 1}-01-01`)],
            },
          ],
        },
      ] as const;
    else
      return [
        {
          $eq: [`$${categoryPrefix}${category}`, name],
        },
      ] as const;
  };

  if (filters.length === 0) return [];

  // Group filters by category
  const filtersByCategory = filters.reduce(
    (acc, filter) => {
      const { category } = filter;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(filter);
      return acc;
    },
    {} as Record<string, { category: string; name: string }[]>,
  );

  // Create the $and condition with $or inside for each category
  const andConditions = Object.entries(filtersByCategory).map(([category, filtersInCategory]) => {
    const orConditions = filtersInCategory.map(getFilterCondition).flat();
    return { $or: orConditions };
  });

  return [
    {
      $match: {
        $expr: {
          $and: andConditions,
        },
      },
    },
  ];
};
