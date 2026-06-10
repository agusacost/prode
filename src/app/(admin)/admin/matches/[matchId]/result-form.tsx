'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadResult } from '@/actions/results'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle } from 'lucide-react'

interface Props {
  match: any
  matchId: string
}

export default function ResultForm({ match, matchId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null)

  const homeTeam = match.home_team?.name || match.home_slot || 'TBD'
  const awayTeam = match.away_team?.name || match.away_slot || 'TBD'
  const result = match.result?.[0]

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors(null)

    const formData = new FormData(e.currentTarget)
    formData.set('matchId', matchId)

    const res = await loadResult(formData)

    if ('error' in res) {
      setErrors(res.error || {})
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{homeTeam} vs {awayTeam}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {match.venue} · {new Date(match.match_date).toUTCString()}
        </p>
      </div>

      {result && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 p-3">
          <CheckCircle className="size-4 text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-800">
            Resultado actual: {homeTeam} {result.home_goals} – {result.away_goals} {awayTeam}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {result ? 'Actualizar resultado' : 'Cargar resultado'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors?.general && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{errors.general[0]}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="homeGoals">Goles — {homeTeam}</Label>
                <Input
                  id="homeGoals"
                  name="homeGoals"
                  type="number"
                  min="0"
                  max="30"
                  required
                  defaultValue={result?.home_goals ?? 0}
                  className="text-center text-xl font-mono h-14"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="awayGoals">Goles — {awayTeam}</Label>
                <Input
                  id="awayGoals"
                  name="awayGoals"
                  type="number"
                  min="0"
                  max="30"
                  required
                  defaultValue={result?.away_goals ?? 0}
                  className="text-center text-xl font-mono h-14"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Guardando...' : result ? 'Actualizar resultado' : 'Guardar resultado'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
