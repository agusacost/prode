'use client'

import { useMemo, useState } from 'react'
import { calcularPosiciones, type TeamInfo, type MatchWithResult } from '@/lib/group-standings'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Score = { home_goals: number; away_goals: number }
type Mode = 'real' | 'prediction'

interface MatchData {
  id: string
  match_date: string
  home_team_id: string | null
  away_team_id: string | null
  home_team: TeamInfo | null
  away_team: TeamInfo | null
  status: string
  result: Score | null
  prediction: Score | null
}

export interface GroupData {
  id: string
  code: string
  name: string
  teams: TeamInfo[]
  matches: MatchData[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires',
  })
}

function formatScore(score: Score | null) {
  return score ? `${score.home_goals}–${score.away_goals}` : '—'
}

function PredictionBadge({ pred, result }: { pred: Score | null; result: Score | null }) {
  if (!pred) return <span className="text-muted-foreground text-xs">—</span>

  const text = formatScore(pred)

  if (!result) {
    return <Badge variant="outline" className="font-mono text-xs">{text}</Badge>
  }

  const predSign = Math.sign(pred.home_goals - pred.away_goals)
  const resSign = Math.sign(result.home_goals - result.away_goals)
  const exact = pred.home_goals === result.home_goals && pred.away_goals === result.away_goals

  if (exact) {
    return <Badge className="bg-green-100 text-green-800 border-green-200 font-mono text-xs hover:bg-green-100">{text} ✓</Badge>
  }
  if (predSign === resSign) {
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-mono text-xs hover:bg-yellow-100">{text}</Badge>
  }
  return <Badge className="bg-red-100 text-red-800 border-red-200 font-mono text-xs hover:bg-red-100">{text}</Badge>
}

function GroupCard({ group, mode }: { group: GroupData; mode: Mode }) {
  const matchesForStandings: MatchWithResult[] = useMemo(() => group.matches.map(m => ({
    id: m.id,
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
    status: m.status,
    result: m.result,
    prediction: m.prediction,
  })), [group.matches])

  const standings = useMemo(
    () => calcularPosiciones(group.teams, matchesForStandings, mode),
    [group.teams, matchesForStandings, mode]
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Grupo {group.code}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Standings table */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 text-center text-xs">#</TableHead>
                <TableHead className="text-xs">Equipo</TableHead>
                <TableHead className="text-center text-xs w-8">PJ</TableHead>
                <TableHead className="text-center text-xs w-8">G</TableHead>
                <TableHead className="text-center text-xs w-8">E</TableHead>
                <TableHead className="text-center text-xs w-8">P</TableHead>
                <TableHead className="text-center text-xs w-10 hidden sm:table-cell">GF</TableHead>
                <TableHead className="text-center text-xs w-10 hidden sm:table-cell">GC</TableHead>
                <TableHead className="text-center text-xs w-10">DG</TableHead>
                <TableHead className="text-center text-xs w-10 font-bold">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((row, idx) => (
                <TableRow key={row.team.id} className={idx < 2 ? 'bg-green-50/50' : ''}>
                  <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {row.team.flag_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.team.flag_url} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
                      )}
                      <span className="text-xs font-medium truncate">{row.team.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs">{row.played}</TableCell>
                  <TableCell className="text-center text-xs">{row.won}</TableCell>
                  <TableCell className="text-center text-xs">{row.drawn}</TableCell>
                  <TableCell className="text-center text-xs">{row.lost}</TableCell>
                  <TableCell className="text-center text-xs hidden sm:table-cell">{row.gf}</TableCell>
                  <TableCell className="text-center text-xs hidden sm:table-cell">{row.ga}</TableCell>
                  <TableCell className="text-center text-xs">
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </TableCell>
                  <TableCell className="text-center text-xs font-bold">{row.pts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Separator />

        {/* Group matches */}
        <div className="space-y-2">
          {group.matches.map(match => {
            const homeTeam = match.home_team
            const awayTeam = match.away_team
            const central = mode === 'real' ? match.result : match.prediction

            return (
              <div key={match.id} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground w-32 shrink-0 hidden sm:block">
                  {formatDate(match.match_date)}
                </span>
                <div className="flex flex-1 items-center gap-1.5 justify-center min-w-0">
                  <div className="flex items-center gap-1 justify-end flex-1 min-w-0">
                    {homeTeam?.flag_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={homeTeam.flag_url} alt="" className="w-4 h-3 object-cover rounded-sm shrink-0" />
                    )}
                    <span className="truncate text-xs font-medium">{homeTeam?.name ?? 'TBD'}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold shrink-0 w-12 text-center">
                    {formatScore(central)}
                  </span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {awayTeam?.flag_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={awayTeam.flag_url} alt="" className="w-4 h-3 object-cover rounded-sm shrink-0" />
                    )}
                    <span className="truncate text-xs font-medium">{awayTeam?.name ?? 'TBD'}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  {mode === 'real' ? (
                    <PredictionBadge pred={match.prediction} result={match.result} />
                  ) : match.result ? (
                    <Badge variant="outline" className="font-mono text-xs">{formatScore(match.result)}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function GruposClient({ groups }: { groups: GroupData[] }) {
  const [mode, setMode] = useState<Mode>('real')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">Grupos</h1>
        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
          <TabsList>
            <TabsTrigger value="real">Resultados reales</TabsTrigger>
            <TabsTrigger value="prediction">Mi predicción</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {groups.map(group => (
        <GroupCard key={group.id} group={group} mode={mode} />
      ))}
    </div>
  )
}
