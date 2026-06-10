import { createServerSupabaseClient } from '@/lib/supabase/server'
import SetChampionForm from './set-champion-form'
import { Trophy } from 'lucide-react'

export default async function AdminCampeonPage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: teams }, { data: config }] = await Promise.all([
    supabase.from('teams').select('id, name, code, flag_url').order('name'),
    supabase
      .from('tournament_config')
      .select('value')
      .eq('key', 'champion_team_id')
      .maybeSingle(),
  ])

  const currentChampionId = config?.value ?? null

  const teamMap: Record<string, { name: string; flag_url: string | null }> = {}
  for (const t of teams ?? []) {
    teamMap[t.id] = { name: t.name, flag_url: t.flag_url }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="size-6 text-yellow-500" />
        <div>
          <h2 className="text-2xl font-bold">Declarar campeón</h2>
          <p className="text-sm text-muted-foreground">
            Al seleccionar el campeón se recalculan automáticamente los puntos bonus de todos los jugadores.
          </p>
        </div>
      </div>

      {currentChampionId && teamMap[currentChampionId] && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 flex items-center gap-3">
          <Trophy className="size-5 text-yellow-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Campeón actual</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {teamMap[currentChampionId].flag_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={teamMap[currentChampionId].flag_url!}
                  alt=""
                  className="w-5 h-3.5 object-cover rounded-sm"
                />
              )}
              <span className="text-sm text-yellow-800 font-medium">
                {teamMap[currentChampionId].name}
              </span>
            </div>
          </div>
        </div>
      )}

      <SetChampionForm teams={teams ?? []} currentChampionId={currentChampionId} />
    </div>
  )
}
