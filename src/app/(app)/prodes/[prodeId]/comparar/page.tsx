import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'

const STAGE_LABELS: Record<string, string> = {
  group_stage: 'Fase de grupos',
  round_of_32: 'Ronda de 32',
  round_of_16: 'Ronda de 16',
  quarterfinal: 'Cuartos de final',
  semifinal: 'Semifinales',
  third_place: 'Tercer puesto',
  final: 'Final',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires',
  })
}

function PointsBadge({ points }: { points: number | null }) {
  if (points === null) return null
  if (points === 3) return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-xs">+3</Badge>
  if (points === 1) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 text-xs">+1</Badge>
  return <Badge variant="outline" className="text-muted-foreground text-xs">0</Badge>
}

export default async function CompararPage({
  params,
}: {
  params: Promise<{ prodeId: string }>
}) {
  const { prodeId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: members },
    { data: matchesData },
    { data: predictionsData },
  ] = await Promise.all([
    supabase
      .from('prode_members')
      .select('user_id, user:users(username)')
      .eq('prode_id', prodeId)
      .order('total_score', { ascending: false }),
    supabase
      .from('matches')
      .select(`
        id, stage, match_date, status,
        home_team:teams!home_team_id(name, code, flag_url),
        away_team:teams!away_team_id(name, code, flag_url),
        home_slot, away_slot,
        result:match_results(home_goals, away_goals)
      `)
      .in('status', ['in_progress', 'finished'])
      .order('match_date', { ascending: true }),
    supabase
      .from('predictions')
      .select('match_id, user_id, home_goals, away_goals, points_earned')
      .eq('prode_id', prodeId),
  ])

  if (!members || !matchesData) return null

  // Index predictions by match_id → user_id
  type PredRow = { home_goals: number; away_goals: number; points_earned: number | null }
  const predIndex: Record<string, Record<string, PredRow>> = {}
  for (const p of predictionsData ?? []) {
    if (!predIndex[p.match_id]) predIndex[p.match_id] = {}
    predIndex[p.match_id][p.user_id] = {
      home_goals: p.home_goals,
      away_goals: p.away_goals,
      points_earned: p.points_earned,
    }
  }

  // Group matches by stage
  const STAGE_ORDER = ['group_stage', 'round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final']
  const byStage: Record<string, typeof matchesData> = {}
  for (const m of matchesData) {
    if (!byStage[m.stage]) byStage[m.stage] = []
    byStage[m.stage].push(m)
  }

  if (matchesData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Lock className="size-10 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Las predicciones se revelan una vez que comienza cada partido.</p>
        <p className="text-sm text-muted-foreground mt-1">Todavía no hay partidos iniciados o finalizados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Solo se muestran partidos ya iniciados o finalizados.
      </p>

      {STAGE_ORDER.filter(s => byStage[s]?.length > 0).map(stage => (
        <section key={stage} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {STAGE_LABELS[stage] ?? stage}
          </h3>

          <div className="space-y-3">
            {byStage[stage].map(match => {
              const homeTeam = (match.home_team as any)?.name || match.home_slot || 'TBD'
              const awayTeam = (match.away_team as any)?.name || match.away_slot || 'TBD'
              const homeFlag = (match.home_team as any)?.flag_url
              const awayFlag = (match.away_team as any)?.flag_url
              const result = (match.result as any) ?? null

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
                        {formatDate(match.match_date)}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {members.map(member => {
                        const pred = predIndex[match.id]?.[member.user_id]
                        const username = (member.user as any)?.username ?? 'Desconocido'
                        const isMe = member.user_id === user.id

                        return (
                          <div
                            key={member.user_id}
                            className={`rounded-md border p-2 text-xs space-y-1 ${isMe ? 'border-primary/40 bg-primary/5' : ''}`}
                          >
                            <div className="font-medium truncate">
                              {username}
                              {isMe && <span className="text-primary ml-1">(vos)</span>}
                            </div>
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
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
