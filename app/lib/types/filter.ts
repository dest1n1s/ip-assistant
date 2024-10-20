import { z } from "zod";

export const NestedFilterSchema: z.ZodType<NestedFilter> = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  count: z.number(),
  selected: z.boolean(),
  hasChildren: z.boolean(),
  children: z.array(z.lazy(() => NestedFilterSchema)).optional(), // Using z.lazy to handle recursive type
});

export interface NestedFilter {
  name: string;
  displayName?: string;
  count: number;
  selected: boolean;
  hasChildren: boolean;
  children?: NestedFilter[];
}

export const FilterCategorySchema = z.object({
  name: z.string(),
  displayName: z.string(),
  filters: z.array(NestedFilterSchema),
});

export type FilterCategory = z.infer<typeof FilterCategorySchema>;
