'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SavePredictionsSchema } from '@/lib/schemas/predictions'
import { isGroupStageLocked } from '@/lib/constants'

export async function savePredictions(formData: FormData) {
  const raw = Object.fromEntries(formData)

  // Parse predictions array from form data
  const predictions = []
  let i = 0
  while (formData.has(`predictions.${i}.matchId`)) {
    predictions.push({
      matchId: formData.get(`predictions.${i}.matchId`),
      homeGoals: Number(formData.get(`predictions.${i}.homeGoals`)),
      awayGoals: Number(formData.get(`predictions.${i}.awayGoals`)),
    })
    i++
  }

  const parsed = SavePredictionsSchema.safeParse({
    prodeId: raw.prodeId,
    predictions,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { general: ['Unauthorized'] } }
  }

  // Verify user is member of prode and build upsert data
  const { data: member, error: memberError } = await supabase
    .from('prode_members')
    .select('id')
    .eq('prode_id', parsed.data.prodeId)
    .eq('user_id', user.id)
    .single()

  if (memberError || !member) {
    return { error: { general: ['You are not a member of this prode'] } }
  }

  // Block predictions for matches closing within 1 hour
  const { data: closedMatches } = await supabase
    .from('matches')
    .select('id')
    .in('id', parsed.data.predictions.map(p => p.matchId))
    .lte('match_date', new Date(Date.now() + 60 * 60 * 1000).toISOString())

  if (closedMatches?.length) {
    return { error: { general: ['Uno o más partidos ya cerraron sus predicciones (1h antes del inicio)'] } }
  }

  // Block predictions for group-stage matches after the fixed deadline
  if (isGroupStageLocked()) {
    const { data: groupStageMatches } = await supabase
      .from('matches')
      .select('id')
      .in('id', parsed.data.predictions.map(p => p.matchId))
      .eq('stage', 'group_stage')

    if (groupStageMatches?.length) {
      return { error: { general: ['Las predicciones de la fase de grupos están cerradas'] } }
    }
  }

  // Prepare predictions for upsert
  const predictionsToInsert = parsed.data.predictions.map(p => ({
    prode_id: parsed.data.prodeId,
    user_id: user.id,
    match_id: p.matchId,
    home_goals: p.homeGoals,
    away_goals: p.awayGoals,
  }))

  const { error: insertError } = await supabase
    .from('predictions')
    .upsert(predictionsToInsert, {
      onConflict: 'prode_id,user_id,match_id',
    })

  if (insertError) {
    return { error: { general: [insertError.message] } }
  }

  return { success: true }
}
