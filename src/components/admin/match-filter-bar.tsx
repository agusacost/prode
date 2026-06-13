'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { STAGE_LABELS } from '@/lib/stages'
import {
  MatchFilters,
  availableDays,
  availableGroups,
  availableStages,
  formatDayLabel,
} from '@/lib/match-filters'

interface Props {
  matches: any[]
  filters: MatchFilters
  onChange: (filters: MatchFilters) => void
}

export function MatchFilterBar({ matches, filters, onChange }: Props) {
  const days = availableDays(matches)
  const groups = availableGroups(matches)
  const stages = availableStages(matches)

  const hasActiveFilters = filters.text || filters.group || filters.stage || filters.day

  return (
    <div className="space-y-3 mb-6 p-4 rounded-lg border bg-muted/30">
      <div className="flex flex-wrap gap-3">
        <Input
          type="text"
          placeholder="Buscar selección…"
          value={filters.text}
          onChange={e =>
            onChange({
              ...filters,
              text: e.target.value,
            })
          }
          className="max-w-xs"
        />

        <select
          value={filters.group}
          onChange={e =>
            onChange({
              ...filters,
              group: e.target.value,
            })
          }
          className="px-2.5 py-1 rounded-lg border border-input bg-transparent text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        >
          <option value="">Todos los grupos</option>
          {groups.map(g => (
            <option key={g} value={g}>
              Grupo {g}
            </option>
          ))}
        </select>

        <select
          value={filters.stage}
          onChange={e =>
            onChange({
              ...filters,
              stage: e.target.value,
            })
          }
          className="px-2.5 py-1 rounded-lg border border-input bg-transparent text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        >
          <option value="">Todas las etapas</option>
          {stages.map(s => (
            <option key={s} value={s}>
              {STAGE_LABELS[s as keyof typeof STAGE_LABELS]}
            </option>
          ))}
        </select>

        <select
          value={filters.day}
          onChange={e =>
            onChange({
              ...filters,
              day: e.target.value,
            })
          }
          className="px-2.5 py-1 rounded-lg border border-input bg-transparent text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        >
          <option value="">Todas las fechas</option>
          {days.map(d => (
            <option key={d} value={d}>
              {formatDayLabel(d)}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                text: '',
                group: '',
                stage: '',
                day: '',
              })
            }
          >
            <X className="size-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {matches.length} {matches.length === 1 ? 'partido' : 'partidos'}
      </div>
    </div>
  )
}
