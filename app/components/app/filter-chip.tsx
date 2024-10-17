import { cn, generateColor } from "~/lib/utils";

export type FilterChipProps = {
  filter: { category: string; categoryDisplayName: string; name: string };
  className?: string;
  name: string;
  onClick?: (filter: { category: string; name: string }) => void;
};

export function FilterChip({ filter, name, className, onClick }: FilterChipProps) {
  const color = generateColor(filter.category);
  return (
    <div
      className={cn(
        "text-xs rounded-lg bg-opacity-40 px-2 py-1 select-none",
        color.bg,
        color.text,
        onClick && "cursor-pointer",
        className,
      )}
      onClick={() => onClick?.(filter)}
    >
      <span>
        {filter.categoryDisplayName}: {filter.name}
      </span>
      <input type="hidden" name={name} value={`${filter.category}:${filter.name}`} />
    </div>
  );
}
