import { z } from 'zod'

export const CreateProdeSchema = z.object({
  name: z.string().min(3, 'Prode name must be at least 3 characters').max(60).trim(),
})

export const JoinProdeSchema = z.object({
  inviteCode: z.string().min(6, 'Invalid invite code').max(20).trim().toUpperCase(),
})

export type CreateProdeInput = z.infer<typeof CreateProdeSchema>
export type JoinProdeInput = z.infer<typeof JoinProdeSchema>
