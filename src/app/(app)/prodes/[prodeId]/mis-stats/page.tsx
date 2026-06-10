import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Target, CheckCircle, AlertCircle, Clock } from 'lucide-react'

const STAGE_LABELS: Record<string, string> = {
  group_stage: 'Fase de grupos',
  round_of_32: 'Ronda de 32',
  round_of_16: 'Ronda de 16',
  quarterfinal: 'Cuartos de final',
  semifinal: 'Semifinales',
  third_place: 'Tercer puesto',
  final: 'Final',
}

const STAGE_ORDER = [
  'group_stage', 'round_of_32', 'round_of_16',
  'quarterfinal', 'semifinal', 'third_place', 'final',
]

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  )
}

export default async function MisStatsPage({
  params,
}: {
  params: Promise<{ prodeId: string }>
}) {
  const { prodeId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: predictions }, { data: champPred }, { data: config }] = await Promise.all([
    supabase
      .from('predictions')
      .select('match_id, home_goals, away_goals, points_earned, matches(stage, status)')
      .eq('prode_id', prodeId)
      .eq('user_id', user.id),
    supabase
      .from('champion_predictions')
      .select('team_id, points_earned, teams(name, flag_url)')
      .eq('prode_id', prodeId)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('tournament_config')
      .select('value')
      .eq('key', 'champion_team_id')
      .maybeSingle(),
  ])

  const allPreds = predictions ?? []

  // Only predictions with a result
  const withResult = allPreds.filter(p => p.points_earned !== null)
  const pending = allPreds.filter(p => p.points_earned === null)
  const exact = withResult.filter(p => p.points_earned === 3)
  const partial = withResult.filter(p => p.points_earned === 1)
  const missed = withResult.filter(p => p.points_earned === 0)

  const totalMatchPoints = withResult.reduce((s, p) => s + (p.points_earned ?? 0), 0)
  const champBonus = champPred?.points_earned ?? 0
  const totalPoints = totalMatchPoints + champBonus

  const accuracyCount = exact.length + partial.length
  const accuracyDenominator = withResult.length

  // Points by stage
  const byStage: Record<string, { pts: number; exact: number; partial: number; missed: number; total: number }> = {}
  for (const p of withResult) {
    const stage = (p.matches as any)?.stage ?? 'unknown'
    if (!byStage[stage]) byStage[stage] = { pts: 0, exact: 0, partial: 0, missed: 0, total: 0 }
    byStage[stage].pts += p.points_earned ?? 0
    byStage[stage].total++
    if (p.points_earned === 3) byStage[stage].exact++
    else if (p.points_earned === 1) byStage[stage].partial++
    else byStage[stage].missed++
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Puntos totales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-green-600">{exact.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Exactos (+3)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{partial.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Parciales (+1)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{pending.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Pendientes</div>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy bars */}
      {withResult.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="size-4" />
              Precisión general
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="size-3.5 text-green-600" />
                  <span>Exactos</span>
                </div>
                <span className="font-medium">{exact.length} / {withResult.length}</span>
              </div>
              <ProgressBar value={exact.length} max={withResult.length} color="bg-green-500" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="size-3.5 text-yellow-500" />
                  <span>Con signo correcto</span>
                </div>
                <span className="font-medium">{accuracyCount} / {accuracyDenominator}</span>
              </div>
              <ProgressBar value={accuracyCount} max={accuracyDenominator} color="bg-yellow-400" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 text-red-500" />
                  <span>Errados</span>
                </div>
                <span className="font-medium">{missed.length} / {withResult.length}</span>
              </div>
              <ProgressBar value={missed.length} max={withResult.length} color="bg-red-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Points by stage */}
      {STAGE_ORDER.filter(s => byStage[s]).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Puntos por fase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {STAGE_ORDER.filter(s => byStage[s]).map(stage => {
                const s = byStage[stage]
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium">{STAGE_LABELS[stage] ?? stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{s.total} partidos</span>
                        <Badge variant="secondary" className="font-mono">{s.pts} pts</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 text-xs text-muted-foreground">
                      <span className="text-green-600">{s.exact} exactos</span>
                      <span>·</span>
                      <span className="text-yellow-600">{s.partial} parciales</span>
                      <span>·</span>
                      <span className="text-red-500">{s.missed} errados</span>
                    </div>
                    <Separator className="mt-3" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Champion prediction */}
      {champPred && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4" />
              Predicción de campeón
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(champPred.teams as any)?.flag_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(champPred.teams as any).flag_url}
                    alt=""
                    className="w-6 h-4 object-cover rounded-sm"
                  />
                )}
                <span className="font-medium">{(champPred.teams as any)?.name ?? 'Equipo'}</span>
              </div>
              {config?.value ? (
                <Badge
                  className={
                    champPred.points_earned === 10
                      ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  {champPred.points_earned === 10 ? '+10 pts ✓' : '0 pts'}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Pendiente</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {allPreds.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Todavía no cargaste predicciones para este prode.
        </div>
      )}
    </div>
  )
}
