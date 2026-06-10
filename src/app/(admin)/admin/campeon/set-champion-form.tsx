'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setChampion } from '@/actions/champion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Team {
  id: string
  name: string
  code: string
  flag_url: string | null
}

interface Props {
  teams: Team[]
  currentChampionId: string | null
}

function groupTeamsByLetter(teams: Team[]) {
  const grouped: Record<string, Team[]> = {}
  for (const t of teams) {
    const letter = t.name[0].toUpperCase()
    if (!grouped[letter]) grouped[letter] = []
    grouped[letter].push(t)
  }
  return grouped
}

export default function SetChampionForm({ teams, currentChampionId }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(currentChampionId)
  const [saving, setSaving] = useState(false)

  const grouped = groupTeamsByLetter(teams)

  async function handleSave() {
    if (!selectedId) return
    setSaving(true)

    const formData = new FormData()
    formData.append('teamId', selectedId)

    const result = await setChampion(formData)

    if ('error' in result) {
      const msg = Object.values(result.error || {}).flat()[0] || 'Error'
      toast.error(msg)
    } else {
      toast.success('¡Campeón declarado! Puntos recalculados.')
      router.refresh()
    }

    setSaving(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Seleccionar equipo campeón</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-80 overflow-y-auto rounded-md border divide-y">
          {Object.keys(grouped).sort().map(letter => (
            <div key={letter}>
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                {letter}
              </div>
              {grouped[letter].map(team => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setSelectedId(team.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors ${
                    selectedId === team.id ? 'bg-primary/10 font-medium' : ''
                  }`}
                >
                  {team.flag_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={team.flag_url} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />
                  )}
                  <span>{team.name}</span>
                  {selectedId === team.id && (
                    <span className="ml-auto text-primary text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <Button
          onClick={handleSave}
          disabled={!selectedId || saving || selectedId === currentChampionId}
          className="w-full"
        >
          {saving ? 'Guardando...' : 'Declarar campeón y recalcular puntos'}
        </Button>
      </CardContent>
    </Card>
  )
}
