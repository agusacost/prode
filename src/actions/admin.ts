'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setEnabledStages(stages: string[]) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!userData?.is_admin) return { error: 'Sin permisos' }

  const value = ['group_stage', ...stages.filter(s => s !== 'group_stage')].join(',')

  await supabase
    .from('tournament_config')
    .upsert({ key: 'enabled_stages', value }, { onConflict: 'key' })

  revalidatePath('/admin/rondas')
  return { ok: true }
}
