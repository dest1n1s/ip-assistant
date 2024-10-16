import { useFetcher } from "@remix-run/react";
import { ChevronRight, Dot } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { FilterCategory, NestedFilter } from "~/lib/types/filter";
import { cn } from "~/lib/utils";
import { Checkbox } from "../ui/checkbox";

export const FilterItem = memo(
  ({
    filter,
    filterPath,
    filterCategoryName,
    onFilterChanged,
  }: {
    filter: NestedFilter;
    filterPath: string[];
    filterCategoryName: string;
    onFilterChanged: (filter: NestedFilter) => void;
  }) => {
    const fetcher = useFetcher<NestedFilter[]>();
    const [expanded, setExpanded] = useState(false);
    const selected = filter.selected;
    const setSelected = (v: boolean) => {
      onFilterChanged({ ...filter, selected: v });
    };
    useEffect(() => {
      if (fetcher.data) {
        onFilterChanged({
          ...filter,
          children: fetcher.data,
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetcher.data]);

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Checkbox checked={selected} onCheckedChange={setSelected} />
          <div className="grow">
            {filter.name} <span className="text-foreground-weaken-2 text-sm">({filter.count})</span>
          </div>
          {filter.hasChildren ? (
            <ChevronRight
              className={cn(
                "transform transition-transform cursor-pointer",
                expanded && "rotate-90",
              )}
              onClick={() => {
                setExpanded(!expanded);
                if (!filter.children) {
                  fetcher.submit(
                    {
                      filterCategoryName: filterCategoryName,
                      filterPath: filterPath.join("|"),
                    },
                    { action: "retrieve-child-filters" },
                  );
                }
              }}
            />
          ) : (
            <Dot />
          )}
        </div>
        {expanded && (
          <div className="pl-4">
            {filter.children &&
              filter.children.map(child => (
                <FilterItem
                  key={child.name}
                  filter={child}
                  filterPath={[...filterPath, child.name]}
                  filterCategoryName={filterCategoryName}
                  onFilterChanged={f => {
                    onFilterChanged({
                      ...filter,
                      children: filter.children!.map(ff => (ff.name === f.name ? f : ff)),
                    });
                  }}
                />
              ))}
          </div>
        )}
      </div>
    );
  },
);
FilterItem.displayName = "FilterItem";

export interface FilterCardProps {
  filter: FilterCategory;
  onFilterChanged: (filter: FilterCategory) => void;
}

export const FilterCardHeader = memo(({ filter: { displayName } }: FilterCardProps) => (
  <div className="py-3 px-4">
    <div className="text-lg font-semibold">{displayName}</div>
  </div>
));
FilterCardHeader.displayName = "FilterCardHeader";

export const FilterCardContent = memo(
  ({ filter: filterCategory, onFilterChanged }: FilterCardProps) => (
    <div className="p-4 flex flex-col gap-2">
      {filterCategory.filters.map(filter => (
        <FilterItem
          key={filter.name}
          filter={filter}
          filterPath={[filter.name]}
          filterCategoryName={filterCategory.name}
          onFilterChanged={f => {
            onFilterChanged({
              ...filterCategory,
              filters: filterCategory.filters.map(ff => (ff.name === f.name ? f : ff)),
            });
          }}
        />
      ))}
    </div>
  ),
);
FilterCardContent.displayName = "FilterCardContent";

export const FilterCard = memo((props: FilterCardProps) => (
  <div className="flex flex-col bg-surface shadow text-foreground-weaken-1 select-none">
    <FilterCardHeader {...props} />
    <div className="border-b border-input" />
    <FilterCardContent {...props} />
  </div>
));
FilterCard.displayName = "FilterCard";
