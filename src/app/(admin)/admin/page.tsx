import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Trophy, CalendarCheck } from 'lucide-react'
import ResolveButton from './bracket/resolve-button'
import { AdminResultsClient } from './admin-results-client'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, stage, match_date, venue, status,
      home_team_id, away_team_id,
      home_team:teams!home_team_id(name, code),
      away_team:teams!away_team_id(name, code),
      home_slot, away_slot,
      result:match_results(home_goals, away_goals),
      group:tournament_groups(code, name)
    `)
    .order('match_date', { ascending: true })

  if (!matches) return null

  const r32Pending = matches.filter(m => m.stage === 'round_of_32' && !m.home_team_id).length
  const groupRemaining = matches.filter(m => m.stage === 'group_stage' && m.status !== 'finished').length

  const byStage: Record<string, typeof matches> = {}
  for (const match of matches) {
    if (!byStage[match.stage]) byStage[match.stage] = []
    byStage[match.stage].push(match)
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cargar resultados</h2>
        <div className="flex flex-wrap gap-2">
          <ResolveButton pendingCount={r32Pending} groupRemaining={groupRemaining} />
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

      <AdminResultsClient matches={matches} />
    </div>
  )
}
