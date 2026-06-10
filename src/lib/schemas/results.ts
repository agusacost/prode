import { z } from 'zod'

export const LoadResultSchema = z.object({
  matchId: z.string().uuid('Invalid match ID'),
  homeGoals: z.number().int().min(0).max(30, 'Goals must be between 0 and 30'),
  awayGoals: z.number().int().min(0).max(30, 'Goals must be between 0 and 30'),
})

export type LoadResultInput = z.infer<typeof LoadResultSchema>
