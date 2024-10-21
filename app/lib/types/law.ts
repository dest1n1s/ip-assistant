import { z } from "zod";

export const LawSchema = z.object({
  title: z.string(),
  content: z.record(z.string(), z.any()).array(),
  introduction: z.string().optional(),
  notification: z.string().optional(),
  textScore: z.number().optional(),
  vectorScore: z.number().optional(),
  sortScore: z.number().optional(),
  path: z
    .array(
      z.array(
        z.object({
          index: z.string(),
          name: z.string().optional(),
        }),
      ),
    )
    .optional(),
});

export type Law = z.infer<typeof LawSchema>;
