import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { TeamInfo } from '@/lib/group-standings'
import { GruposClient, type GroupData } from './grupos-client'

export default async function GruposPage({
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
    { data: matches },
    { data: userPredictions },
  ] = await Promise.all([
    supabase
      .from('tournament_groups')
      .select('id, code, name')
      .order('code'),
    supabase
      .from('teams')
      .select('id, name, code, flag_url, group_id'),
    supabase
      .from('matches')
      .select(`
        id, stage, match_date, venue, status,
        home_team_id, away_team_id,
        home_team:teams!home_team_id(id, name, code, flag_url),
        away_team:teams!away_team_id(id, name, code, flag_url),
        result:match_results(home_goals, away_goals),
        group_id
      `)
      .eq('stage', 'group_stage')
      .order('match_date', { ascending: true }),
    supabase
      .from('predictions')
      .select('match_id, home_goals, away_goals, points_earned')
      .eq('prode_id', prodeId)
      .eq('user_id', user.id),
  ])

  if (!groups || !teams || !matches) return null

  const predMap: Record<string, { home_goals: number; away_goals: number }> = {}
  for (const p of userPredictions ?? []) {
    predMap[p.match_id] = { home_goals: p.home_goals, away_goals: p.away_goals }
  }

  const groupsData: GroupData[] = groups.map(group => {
    const groupTeams = (teams.filter(t => t.group_id === group.id) as TeamInfo[])
    const groupMatches = matches.filter(m => m.group_id === group.id)

    return {
      id: group.id,
      code: group.code,
      name: group.name,
      teams: groupTeams,
      matches: groupMatches.map(m => ({
        id: m.id,
        match_date: m.match_date,
        home_team_id: m.home_team_id,
        away_team_id: m.away_team_id,
        home_team: (m.home_team as any) ?? null,
        away_team: (m.away_team as any) ?? null,
        status: m.status,
        result: (m.result as any)?.[0] ?? null,
        prediction: predMap[m.id] ?? null,
      })),
    }
  })

  return <GruposClient groups={groupsData} />
}
