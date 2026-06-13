'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MatchFilterBar } from '@/components/admin/match-filter-bar'
import { STAGE_ORDER, STAGE_LABELS } from '@/lib/stages'
import { MatchFilters, filterMatches } from '@/lib/match-filters'

function formatUTC(dateStr: string) {
  const d = new Date(dateStr)
  const dd = d.getUTCDate().toString().padStart(2, '0')
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, '0')
  const HH = d.getUTCHours().toString().padStart(2, '0')
  const MM = d.getUTCMinutes().toString().padStart(2, '0')
  return `${dd}/${mm} ${HH}:${MM} UTC`
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'finished')
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        Finalizado
      </Badge>
    )
  if (status === 'in_progress')
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
        En curso
      </Badge>
    )
  return <Badge variant="outline" className="text-muted-foreground">Programado</Badge>
}

function MatchesTable({ matches }: { matches: any[] }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Partido</TableHead>
            <TableHead className="hidden sm:table-cell">Fecha UTC</TableHead>
            <TableHead className="text-center">Resultado</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map(match => {
            const homeTeam = (match.home_team as any)?.name || match.home_slot || 'TBD'
            const awayTeam = (match.away_team as any)?.name || match.away_slot || 'TBD'
            const result = (match.result as any)

            return (
              <TableRow key={match.id}>
                <TableCell className="font-medium">
                  {homeTeam} <span className="text-muted-foreground">vs</span> {awayTeam}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap">
                  {formatUTC(match.match_date)}
                </TableCell>
                <TableCell className="text-center font-mono font-semibold">
                  {result ? `${result.home_goals} – ${result.away_goals}` : '—'}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={match.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/matches/${match.id}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                  >
                    {match.status === 'finished' ? 'Editar' : 'Cargar'}
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

interface Props {
  matches: any[]
}

export function AdminResultsClient({ matches }: Props) {
  const [filters, setFilters] = useState<MatchFilters>({
    text: '',
    group: '',
    stage: '',
    day: '',
  })

  const filteredMatches = useMemo(() => filterMatches(matches, filters), [matches, filters])

  const byStage: Record<string, typeof matches> = useMemo(() => {
    const result: Record<string, typeof matches> = {}
    for (const match of filteredMatches) {
      if (!result[match.stage]) result[match.stage] = []
      result[match.stage].push(match)
    }
    return result
  }, [filteredMatches])

  return (
    <div className="space-y-6">
      <MatchFilterBar matches={matches} filters={filters} onChange={setFilters} />

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
              <h3 className="text-xl font-semibold">Fase de Grupos</h3>
              {Object.keys(byGroup)
                .sort()
                .map(groupCode => (
                  <div key={groupCode} className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Grupo {groupCode}
                    </p>
                    <MatchesTable matches={byGroup[groupCode]} />
                  </div>
                ))}
            </section>
          )
        }

        return (
          <section key={stage} className="space-y-3">
            <h3 className="text-xl font-semibold">{STAGE_LABELS[stage]}</h3>
            <MatchesTable matches={stageMatches} />
          </section>
        )
      })}

      {filteredMatches.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          No se encontraron partidos con los filtros aplicados
        </div>
      )}
    </div>
  )
}
