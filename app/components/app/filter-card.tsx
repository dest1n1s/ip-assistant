import { memo, useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { ChevronRight, Dot } from "lucide-react";
import { cn } from "~/lib/utils";
import { FilterCategory, NestedFilter } from "~/lib/types/filter";

export const FilterItem = memo(
  ({
    filter,
    onFilterChanged,
  }: {
    filter: NestedFilter;
    onFilterChanged: (filter: NestedFilter) => void;
  }) => {
    const [expanded, setExpanded] = useState(false);
    const selected = filter.selected;
    const setSelected = (v: boolean) => {
      onFilterChanged({ ...filter, selected: v });
    };
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Checkbox checked={selected} onCheckedChange={setSelected} />
          <div className="grow">
            {filter.name}{" "}
            <span className="text-foreground-weaken-2 text-sm">
              ({filter.count})
            </span>
          </div>
          {filter.children.length > 0 ? (
            <ChevronRight
              className={cn(
                "transform transition-transform cursor-pointer",
                expanded && "rotate-90"
              )}
              onClick={() => {
                setExpanded(!expanded);
              }}
            />
          ) : (
            <Dot />
          )}
        </div>
        {expanded && (
          <div className="pl-4">
            {filter.children.map((child) => (
              <FilterItem
                key={child.name}
                filter={child}
                onFilterChanged={(f) => {
                  onFilterChanged({
                    ...filter,
                    children: filter.children.map((ff) =>
                      ff.name === f.name ? f : ff
                    ),
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);
FilterItem.displayName = "FilterItem";

export interface FilterCardProps {
  filter: FilterCategory;
  onFilterChanged: (filter: FilterCategory) => void;
}

export const FilterCardHeader = memo(
  ({ filter: { name } }: FilterCardProps) => (
    <div className="py-3 px-4">
      <div className="text-lg font-semibold">{name}</div>
    </div>
  )
);
FilterCardHeader.displayName = "FilterCardHeader";

export const FilterCardContent = memo(
  ({ filter: filterCategory, onFilterChanged }: FilterCardProps) => (
    <div className="p-4 flex flex-col gap-2">
      {filterCategory.filters.map((filter) => (
        <FilterItem
          key={filter.name}
          filter={filter}
          onFilterChanged={(f) => {
            onFilterChanged({
              ...filterCategory,
              filters: filterCategory.filters.map((ff) =>
                ff.name === f.name ? f : ff
              ),
            });
          }}
        />
      ))}
    </div>
  )
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
