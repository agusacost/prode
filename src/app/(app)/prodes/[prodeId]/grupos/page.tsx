import { createServerSupabaseClient } from '@/lib/supabase/server'
import { calcularPosiciones, type TeamInfo, type MatchWithResult } from '@/lib/group-standings'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires',
  })
}

function PredictionBadge({ pred, result }: {
  pred: { home: number; away: number } | undefined
  result: { home_goals: number; away_goals: number } | null
  status: string
}) {
  if (!pred) return <span className="text-muted-foreground text-xs">—</span>

  const text = `${pred.home}–${pred.away}`

  if (!result) {
    return <Badge variant="outline" className="font-mono text-xs">{text}</Badge>
  }

  const predSign = Math.sign(pred.home - pred.away)
  const resSign = Math.sign(result.home_goals - result.away_goals)
  const exact = pred.home === result.home_goals && pred.away === result.away_goals

  if (exact) {
    return <Badge className="bg-green-100 text-green-800 border-green-200 font-mono text-xs hover:bg-green-100">{text} ✓</Badge>
  }
  if (predSign === resSign) {
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-mono text-xs hover:bg-yellow-100">{text}</Badge>
  }
  return <Badge className="bg-red-100 text-red-800 border-red-200 font-mono text-xs hover:bg-red-100">{text}</Badge>
}

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

  const predMap: Record<string, { home: number; away: number; points: number | null }> = {}
  for (const p of userPredictions ?? []) {
    predMap[p.match_id] = { home: p.home_goals, away: p.away_goals, points: p.points_earned }
  }

  return (
    <div className="space-y-8">
      {groups.map(group => {
        const groupTeams = (teams.filter(t => t.group_id === group.id) as TeamInfo[])
        const groupMatches = matches.filter(m => m.group_id === group.id)

        const matchesForStandings: MatchWithResult[] = groupMatches.map(m => ({
          id: m.id,
          home_team_id: m.home_team_id,
          away_team_id: m.away_team_id,
          status: m.status,
          result: (m.result as any)?.[0] ?? null,
        }))

        const standings = calcularPosiciones(groupTeams, matchesForStandings)

        return (
          <Card key={group.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Grupo {group.code}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Standings table */}
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs">Equipo</TableHead>
                      <TableHead className="text-center text-xs w-8">PJ</TableHead>
                      <TableHead className="text-center text-xs w-8">G</TableHead>
                      <TableHead className="text-center text-xs w-8">E</TableHead>
                      <TableHead className="text-center text-xs w-8">P</TableHead>
                      <TableHead className="text-center text-xs w-10 hidden sm:table-cell">GF</TableHead>
                      <TableHead className="text-center text-xs w-10 hidden sm:table-cell">GC</TableHead>
                      <TableHead className="text-center text-xs w-10">DG</TableHead>
                      <TableHead className="text-center text-xs w-10 font-bold">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((row, idx) => (
                      <TableRow key={row.team.id} className={idx < 2 ? 'bg-green-50/50' : ''}>
                        <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {row.team.flag_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={row.team.flag_url} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
                            )}
                            <span className="text-xs font-medium truncate">{row.team.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-xs">{row.played}</TableCell>
                        <TableCell className="text-center text-xs">{row.won}</TableCell>
                        <TableCell className="text-center text-xs">{row.drawn}</TableCell>
                        <TableCell className="text-center text-xs">{row.lost}</TableCell>
                        <TableCell className="text-center text-xs hidden sm:table-cell">{row.gf}</TableCell>
                        <TableCell className="text-center text-xs hidden sm:table-cell">{row.ga}</TableCell>
                        <TableCell className="text-center text-xs">
                          {row.gd > 0 ? `+${row.gd}` : row.gd}
                        </TableCell>
                        <TableCell className="text-center text-xs font-bold">{row.pts}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Group matches */}
              <div className="space-y-2">
                {groupMatches.map(match => {
                  const homeTeam = (match.home_team as any)
                  const awayTeam = (match.away_team as any)
                  const result = (match.result as any)?.[0] ?? null
                  const pred = predMap[match.id]

                  return (
                    <div key={match.id} className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-muted-foreground w-32 shrink-0 hidden sm:block">
                        {formatDate(match.match_date)}
                      </span>
                      <div className="flex flex-1 items-center gap-1.5 justify-center min-w-0">
                        <div className="flex items-center gap-1 justify-end flex-1 min-w-0">
                          {homeTeam?.flag_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={homeTeam.flag_url} alt="" className="w-4 h-3 object-cover rounded-sm shrink-0" />
                          )}
                          <span className="truncate text-xs font-medium">{homeTeam?.name ?? 'TBD'}</span>
                        </div>
                        <span className="text-xs font-mono font-semibold shrink-0 w-12 text-center">
                          {result ? `${result.home_goals}–${result.away_goals}` : '—'}
                        </span>
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          {awayTeam?.flag_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={awayTeam.flag_url} alt="" className="w-4 h-3 object-cover rounded-sm shrink-0" />
                          )}
                          <span className="truncate text-xs font-medium">{awayTeam?.name ?? 'TBD'}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <PredictionBadge pred={pred} result={result} status={match.status} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
