import { createServerSupabaseClient } from '@/lib/supabase/server'
import { calcularPosiciones, type TeamInfo, type MatchWithResult } from '@/lib/group-standings'

function resolveSlot(
  slot: string | null,
  standings: Record<string, ReturnType<typeof calcularPosiciones>>,
  best3rd: { groupCode: string; team: TeamInfo }[],
  usedBest3rd: Set<string>
): TeamInfo | null {
  if (!slot) return null

  const directMatch = slot.match(/^([12])° Grupo ([A-L])$/)
  if (directMatch) {
    const pos = parseInt(directMatch[1]) - 1
    const groupCode = directMatch[2]
    return standings[groupCode]?.[pos]?.team ?? null
  }

  const thirdMatch = slot.match(/^3° ([A-L/]+)$/)
  if (thirdMatch) {
    const eligibleGroups = thirdMatch[1].split('/')
    const candidate = best3rd.find(t => eligibleGroups.includes(t.groupCode) && !usedBest3rd.has(t.team.id))
    if (candidate) {
      usedBest3rd.add(candidate.team.id)
      return candidate.team
    }
  }

  return null
}

function computeBest3rd(standings: Record<string, ReturnType<typeof calcularPosiciones>>) {
  return Object.entries(standings)
    .filter(([, rows]) => rows.length >= 3)
    .map(([groupCode, rows]) => ({ groupCode, team: rows[2].team, row: rows[2] }))
    .sort((a, b) => {
      if (b.row.pts !== a.row.pts) return b.row.pts - a.row.pts
      if (b.row.gd !== a.row.gd) return b.row.gd - a.row.gd
      if (b.row.gf !== a.row.gf) return b.row.gf - a.row.gf
      return a.groupCode.localeCompare(b.groupCode)
    })
    .slice(0, 8)
}

function TeamChip({ team, fallback }: { team: TeamInfo | null; fallback: string }) {
  if (!team) return <span className="text-xs text-muted-foreground italic">{fallback}</span>
  return (
    <span className="flex items-center gap-1.5">
      {team.flag_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.flag_url} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
      )}
      <span className="text-sm font-medium">{team.name}</span>
    </span>
  )
}

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

  const predMap: Record<string, { home: number; away: number }> = {}
  for (const p of userPredictions ?? []) {
    predMap[p.match_id] = { home: p.home_goals, away: p.away_goals }
  }

  // Build simulated standings per group
  const standings: Record<string, ReturnType<typeof calcularPosiciones>> = {}
  for (const group of groups) {
    const groupTeams = teams.filter(t => t.group_id === group.id) as TeamInfo[]
    const matches: MatchWithResult[] = groupMatches
      .filter(m => m.group_id === group.id)
      .map(m => {
        const realResult = (m.result as any) ?? null
        const pred = predMap[m.id]
        return {
          id: m.id,
          home_team_id: m.home_team_id,
          away_team_id: m.away_team_id,
          status: 'finished',
          result: realResult ?? (pred ? { home_goals: pred.home, away_goals: pred.away } : null),
        }
      })
      .filter(m => m.result !== null)
    standings[group.code] = calcularPosiciones(groupTeams, matches)
  }

  const best3rd = computeBest3rd(standings)
  const usedBest3rd = new Set<string>()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mis cruces</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Proyección según tus predicciones. Los partidos ya finalizados usan el resultado real.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Dieciseisavos de final
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {r32Matches.map((match, idx) => {
            // Use real team if already assigned, otherwise simulate from standings
            const homeTeam: TeamInfo | null =
              (match.home_team as any)
                ?? resolveSlot(match.home_slot, standings, best3rd, usedBest3rd)
            const awayTeam: TeamInfo | null =
              (match.away_team as any)
                ?? resolveSlot(match.away_slot, standings, best3rd, usedBest3rd)

            return (
              <div key={match.id} className="flex items-center gap-2 rounded-md border px-3 py-2.5">
                <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                <div className="flex flex-1 items-center justify-end">
                  <TeamChip team={homeTeam} fallback={match.home_slot ?? '?'} />
                </div>
                <span className="text-xs text-muted-foreground px-1">vs</span>
                <div className="flex flex-1 items-center">
                  <TeamChip team={awayTeam} fallback={match.away_slot ?? '?'} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Los cruces de octavos en adelante se mostrarán cuando el bracket se resuelva.
      </p>
    </div>
  )
}
