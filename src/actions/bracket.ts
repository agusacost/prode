'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcularPosiciones, type TeamInfo, type MatchWithResult } from '@/lib/group-standings'
import { revalidatePath } from 'next/cache'

// ─── helpers ──────────────────────────────────────────────────────────────────

type StandingsByGroup = Record<string, ReturnType<typeof calcularPosiciones>>

/** Parses '1° Grupo A', '2° Grupo B', '3° A/B/C/D' against standings map */
function resolveSlot(slot: string, standings: StandingsByGroup, best3rd: { groupCode: string; teamId: string }[]): string | null {
  const directMatch = slot.match(/^([12])° Grupo ([A-L])$/)
  if (directMatch) {
    const pos = parseInt(directMatch[1]) - 1
    const groupCode = directMatch[2]
    return standings[groupCode]?.[pos]?.team.id ?? null
  }

  const thirdMatch = slot.match(/^3° ([A-L/]+)$/)
  if (thirdMatch) {
    const eligibleGroups = thirdMatch[1].split('/')
    const candidate = best3rd.find(t => eligibleGroups.includes(t.groupCode))
    return candidate?.teamId ?? null
  }

  return null
}

/**
 * Computes the 8 best 3rd-place teams and returns them ranked (best first),
 * removing each as it's assigned to a slot so two slots don't get the same team.
 */
function computeBest3rd(standings: StandingsByGroup): { groupCode: string; teamId: string }[] {
  const thirds = Object.entries(standings)
    .filter(([, rows]) => rows.length >= 3)
    .map(([groupCode, rows]) => ({ groupCode, row: rows[2] }))
    .sort((a, b) => {
      if (b.row.pts !== a.row.pts) return b.row.pts - a.row.pts
      if (b.row.gd !== a.row.gd) return b.row.gd - a.row.gd
      if (b.row.gf !== a.row.gf) return b.row.gf - a.row.gf
      return a.groupCode.localeCompare(b.groupCode)
    })
    .slice(0, 8)
  return thirds.map(t => ({ groupCode: t.groupCode, teamId: t.row.team.id }))
}

// ─── resolveGroupBracket ──────────────────────────────────────────────────────

export async function resolveGroupBracket() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: adminUser } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminUser?.is_admin) return { error: 'Sin permisos' }

  const admin = createAdminClient()

  // Fetch all groups with their teams and finished matches
  const { data: groups } = await admin.from('tournament_groups').select('id, code')
  const { data: teams } = await admin.from('teams').select('id, name, code, flag_url, group_id')
  const { data: groupMatches } = await admin
    .from('matches')
    .select('id, home_team_id, away_team_id, status, result:match_results(home_goals, away_goals)')
    .eq('stage', 'group_stage')

  if (!groups || !teams || !groupMatches) return { error: 'Error cargando datos de grupos' }

  // Build standings per group
  const standings: StandingsByGroup = {}
  for (const group of groups) {
    const groupTeams = teams.filter(t => t.group_id === group.id) as TeamInfo[]
    const matches: MatchWithResult[] = groupMatches
      .filter(m => groupTeams.some(t => t.id === m.home_team_id || t.id === m.away_team_id))
      .map(m => ({ ...m, result: (m.result as any) ?? null }))
    standings[group.code] = calcularPosiciones(groupTeams, matches)
  }

  const best3rd = computeBest3rd(standings)
  const best3rdMutable = [...best3rd]

  // Fetch round_of_32 matches ordered by date (ordinal = index + 1)
  const { data: r32Matches } = await admin
    .from('matches')
    .select('id, home_slot, away_slot')
    .eq('stage', 'round_of_32')
    .order('match_date', { ascending: true })

  if (!r32Matches) return { error: 'No se encontraron partidos de dieciseisavos' }

  let resolved = 0
  for (const match of r32Matches) {
    const homeId = resolveSlot(match.home_slot ?? '', standings, best3rdMutable)
    const awayId = resolveSlot(match.away_slot ?? '', standings, best3rdMutable)

    if (homeId && awayId) {
      await admin
        .from('matches')
        .update({ home_team_id: homeId, away_team_id: awayId })
        .eq('id', match.id)
      // Remove used best-3rd team so it's not assigned twice
      const homeIdx = best3rdMutable.findIndex(t => t.teamId === homeId)
      if (homeIdx !== -1) best3rdMutable.splice(homeIdx, 1)
      const awayIdx = best3rdMutable.findIndex(t => t.teamId === awayId)
      if (awayIdx !== -1) best3rdMutable.splice(awayIdx, 1)
      resolved++
    }
  }

  revalidatePath('/admin')
  return { ok: true, resolved }
}

// ─── advanceBracketWinner ─────────────────────────────────────────────────────

const NEXT_STAGE: Record<string, string> = {
  round_of_32: 'round_of_16',
  round_of_16: 'quarterfinal',
  quarterfinal: 'semifinal',
}

const SLOT_PREFIX: Record<string, string> = {
  round_of_32: 'Gan. R32',
  round_of_16: 'Gan. R16',
  quarterfinal: 'Gan. QF',
}

/**
 * After a knockout match is finished, assign the winner to the next round's match
 * and the loser (for semifinals only) to the third_place match.
 */
export async function advanceBracketWinner(matchId: string) {
  const admin = createAdminClient()

  // Get finished match with result
  const { data: match } = await admin
    .from('matches')
    .select('stage, match_date, home_team_id, away_team_id, result:match_results(home_goals, away_goals)')
    .eq('id', matchId)
    .single()

  if (!match) return

  const result = (match.result as any)
  if (!result) return

  const { home_goals: hg, away_goals: ag } = result
  const winnerId = hg >= ag ? match.home_team_id : match.away_team_id
  const loserId  = hg >= ag ? match.away_team_id : match.home_team_id

  if (!winnerId) return

  const stage: string = match.stage

  // Determine ordinal within this stage (1-indexed, ordered by match_date ASC)
  const { data: stageMatches } = await admin
    .from('matches')
    .select('id')
    .eq('stage', stage)
    .order('match_date', { ascending: true })

  const ordinal = (stageMatches ?? []).findIndex(m => m.id === matchId) + 1
  if (ordinal === 0) return

  const winnerSlot = `${SLOT_PREFIX[stage]}-${ordinal}`

  // Find next round match
  const nextStage = NEXT_STAGE[stage]
  if (nextStage) {
    const { data: nextMatch } = await admin
      .from('matches')
      .select('id, home_slot, away_slot')
      .eq('stage', nextStage)
      .or(`home_slot.eq.${winnerSlot},away_slot.eq.${winnerSlot}`)
      .maybeSingle()

    if (nextMatch) {
      if (nextMatch.home_slot === winnerSlot) {
        await admin.from('matches').update({ home_team_id: winnerId }).eq('id', nextMatch.id)
      } else {
        await admin.from('matches').update({ away_team_id: winnerId }).eq('id', nextMatch.id)
      }
    }
  }

  // Semifinal loser → third_place
  if (stage === 'semifinal' && loserId) {
    const loserSlot = `Per. SF-${ordinal}`
    const { data: thirdMatch } = await admin
      .from('matches')
      .select('id, home_slot, away_slot')
      .eq('stage', 'third_place')
      .or(`home_slot.eq.${loserSlot},away_slot.eq.${loserSlot}`)
      .maybeSingle()

    if (thirdMatch) {
      if (thirdMatch.home_slot === loserSlot) {
        await admin.from('matches').update({ home_team_id: loserId }).eq('id', thirdMatch.id)
      } else {
        await admin.from('matches').update({ away_team_id: loserId }).eq('id', thirdMatch.id)
      }
    }

    // Semifinal winner → final
    const finalSlot = `Gan. SF-${ordinal}`
    const { data: finalMatch } = await admin
      .from('matches')
      .select('id, home_slot, away_slot')
      .eq('stage', 'final')
      .or(`home_slot.eq.${finalSlot},away_slot.eq.${finalSlot}`)
      .maybeSingle()

    if (finalMatch) {
      if (finalMatch.home_slot === finalSlot) {
        await admin.from('matches').update({ home_team_id: winnerId }).eq('id', finalMatch.id)
      } else {
        await admin.from('matches').update({ away_team_id: winnerId }).eq('id', finalMatch.id)
      }
    }
  }
}
