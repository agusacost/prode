'use client'

import { useMemo, useState } from 'react'
import { calcularPosiciones, type TeamInfo, type MatchWithResult } from '@/lib/group-standings'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Mode = 'real' | 'prediction'
type StandingsByGroup = Record<string, ReturnType<typeof calcularPosiciones>>

export interface CrucesGroupData {
  id: string
  code: string
  teams: TeamInfo[]
  matches: MatchWithResult[]
}

export interface R32MatchData {
  id: string
  home_slot: string | null
  away_slot: string | null
  home_team: TeamInfo | null
  away_team: TeamInfo | null
}

/** A group "has data" once at least one team has a computed match in this mode. */
function groupHasData(standings: StandingsByGroup, groupCode: string): boolean {
  return standings[groupCode]?.some(row => row.played > 0) ?? false
}

function resolveSlot(
  slot: string | null,
  standings: StandingsByGroup,
  best3rd: { groupCode: string; team: TeamInfo }[],
  usedBest3rd: Set<string>
): TeamInfo | null {
  if (!slot) return null

  const directMatch = slot.match(/^([12])° Grupo ([A-L])$/)
  if (directMatch) {
    const pos = parseInt(directMatch[1]) - 1
    const groupCode = directMatch[2]
    if (!groupHasData(standings, groupCode)) return null
    return standings[groupCode]?.[pos]?.team ?? null
  }

  const thirdMatch = slot.match(/^3° ([A-L/]+)$/)
  if (thirdMatch) {
    const eligibleGroups = thirdMatch[1].split('/')
    const candidate = best3rd.find(t =>
      eligibleGroups.includes(t.groupCode) &&
      !usedBest3rd.has(t.team.id) &&
      groupHasData(standings, t.groupCode)
    )
    if (candidate) {
      usedBest3rd.add(candidate.team.id)
      return candidate.team
    }
  }

  return null
}

/** All 12 third-placed teams, ranked best-first (pts → dif. gol → GF → grupo). */
function computeBest3rd(standings: StandingsByGroup) {
  return Object.entries(standings)
    .filter(([, rows]) => rows.length >= 3)
    .map(([groupCode, rows]) => ({ groupCode, team: rows[2].team, row: rows[2] }))
    .sort((a, b) => {
      if (b.row.pts !== a.row.pts) return b.row.pts - a.row.pts
      if (b.row.gd !== a.row.gd) return b.row.gd - a.row.gd
      if (b.row.gf !== a.row.gf) return b.row.gf - a.row.gf
      return a.groupCode.localeCompare(b.groupCode)
    })
}

function TeamChip({ team, fallback }: { team: TeamInfo | null; fallback: string }) {
  if (!team) return <span className="text-xs text-muted-foreground italic">{fallback}</span>
  return (
    <span className="flex items-center gap-1.5">
      {team.flag_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.flag_url} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
      )}
      <span className="text-sm font-medium">{team.name}</span>
    </span>
  )
}

export function CrucesClient({ groups, r32Matches }: { groups: CrucesGroupData[]; r32Matches: R32MatchData[] }) {
  const [mode, setMode] = useState<Mode>('prediction')

  const standings = useMemo(() => {
    const result: StandingsByGroup = {}
    for (const group of groups) {
      result[group.code] = calcularPosiciones(group.teams, group.matches, mode)
    }
    return result
  }, [groups, mode])

  const best3rdAll = useMemo(() => computeBest3rd(standings), [standings])
  const best3rdQualified = useMemo(() => best3rdAll.slice(0, 8), [best3rdAll])

  const best3rdVisible = useMemo(
    () => best3rdAll
      .map((t, rank) => ({ ...t, rank }))
      .filter(t => groupHasData(standings, t.groupCode)),
    [best3rdAll, standings]
  )

  const resolvedMatches = useMemo(() => {
    const usedBest3rd = new Set<string>()
    return r32Matches.map(match => {
      const homeReal = mode === 'real' ? match.home_team : null
      const awayReal = mode === 'real' ? match.away_team : null
      return {
        ...match,
        homeTeam: homeReal ?? resolveSlot(match.home_slot, standings, best3rdQualified, usedBest3rd),
        awayTeam: awayReal ?? resolveSlot(match.away_slot, standings, best3rdQualified, usedBest3rd),
      }
    })
  }, [r32Matches, standings, best3rdQualified, mode])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Mis cruces</h2>
        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
          <TabsList>
            <TabsTrigger value="real">Resultados reales</TabsTrigger>
            <TabsTrigger value="prediction">Mi predicción</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <p className="text-sm text-muted-foreground">
        {mode === 'prediction'
          ? 'Proyección de los cruces de dieciseisavos según tus predicciones de la fase de grupos.'
          : 'Proyección según los resultados reales de la fase de grupos. Los partidos no finalizados no se cuentan.'}
      </p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Dieciseisavos de final
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {resolvedMatches.map((match, idx) => (
            <div key={match.id} className="flex items-center gap-2 rounded-md border px-3 py-2.5">
              <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}</span>
              <div className="flex flex-1 items-center justify-end">
                <TeamChip team={match.homeTeam} fallback={match.home_slot ?? '?'} />
              </div>
              <span className="text-xs text-muted-foreground px-1">vs</span>
              <div className="flex flex-1 items-center">
                <TeamChip team={match.awayTeam} fallback={match.away_slot ?? '?'} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Mejores terceros
        </h3>
        <p className="text-xs text-muted-foreground">
          Los 8 mejores terceros (resaltados) avanzan a dieciseisavos.
        </p>
        {best3rdVisible.length > 0 ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 text-center text-xs">#</TableHead>
                  <TableHead className="text-xs w-12">Grupo</TableHead>
                  <TableHead className="text-xs">Equipo</TableHead>
                  <TableHead className="text-center text-xs w-8">PJ</TableHead>
                  <TableHead className="text-center text-xs w-10 hidden sm:table-cell">GF</TableHead>
                  <TableHead className="text-center text-xs w-10 hidden sm:table-cell">GC</TableHead>
                  <TableHead className="text-center text-xs w-10">DG</TableHead>
                  <TableHead className="text-center text-xs w-10 font-bold">Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {best3rdVisible.map((t, idx) => (
                  <TableRow key={t.team.id} className={t.rank < 8 ? 'bg-green-50/50' : ''}>
                    <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="text-xs font-medium">{t.groupCode}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {t.team.flag_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.team.flag_url} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
                        )}
                        <span className="text-xs font-medium truncate">{t.team.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs">{t.row.played}</TableCell>
                    <TableCell className="text-center text-xs hidden sm:table-cell">{t.row.gf}</TableCell>
                    <TableCell className="text-center text-xs hidden sm:table-cell">{t.row.ga}</TableCell>
                    <TableCell className="text-center text-xs">{t.row.gd > 0 ? `+${t.row.gd}` : t.row.gd}</TableCell>
                    <TableCell className="text-center text-xs font-bold">{t.row.pts}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Todavía no hay datos suficientes.</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Los cruces de octavos en adelante se mostrarán cuando el bracket se resuelva.
      </p>
    </div>
  )
}
