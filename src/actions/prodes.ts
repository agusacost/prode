'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CreateProdeSchema, JoinProdeSchema } from '@/lib/schemas/prodes'
import { generateInviteCode } from '@/lib/invite-code'

export async function createProde(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = CreateProdeSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { general: ['Unauthorized'] } }
  }

  const inviteCode = generateInviteCode()

  const { data: prode, error: prodeError } = await supabase
    .from('prodes')
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      invite_code: inviteCode,
    })
    .select()
    .single()

  if (prodeError) {
    return { error: { general: [prodeError.message] } }
  }

  // Add owner as first member
  const { error: memberError } = await supabase
    .from('prode_members')
    .insert({
      prode_id: prode.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) {
    return { error: { general: [memberError.message] } }
  }

  return { success: true, prode }
}

export async function joinProde(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = JoinProdeSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { general: ['Unauthorized'] } }
  }

  // Find prode by invite code
  const { data: prodes, error: findError } = await supabase
    .from('prodes')
    .select('id, is_active')
    .eq('invite_code', parsed.data.inviteCode)
    .single()

  if (findError || !prodes) {
    return { error: { inviteCode: ['Invalid invite code'] } }
  }

  if (!prodes.is_active) {
    return { error: { inviteCode: ['This prode is no longer active'] } }
  }

  // Add user as member
  const { error: joinError } = await supabase
    .from('prode_members')
    .insert({
      prode_id: prodes.id,
      user_id: user.id,
      role: 'member',
    })

  if (joinError) {
    if (joinError.code === '23505') { // unique constraint violation
      return { error: { inviteCode: ['You are already a member of this prode'] } }
    }
    return { error: { general: [joinError.message] } }
  }

  return { success: true, prodeId: prodes.id }
}

export async function leaveProde(prodeId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('prode_members')
    .delete()
    .eq('prode_id', prodeId)
    .eq('user_id', user.id)
    .eq('role', 'member')

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
