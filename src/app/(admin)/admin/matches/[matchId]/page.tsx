import { createServerSupabaseClient } from '@/lib/supabase/server'
import ResultForm from './result-form'

export default async function MatchResultPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, stage, match_date, venue, status,
      home_team:teams!home_team_id(name, code),
      away_team:teams!away_team_id(name, code),
      home_slot, away_slot,
      result:match_results(home_goals, away_goals),
      group:tournament_groups(code, name)
    `)
    .eq('id', matchId)
    .single()

  if (!match) {
    return <div className="text-gray-600">Partido no encontrado.</div>
  }

  return <ResultForm match={match} matchId={matchId} />
}
