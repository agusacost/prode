'use client'

import { useEffect, useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { savePredictions } from '@/actions/predictions'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Lock, Clock } from 'lucide-react'

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
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires'
  })
}

export default function FixturePage({ params }: { params: Promise<{ prodeId: string }> }) {
  const [prodeId, setProdeId] = useState('')
  const supabase = createClient()
  const [matches, setMatches] = useState<any[]>([])
  const [predictions, setPredictions] = useState<Record<string, { home: number; away: number }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    params.then(({ prodeId: id }) => {
      setProdeId(id)
    })
  }, [params])

  useEffect(() => {
    if (!prodeId) return

    async function fetchData() {
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!home_team_id(name, code, flag_url),
          away_team:teams!away_team_id(name, code, flag_url),
          result:match_results(home_goals, away_goals)
        `)
        .order('match_date', { ascending: true })

      if (matchesData) setMatches(matchesData)

      const { data: predictionsData } = await supabase
        .from('predictions')
        .select('*')
        .eq('prode_id', prodeId)

      if (predictionsData) {
        const pMap: Record<string, { home: number; away: number }> = {}
        predictionsData.forEach(p => {
          pMap[p.match_id] = { home: p.home_goals, away: p.away_goals }
        })
        setPredictions(pMap)
      }

      setLoading(false)
    }

    fetchData()
  }, [prodeId, supabase])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData()
    formData.append('prodeId', prodeId)

    let i = 0
    Object.entries(predictions).forEach(([matchId, pred]) => {
      formData.append(`predictions.${i}.matchId`, matchId)
      formData.append(`predictions.${i}.homeGoals`, pred.home.toString())
      formData.append(`predictions.${i}.awayGoals`, pred.away.toString())
      i++
    })

    const result = await savePredictions(formData)

    if ('error' in result) {
      const msg = Object.values(result.error || {}).flat()[0] || 'Error al guardar'
      toast.error(msg)
    } else {
      toast.success('¡Predicciones guardadas!')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Cargando partidos...
      </div>
    )
  }

  // Group by stage
  const byStage: Record<string, typeof matches> = {}
  for (const m of matches) {
    if (!byStage[m.stage]) byStage[m.stage] = []
    byStage[m.stage].push(m)
  }

  const stageOrder = ['group_stage', 'round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final']

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mis predicciones</h2>
        <form onSubmit={handleSubmit}>
          <Button
            type="submit"
            disabled={saving || Object.keys(predictions).length === 0}
          >
            {saving ? 'Guardando...' : 'Guardar predicciones'}
          </Button>
        </form>
      </div>

      {stageOrder.filter(s => byStage[s]?.length > 0).map(stage => (
        <section key={stage} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {STAGE_LABELS[stage] ?? stage}
          </h3>
          <div className="space-y-2">
            {byStage[stage].map(match => {
              const homeTeam = match.home_team?.name || match.home_slot || 'TBD'
              const awayTeam = match.away_team?.name || match.away_slot || 'TBD'
              const homeFlag = match.home_team?.flag_url
              const awayFlag = match.away_team?.flag_url
              const pred = predictions[match.id] || { home: 0, away: 0 }
              const isPast = new Date(match.match_date) < new Date()
              const isDisabled = isPast || match.status !== 'scheduled'
              const result = match.result?.[0]

              return (
                <Card key={match.id} className={isDisabled ? 'opacity-80' : ''}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {/* Date & status */}
                      <div className="hidden sm:flex flex-col items-center min-w-[80px] text-xs text-muted-foreground">
                        <span>{formatDate(match.match_date)}</span>
                        {isDisabled && (
                          <Badge variant="secondary" className="mt-1 text-xs gap-1">
                            <Lock className="size-2.5" />
                            {match.status === 'finished' ? 'Finalizado' : match.status === 'in_progress' ? 'En curso' : 'Cerrado'}
                          </Badge>
                        )}
                        {!isDisabled && (
                          <Badge variant="outline" className="mt-1 text-xs gap-1">
                            <Clock className="size-2.5" />
                            Abierto
                          </Badge>
                        )}
                      </div>

                      {/* Match */}
                      <div className="flex flex-1 items-center gap-2">
                        {/* Home team */}
                        <div className="flex flex-1 items-center justify-end gap-2">
                          <span className="text-sm font-medium text-right leading-tight">{homeTeam}</span>
                          {homeFlag && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={homeFlag} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />
                          )}
                        </div>

                        {/* Prediction inputs */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            value={pred.home}
                            disabled={isDisabled}
                            onChange={(e) => setPredictions(p => ({
                              ...p,
                              [match.id]: { ...pred, home: parseInt(e.target.value) || 0 },
                            }))}
                            className="w-12 text-center px-1 h-9 font-mono text-base disabled:opacity-60"
                          />
                          <span className="text-muted-foreground font-semibold text-sm">-</span>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            value={pred.away}
                            disabled={isDisabled}
                            onChange={(e) => setPredictions(p => ({
                              ...p,
                              [match.id]: { ...pred, away: parseInt(e.target.value) || 0 },
                            }))}
                            className="w-12 text-center px-1 h-9 font-mono text-base disabled:opacity-60"
                          />
                        </div>

                        {/* Away team */}
                        <div className="flex flex-1 items-center gap-2">
                          {awayFlag && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={awayFlag} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />
                          )}
                          <span className="text-sm font-medium leading-tight">{awayTeam}</span>
                        </div>
                      </div>

                      {/* Result if finished */}
                      {result && (
                        <div className="hidden sm:flex items-center gap-1 text-sm font-mono font-semibold shrink-0 min-w-[40px] justify-center">
                          <span className="text-muted-foreground">{result.home_goals}–{result.away_goals}</span>
                        </div>
                      )}
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
