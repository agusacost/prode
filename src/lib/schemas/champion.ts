import { z } from 'zod'

export const SaveChampionSchema = z.object({
  prodeId: z.string().uuid(),
  teamId: z.string().uuid(),
})

export const SetChampionSchema = z.object({
  teamId: z.string().uuid(),
})
