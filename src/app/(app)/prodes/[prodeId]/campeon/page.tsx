import { createServerSupabaseClient } from '@/lib/supabase/server'
import ChampionPickerForm from './champion-picker-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Lock } from 'lucide-react'

export default async function CampeonPage({
  params,
}: {
  params: Promise<{ prodeId: string }>
}) {
  const { prodeId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: teams },
    { data: myPick },
    { data: allPicks },
    { data: members },
    { data: firstMatch },
    { data: config },
  ] = await Promise.all([
    supabase.from('teams').select('id, name, code, flag_url').order('name'),
    supabase
      .from('champion_predictions')
      .select('team_id')
      .eq('prode_id', prodeId)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('champion_predictions')
      .select('user_id, team_id, points_earned')
      .eq('prode_id', prodeId),
    supabase
      .from('prode_members')
      .select('user_id, user:users(username)')
      .eq('prode_id', prodeId),
    supabase
      .from('matches')
      .select('match_date')
      .order('match_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('tournament_config')
      .select('value')
      .eq('key', 'champion_team_id')
      .maybeSingle(),
  ])

  const tournamentStarted = firstMatch
    ? new Date() >= new Date(firstMatch.match_date)
    : false

  const championTeamId = config?.value ?? null

  const teamMap: Record<string, { name: string; flag_url: string | null; code: string }> = {}
  for (const t of teams ?? []) {
    teamMap[t.id] = { name: t.name, flag_url: t.flag_url, code: t.code }
  }

  const memberMap: Record<string, string> = {}
  for (const m of members ?? []) {
    memberMap[m.user_id] = (m.user as any)?.username ?? 'Desconocido'
  }

  const picksWithUser = (allPicks ?? []).map((p) => ({
    username: memberMap[p.user_id] ?? 'Desconocido',
    isMe: p.user_id === user.id,
    team: teamMap[p.team_id],
    points: p.points_earned,
  }))

  const champion = championTeamId ? teamMap[championTeamId] : null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Trophy className="size-6 text-yellow-500" />
        <div>
          <h3 className="font-semibold">Predicción de campeón</h3>
          <p className="text-sm text-muted-foreground">
            Elegí quién va a ganar el Mundial 2026. +10 puntos si acertás.
          </p>
        </div>
      </div>

      {champion && (
        <div className="flex items-center gap-3 rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <Trophy className="size-5 text-yellow-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">¡Campeón declarado!</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {champion.flag_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={champion.flag_url} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
              )}
              <span className="text-sm text-yellow-800 font-medium">{champion.name}</span>
            </div>
          </div>
        </div>
      )}

      {tournamentStarted ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-4">
          <Lock className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            El torneo comenzó. Las predicciones de campeón están cerradas.
          </p>
        </div>
      ) : (
        <ChampionPickerForm
          prodeId={prodeId}
          teams={teams ?? []}
          currentTeamId={myPick?.team_id ?? null}
        />
      )}

      {/* All picks (shown when tournament has started or after champion declared) */}
      {(tournamentStarted || champion) && picksWithUser.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Picks del grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {picksWithUser.map((pick, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between gap-3 rounded-md p-2 ${
                    pick.isMe ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {pick.username}
                      {pick.isMe && <span className="text-primary ml-1 text-xs">(vos)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {pick.team ? (
                      <div className="flex items-center gap-1.5">
                        {pick.team.flag_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pick.team.flag_url} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                        )}
                        <span className="text-sm">{pick.team.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin pick</span>
                    )}
                    {champion && pick.points !== null && (
                      <Badge
                        className={
                          pick.points === 10
                            ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {pick.points === 10 ? '+10' : '0'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show current pick before tournament starts (only to self) */}
      {!tournamentStarted && myPick && teamMap[myPick.team_id] && (
        <div className="rounded-md border p-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Tu pick actual:</span>
          {teamMap[myPick.team_id].flag_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={teamMap[myPick.team_id].flag_url ?? ''} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
          )}
          <span className="font-medium text-foreground">{teamMap[myPick.team_id].name}</span>
        </div>
      )}
    </div>
  )
}
