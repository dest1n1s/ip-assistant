type Filter = {
  category: string;
  name: string;
};

export const getFilterMQL = (
  filters: Filter[],
  categoryPrefix: string = "",
): Record<string, any> | null => {
  const getFilterCondition = ({ category, name }: Filter): Record<string, any> => {
    if (category === "cause") {
      return { [`${categoryPrefix}${category}`]: { $in: [name] } };
    } else if (category === "judgedAt") {
      return {
        [`${categoryPrefix}${category}`]: {
          $gte: new Date(`${name}-01-01`),
          $lt: new Date(`${parseInt(name) + 1}-01-01`),
        },
      };
    } else {
      return { [`${categoryPrefix}${category}`]: name };
    }
  };

  if (filters.length === 0) return null;

  // Group filters by category
  const filtersByCategory = filters.reduce<Record<string, Filter[]>>((acc, filter) => {
    const { category } = filter;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(filter);
    return acc;
  }, {});

  const matchConditions: Record<string, any> = {};
  const andConditions: Record<string, any>[] = [];

  // For each category, generate conditions and place them accordingly
  Object.entries(filtersByCategory).forEach(([category, filtersInCategory]) => {
    if (filtersInCategory.length === 1) {
      // If only one filter for this category, no need for $or or $and
      const condition = getFilterCondition(filtersInCategory[0]);
      Object.assign(matchConditions, condition);
    } else {
      // Multiple conditions for the category, combine them with $or
      const orConditions = filtersInCategory.map(getFilterCondition);
      andConditions.push({ $or: orConditions });
    }
  });

  // Only include $and if there are conflicting conditions
  if (andConditions.length > 0) {
    return {
      ...matchConditions,
      $and: andConditions,
    };
  }

  // If there are no conflicting conditions, return without $and
  return matchConditions;
};

export const getFilterMatchPhase = (
  filters: Filter[],
  categoryPrefix: string = "",
): Record<string, any>[] => {
  const filterMQL = getFilterMQL(filters, categoryPrefix);
  if (!filterMQL) return [];

  return [
    {
      $match: filterMQL,
    },
  ];
};
