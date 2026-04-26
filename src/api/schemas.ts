import { z } from 'zod'

const ViewEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string(),
  score: z.string().regex(/^\d+$/, 'score must be a non-negative integer string'),
  username: z.string(),
  externalId: z.string(),
})

export type ViewEntry = z.infer<typeof ViewEntrySchema>

export const TopResponseSchema = z.object({
  isoWeek: z.string(),
  count: z.number().int().nonnegative(),
  entries: z.array(ViewEntrySchema),
})
export type TopResponse = z.infer<typeof TopResponseSchema>

export const OwnRankResponseSchema = z.object({
  isoWeek: z.string(),
  rank: z.number().int().positive(),
  totalPlayers: z.number().int().nonnegative(),
  cluster: z.array(ViewEntrySchema),
})
export type OwnRankResponse = z.infer<typeof OwnRankResponseSchema>

export const ApiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})
