import { createServerSupabaseClient } from '@/lib/supabase/server'
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
import { Trophy, CalendarCheck } from 'lucide-react'

const STAGE_ORDER = [
  'group_stage', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final',
]

const STAGE_LABELS: Record<string, string> = {
  group_stage:  'Fase de grupos',
  round_of_16:  'Octavos de final',
  quarterfinal: 'Cuartos de final',
  semifinal:    'Semifinales',
  third_place:  'Tercer puesto',
  final:        'Final',
}

function formatUTC(dateStr: string) {
  const d = new Date(dateStr)
  const dd = d.getUTCDate().toString().padStart(2, '0')
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, '0')
  const HH = d.getUTCHours().toString().padStart(2, '0')
  const MM = d.getUTCMinutes().toString().padStart(2, '0')
  return `${dd}/${mm} ${HH}:${MM} UTC`
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'finished') return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Finalizado</Badge>
  if (status === 'in_progress') return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">En curso</Badge>
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
          {matches.map((match) => {
            const homeTeam = (match.home_team as any)?.name || match.home_slot || 'TBD'
            const awayTeam = (match.away_team as any)?.name || match.away_slot || 'TBD'
            const result = (match.result as any)?.[0]

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

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, stage, match_date, venue, status,
      home_team:teams!home_team_id(name, code),
      away_team:teams!away_team_id(name, code),
      home_slot, away_slot,
      result:match_results(home_goals, away_goals),
      group:tournament_groups(code, name)
    `)
    .order('match_date', { ascending: true })

  if (!matches) return null

  const byStage: Record<string, typeof matches> = {}
  for (const match of matches) {
    if (!byStage[match.stage]) byStage[match.stage] = []
    byStage[match.stage].push(match)
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cargar resultados</h2>
        <div className="flex gap-2">
          <Link href="/admin/rondas" className={cn(buttonVariants({ variant: 'outline' }))}>
            <CalendarCheck className="size-4 mr-2" />
            Habilitar rondas
          </Link>
          <Link href="/admin/campeon" className={cn(buttonVariants({ variant: 'outline' }))}>
            <Trophy className="size-4 mr-2" />
            Declarar campeón
          </Link>
        </div>
      </div>

      {STAGE_ORDER.filter((s) => byStage[s]?.length > 0).map((stage) => {
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
              {Object.keys(byGroup).sort().map((groupCode) => (
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
    </div>
  )
}
