import { z } from 'zod'

export const PredictionRowSchema = z.object({
  matchId: z.string().uuid('Invalid match ID'),
  homeGoals: z.number().int().min(0).max(20, 'Goals must be between 0 and 20'),
  awayGoals: z.number().int().min(0).max(20, 'Goals must be between 0 and 20'),
})

export const SavePredictionsSchema = z.object({
  prodeId: z.string().uuid('Invalid prode ID'),
  predictions: z.array(PredictionRowSchema).min(1).max(48),
})

export type PredictionRow = z.infer<typeof PredictionRowSchema>
export type SavePredictionsInput = z.infer<typeof SavePredictionsSchema>
