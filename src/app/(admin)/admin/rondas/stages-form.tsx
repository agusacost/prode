'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setEnabledStages } from '@/actions/admin'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const KNOCKOUT_STAGES = [
  { key: 'round_of_32',  label: 'Dieciseisavos de final' },
  { key: 'round_of_16',  label: 'Octavos de final' },
  { key: 'quarterfinal', label: 'Cuartos de final' },
  { key: 'semifinal',    label: 'Semifinales' },
  { key: 'third_place',  label: 'Tercer puesto' },
  { key: 'final',        label: 'Final' },
]

export default function StagesForm({ enabledStages }: { enabledStages: string[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>(
    enabledStages.filter(s => s !== 'group_stage')
  )
  const [saving, setSaving] = useState(false)

  function toggle(key: string) {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    )
  }

  async function handleSave() {
    setSaving(true)
    const result = await setEnabledStages(selected)
    if ('error' in result) {
      toast.error(result.error as string)
    } else {
      toast.success('Rondas actualizadas')
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Rondas visibles para los participantes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {/* group_stage siempre habilitado */}
          <label className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/50 cursor-not-allowed">
            <input type="checkbox" checked disabled className="size-4" />
            <span className="text-sm font-medium">Fase de grupos</span>
            <span className="ml-auto text-xs text-muted-foreground">Siempre habilitada</span>
          </label>

          {KNOCKOUT_STAGES.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(key)}
                onChange={() => toggle(key)}
                className="size-4"
              />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </CardContent>
    </Card>
  )
}
