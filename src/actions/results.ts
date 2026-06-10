'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LoadResultSchema } from '@/lib/schemas/results'
import { calcularPuntos } from '@/lib/scoring'

export async function loadResult(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = LoadResultSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { general: ['Unauthorized'] } }
  }

  // Verify user is admin
  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (adminError || !adminUser?.is_admin) {
    return { error: { general: ['Only admins can load results'] } }
  }

  // Upsert match result and update match status
  const admin = createAdminClient()

  const { data: result, error: resultError } = await admin
    .from('match_results')
    .upsert(
      {
        match_id: parsed.data.matchId,
        home_goals: parsed.data.homeGoals,
        away_goals: parsed.data.awayGoals,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'match_id' }
    )
    .select()
    .single()

  if (resultError) {
    return { error: { general: [resultError.message] } }
  }

  // Update match status to finished
  const { error: updateError } = await admin
    .from('matches')
    .update({ status: 'finished' })
    .eq('id', parsed.data.matchId)

  if (updateError) {
    return { error: { general: [updateError.message] } }
  }

  // Recalculate points for all predictions on this match
  await recalcularPuntos(parsed.data.matchId)

  return { success: true, result }
}

async function recalcularPuntos(matchId: string) {
  const admin = createAdminClient()

  // Step 1: Get the authoritative result
  const { data: result, error: resultError } = await admin
    .from('match_results')
    .select('home_goals, away_goals')
    .eq('match_id', matchId)
    .single()

  if (resultError || !result) return

  // Step 2: Get ALL predictions for this match across ALL prodes
  const { data: predictions, error: predictionsError } = await admin
    .from('predictions')
    .select('id, prode_id, user_id, home_goals, away_goals')
    .eq('match_id', matchId)

  if (predictionsError || !predictions?.length) return

  // Step 3: Compute points and update each prediction
  const updates = predictions.map(p => ({
    id: p.id,
    points_earned: calcularPuntos(
      { home: p.home_goals, away: p.away_goals },
      { home: result.home_goals, away: result.away_goals }
    ),
    updated_at: new Date().toISOString(),
  }))

  const { error: updateError } = await admin
    .from('predictions')
    .upsert(updates as any, { onConflict: 'id' })

  if (updateError) {
    console.error('Error updating predictions:', updateError)
    return
  }

  // Step 4 & 5: Recalculate totals for each affected (prode_id, user_id) pair
  const memberKeys = [...new Set(predictions.map(p => `${p.prode_id}::${p.user_id}`))]

  for (const key of memberKeys) {
    const [prodeId, userId] = key.split('::')

    // Re-aggregate from ALL predictions with earned points in this prode
    const { data: agg, error: aggError } = await admin
      .from('predictions')
      .select('points_earned')
      .eq('prode_id', prodeId)
      .eq('user_id', userId)
      .not('points_earned', 'is', null)

    if (aggError) {
      console.error('Error aggregating scores:', aggError)
      continue
    }

    const totalScore = agg?.reduce((s, r) => s + (r.points_earned ?? 0), 0) ?? 0
    const exactResults = agg?.filter(r => r.points_earned === 3).length ?? 0
    const correctSigns = agg?.filter(r => r.points_earned === 1).length ?? 0

    const { error: memberError } = await admin
      .from('prode_members')
      .update({
        total_score: totalScore,
        exact_results: exactResults,
        correct_signs: correctSigns,
      })
      .eq('prode_id', prodeId)
      .eq('user_id', userId)

    if (memberError) {
      console.error('Error updating member scores:', memberError)
    }
  }
}
