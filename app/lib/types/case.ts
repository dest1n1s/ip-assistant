import { z } from "zod";

export const CaseSchema = z.object({
  id: z.string().optional(),
  court: z.string(),
  judgedAt: z.coerce.date(),
  name: z.string(),
  trialProcedure: z.string().optional(),
  cause: z.array(z.string()),
  type: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  content: z.record(z.string(), z.string()),
  relatedLaw: z.string().optional(),
  relationalIndex: z.string().optional(),
  legislationIDsCited: z.string().array().optional(),
  textScore: z.number().optional(),
  vectorScore: z.number().optional(),
  sortScore: z.number().optional(),
});

export type Case = z.infer<typeof CaseSchema>;
