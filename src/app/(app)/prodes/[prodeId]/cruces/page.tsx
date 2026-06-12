import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { TeamInfo, MatchWithResult } from '@/lib/group-standings'
import { CrucesClient, type CrucesGroupData, type R32MatchData } from './cruces-client'

export default async function CrucesPage({
  params,
}: {
  params: Promise<{ prodeId: string }>
}) {
  const { prodeId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: groups },
    { data: teams },
    { data: groupMatches },
    { data: userPredictions },
    { data: r32Matches },
  ] = await Promise.all([
    supabase.from('tournament_groups').select('id, code, name').order('code'),
    supabase.from('teams').select('id, name, code, flag_url, group_id'),
    supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, status, group_id, result:match_results(home_goals, away_goals)')
      .eq('stage', 'group_stage'),
    supabase
      .from('predictions')
      .select('match_id, home_goals, away_goals')
      .eq('prode_id', prodeId)
      .eq('user_id', user.id),
    supabase
      .from('matches')
      .select('id, home_slot, away_slot, home_team_id, away_team_id, home_team:teams!home_team_id(id,name,code,flag_url), away_team:teams!away_team_id(id,name,code,flag_url)')
      .eq('stage', 'round_of_32')
      .order('match_date', { ascending: true }),
  ])

  if (!groups || !teams || !groupMatches || !r32Matches) return null

  const predMap: Record<string, { home_goals: number; away_goals: number }> = {}
  for (const p of userPredictions ?? []) {
    predMap[p.match_id] = { home_goals: p.home_goals, away_goals: p.away_goals }
  }

  const groupsData: CrucesGroupData[] = groups.map(group => {
    const groupTeams = teams.filter(t => t.group_id === group.id) as TeamInfo[]
    const matches: MatchWithResult[] = groupMatches
      .filter(m => m.group_id === group.id)
      .map(m => ({
        id: m.id,
        home_team_id: m.home_team_id,
        away_team_id: m.away_team_id,
        status: m.status,
        result: (m.result as any) ?? null,
        prediction: predMap[m.id] ?? null,
      }))

    return { id: group.id, code: group.code, teams: groupTeams, matches }
  })

  const r32Data: R32MatchData[] = r32Matches.map(m => ({
    id: m.id,
    home_slot: m.home_slot,
    away_slot: m.away_slot,
    home_team: (m.home_team as any) ?? null,
    away_team: (m.away_team as any) ?? null,
  }))

  return <CrucesClient groups={groupsData} r32Matches={r32Data} />
}
