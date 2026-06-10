'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SaveChampionSchema, SetChampionSchema } from '@/lib/schemas/champion'


export async function saveChampionPrediction(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = SaveChampionSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: { general: ['No autenticado'] } }

  const { data: membership } = await supabase
    .from('prode_members')
    .select('id')
    .eq('prode_id', parsed.data.prodeId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: { general: ['No sos miembro de este prode'] } }
  }

  // Lock after first match kickoff
  const { data: firstMatch } = await supabase
    .from('matches')
    .select('match_date')
    .order('match_date', { ascending: true })
    .limit(1)
    .single()

  if (firstMatch && new Date() >= new Date(firstMatch.match_date)) {
    return { error: { general: ['El torneo ya comenzó. No podés cambiar tu predicción de campeón.'] } }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('champion_predictions')
    .upsert(
      {
        prode_id: parsed.data.prodeId,
        user_id: user.id,
        team_id: parsed.data.teamId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'prode_id,user_id' }
    )

  if (error) return { error: { general: [error.message] } }

  return { success: true }
}

export async function setChampion(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = SetChampionSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: { general: ['No autenticado'] } }

  const { data: adminUser } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminUser?.is_admin) {
    return { error: { general: ['Solo los admins pueden declarar el campeón'] } }
  }

  const admin = createAdminClient()

  const { error: configError } = await admin
    .from('tournament_config')
    .upsert({ key: 'champion_team_id', value: parsed.data.teamId })

  if (configError) return { error: { general: [configError.message] } }

  await recalcularCampeon()

  return { success: true }
}

async function recalcularCampeon() {
  const admin = createAdminClient()

  const { data: config } = await admin
    .from('tournament_config')
    .select('value')
    .eq('key', 'champion_team_id')
    .single()

  if (!config?.value) return

  const championTeamId: string = config.value

  const { data: championPreds } = await admin
    .from('champion_predictions')
    .select('id, prode_id, user_id, team_id')

  if (!championPreds?.length) return

  // Update points_earned for each prediction
  const updates = (championPreds as Array<{ id: string; prode_id: string; user_id: string; team_id: string }>)
    .map(cp => ({
      id: cp.id,
      points_earned: cp.team_id === championTeamId ? 10 : 0,
      updated_at: new Date().toISOString(),
    }))

  await admin.from('champion_predictions').upsert(updates as any, { onConflict: 'id' })

  // Recalculate total_score for each affected prode_member
  const memberKeys = [...new Set(
    (championPreds as Array<{ prode_id: string; user_id: string }>)
      .map(cp => `${cp.prode_id}::${cp.user_id}`)
  )]

  const supabaseAdmin = createAdminClient()

  for (const key of memberKeys) {
    const [prodeId, userId] = key.split('::')

    const [{ data: matchAgg }, { data: champPred }] = await Promise.all([
      supabaseAdmin
        .from('predictions')
        .select('points_earned')
        .eq('prode_id', prodeId)
        .eq('user_id', userId)
        .not('points_earned', 'is', null),
      admin
        .from('champion_predictions')
        .select('points_earned')
        .eq('prode_id', prodeId)
        .eq('user_id', userId)
        .single(),
    ])

    const matchPoints = matchAgg?.reduce((s: number, r: any) => s + (r.points_earned ?? 0), 0) ?? 0
    const champBonus: number = champPred?.points_earned ?? 0
    const totalScore = matchPoints + champBonus
    const exactResults = matchAgg?.filter((r: any) => r.points_earned === 3).length ?? 0
    const correctSigns = matchAgg?.filter((r: any) => r.points_earned === 1).length ?? 0

    await supabaseAdmin
      .from('prode_members')
      .update({ total_score: totalScore, exact_results: exactResults, correct_signs: correctSigns })
      .eq('prode_id', prodeId)
      .eq('user_id', userId)
  }
}
