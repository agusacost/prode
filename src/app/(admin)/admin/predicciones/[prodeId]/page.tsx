import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft, Trophy } from 'lucide-react'

const STAGE_ORDER = [
  'group_stage', 'round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final',
]

const STAGE_LABELS: Record<string, string> = {
  group_stage:  'Fase de grupos',
  round_of_32:  'Dieciseisavos de final',
  round_of_16:  'Octavos de final',
  quarterfinal: 'Cuartos de final',
  semifinal:    'Semifinales',
  third_place:  'Tercer puesto',
  final:        'Final',
}

function formatUTC(dateStr: string) {
  const d = new Date(dateStr)
  const dd = d.getUTCDate().toString().padStart(2, '0')
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, '0')
  const HH = d.getUTCHours().toString().padStart(2, '0')
  const MM = d.getUTCMinutes().toString().padStart(2, '0')
  return `${dd}/${mm} ${HH}:${MM} UTC`
}

function PointsBadge({ points }: { points: number | null }) {
  if (points === null) return null
  if (points === 3) return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-xs">+3</Badge>
  if (points === 1) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 text-xs">+1</Badge>
  return <Badge variant="outline" className="text-muted-foreground text-xs">0</Badge>
}

export default async function AdminPrediccionesProdePage({
  params,
}: {
  params: Promise<{ prodeId: string }>
}) {
  const { prodeId } = await params
  const admin = createAdminClient()

  const [
    { data: prode },
    { data: members },
    { data: matchesData },
    { data: predictionsData },
    { data: championPicks },
    { data: teams },
    { data: config },
  ] = await Promise.all([
    admin.from('prodes').select('id, name').eq('id', prodeId).maybeSingle(),
    admin
      .from('prode_members')
      .select('user_id, total_score, user:users(username)')
      .eq('prode_id', prodeId)
      .order('total_score', { ascending: false }),
    admin
      .from('matches')
      .select(`
        id, stage, match_date, status,
        home_team:teams!home_team_id(name, code, flag_url),
        away_team:teams!away_team_id(name, code, flag_url),
        home_slot, away_slot,
        result:match_results(home_goals, away_goals),
        group:tournament_groups(code)
      `)
      .order('match_date', { ascending: true }),
    admin
      .from('predictions')
      .select('match_id, user_id, home_goals, away_goals, points_earned, submitted_at, updated_at')
      .eq('prode_id', prodeId),
    admin
      .from('champion_predictions')
      .select('user_id, team_id, points_earned, updated_at')
      .eq('prode_id', prodeId),
    admin.from('teams').select('id, name, flag_url'),
    admin
      .from('tournament_config')
      .select('value')
      .eq('key', 'champion_team_id')
      .maybeSingle(),
  ])

  if (!prode || !members || !matchesData) notFound()

  const matches = matchesData
  const memberList = members

  const championTeamId = config?.value ?? null
  const teamMap: Record<string, { name: string; flag_url: string | null }> = {}
  for (const t of teams ?? []) {
    teamMap[t.id] = { name: t.name, flag_url: t.flag_url }
  }

  // Index predictions by match_id -> user_id
  type PredRow = { home_goals: number; away_goals: number; points_earned: number | null; submitted_at: string; updated_at: string }
  const predIndex: Record<string, Record<string, PredRow>> = {}
  for (const p of predictionsData ?? []) {
    if (!predIndex[p.match_id]) predIndex[p.match_id] = {}
    predIndex[p.match_id][p.user_id] = {
      home_goals: p.home_goals,
      away_goals: p.away_goals,
      points_earned: p.points_earned,
      submitted_at: p.submitted_at,
      updated_at: p.updated_at,
    }
  }

  // Champion picks by user
  const championIndex: Record<string, { user_id: string; team_id: string; points_earned: number | null; updated_at: string }> = {}
  for (const c of championPicks ?? []) {
    championIndex[c.user_id] = c
  }

  const totalMatches = matches.length

  // Completion summary per member
  const summary = memberList.map(member => {
    const username = (member.user as any)?.username ?? 'Desconocido'
    let loaded = 0
    let lastUpdate: string | null = null
    for (const m of matches) {
      const pred = predIndex[m.id]?.[member.user_id]
      if (pred) {
        loaded++
        if (!lastUpdate || pred.updated_at > lastUpdate) lastUpdate = pred.updated_at
      }
    }
    const champion = championIndex[member.user_id]
    if (champion && (!lastUpdate || champion.updated_at > lastUpdate)) {
      lastUpdate = champion.updated_at
    }
    return {
      user_id: member.user_id,
      username,
      total_score: member.total_score,
      loaded,
      championTeam: champion ? teamMap[champion.team_id] : null,
      lastUpdate,
    }
  })

  // Group matches by stage (and group_stage by group code)
  const byStage: Record<string, typeof matches> = {}
  for (const m of matches) {
    if (!byStage[m.stage]) byStage[m.stage] = []
    byStage[m.stage].push(m)
  }

  function MatchCard({ match }: { match: (typeof matches)[number] }) {
    const homeTeam = (match.home_team as any)?.name || match.home_slot || 'TBD'
    const awayTeam = (match.away_team as any)?.name || match.away_slot || 'TBD'
    const homeFlag = (match.home_team as any)?.flag_url
    const awayFlag = (match.away_team as any)?.flag_url
    const result = (match.result as any)?.[0] ?? null

    return (
      <Card key={match.id}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="flex items-center gap-2">
              {homeFlag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={homeFlag} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
              )}
              <span>{homeTeam}</span>
              <span className="text-muted-foreground font-mono">
                {result ? `${result.home_goals}–${result.away_goals}` : '—'}
              </span>
              <span>{awayTeam}</span>
              {awayFlag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={awayFlag} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
              )}
            </div>
            <div className="text-xs text-muted-foreground font-normal mt-0.5">
              {formatUTC(match.match_date)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {memberList.map(member => {
              const pred = predIndex[match.id]?.[member.user_id]
              const username = (member.user as any)?.username ?? 'Desconocido'

              return (
                <div key={member.user_id} className="rounded-md border p-2 text-xs space-y-1">
                  <div className="font-medium truncate">{username}</div>
                  {pred ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold">{pred.home_goals}–{pred.away_goals}</span>
                      <PointsBadge points={pred.points_earned} />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sin predicción</span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/predicciones" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          <ArrowLeft className="size-4 mr-1" />
          Prodes
        </Link>
        <h2 className="text-2xl font-bold">{prode.name}</h2>
      </div>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Resumen por usuario</h3>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead className="text-center">Puntos</TableHead>
                <TableHead className="text-center">Predicciones cargadas</TableHead>
                <TableHead>Pick de campeón</TableHead>
                <TableHead className="hidden sm:table-cell">Última carga</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map(row => (
                <TableRow key={row.user_id}>
                  <TableCell className="font-medium">{row.username}</TableCell>
                  <TableCell className="text-center font-mono">{row.total_score}</TableCell>
                  <TableCell className="text-center">
                    {row.loaded} / {totalMatches}
                  </TableCell>
                  <TableCell>
                    {row.championTeam ? (
                      <div className="flex items-center gap-1.5">
                        {row.championTeam.flag_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.championTeam.flag_url} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                        )}
                        <span>{row.championTeam.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin pick</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap">
                    {row.lastUpdate ? formatUTC(row.lastUpdate) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {STAGE_ORDER.filter(s => byStage[s]?.length > 0).map(stage => {
        const stageMatches = byStage[stage]

        if (stage === 'group_stage') {
          const byGroup: Record<string, typeof matches> = {}
          for (const match of stageMatches) {
            const code = (match.group as any)?.code ?? 'X'
            if (!byGroup[code]) byGroup[code] = []
            byGroup[code].push(match)
          }

          return (
            <section key={stage} className="space-y-6">
              <h3 className="text-xl font-semibold">{STAGE_LABELS[stage]}</h3>
              {Object.keys(byGroup).sort().map(groupCode => (
                <div key={groupCode} className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Grupo {groupCode}
                  </p>
                  <div className="space-y-3">
                    {byGroup[groupCode].map(match => <MatchCard key={match.id} match={match} />)}
                  </div>
                </div>
              ))}
            </section>
          )
        }

        return (
          <section key={stage} className="space-y-3">
            <h3 className="text-xl font-semibold">{STAGE_LABELS[stage]}</h3>
            <div className="space-y-3">
              {stageMatches.map(match => <MatchCard key={match.id} match={match} />)}
            </div>
          </section>
        )
      })}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-yellow-500" />
          <h3 className="text-xl font-semibold">Picks de campeón</h3>
        </div>
        <div className="space-y-2">
          {summary.map(row => (
            <div key={row.user_id} className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm">
              <span className="font-medium truncate">{row.username}</span>
              <div className="flex items-center gap-2 shrink-0">
                {row.championTeam ? (
                  <div className="flex items-center gap-1.5">
                    {row.championTeam.flag_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.championTeam.flag_url} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                    )}
                    <span>{row.championTeam.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">Sin pick</span>
                )}
                {championTeamId && championIndex[row.user_id]?.points_earned !== null && championIndex[row.user_id] !== undefined && (
                  <Badge
                    className={
                      championIndex[row.user_id]?.points_earned === 10
                        ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
                        : 'bg-muted text-muted-foreground'
                    }
                  >
                    {championIndex[row.user_id]?.points_earned === 10 ? '+10' : '0'}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
