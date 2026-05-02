import { z } from 'zod'

const BigIntStringSchema = z.string().regex(/^\d+$/, 'must be a non-negative integer string')

const ViewEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string(),
  score: BigIntStringSchema,
  username: z.string(),
  country: z.string().optional(),
})

export type ViewEntry = z.infer<typeof ViewEntrySchema>

const MetaSchema = z.object({
  isoWeek: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  pool: BigIntStringSchema,
})
export type Meta = z.infer<typeof MetaSchema>

export const TopResponseSchema = z.object({
  meta: MetaSchema,
  count: z.number().int().nonnegative(),
  entries: z.array(ViewEntrySchema),
})
export type TopResponse = z.infer<typeof TopResponseSchema>

const OwnRankPayloadSchema = z.object({
  rank: z.number().int().positive(),
  totalPlayers: z.number().int().nonnegative(),
  cluster: z.array(ViewEntrySchema),
})
export type OwnRankPayload = z.infer<typeof OwnRankPayloadSchema>

export const OwnRankResponseSchema = z.object({
  meta: MetaSchema,
  rank: z.number().int().positive(),
  totalPlayers: z.number().int().nonnegative(),
  cluster: z.array(ViewEntrySchema),
})
export type OwnRankResponse = z.infer<typeof OwnRankResponseSchema>

export const CurrentResponseSchema = z.object({
  meta: MetaSchema,
  top: z.object({
    count: z.number().int().nonnegative(),
    entries: z.array(ViewEntrySchema),
  }),
  me: OwnRankPayloadSchema.nullable(),
})
export type CurrentResponse = z.infer<typeof CurrentResponseSchema>

export const SampleUsersResponseSchema = z.object({
  isoWeek: z.string(),
  count: z.number().int().nonnegative(),
  users: z.array(ViewEntrySchema),
})
export type SampleUsersResponse = z.infer<typeof SampleUsersResponseSchema>

/**
 * Known error codes the backend emits (panteon-leaderboard-api ADR-010
 * + the standard handler in `plugins/error-handler.ts`). The schema
 * accepts unknown codes too — backend may add new ones without a
 * frontend release — so callers should treat the type as "one of
 * these we know how to react to, or a string we surface verbatim."
 */
export const KNOWN_API_ERROR_CODES = [
  'invalid_query',
  'invalid_params',
  'unranked',
  'not_found',
  'internal_error',
  'bad_request',
  'rate_limited',
] as const
export type KnownApiErrorCode = (typeof KNOWN_API_ERROR_CODES)[number]
export type ApiErrorCode = KnownApiErrorCode | (string & {})

export const ApiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})
