'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
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

function PointsBadge({ points }: { points: number | null }) {
  if (points === null) return null
  if (points === 3)
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-xs">
        +3
      </Badge>
    )
  if (points === 1)
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 text-xs">
        +1
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-muted-foreground text-xs">
      0
    </Badge>
  )
}

interface Props {
  matches: any[]
  memberList: any[]
  predIndex: Record<string, Record<string, any>>
}

export function PrediccionesMatchesClient({ matches, memberList, predIndex }: Props) {
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

  function MatchCard({ match }: { match: (typeof matches)[number] }) {
    const homeTeam = (match.home_team as any)?.name || match.home_slot || 'TBD'
    const awayTeam = (match.away_team as any)?.name || match.away_slot || 'TBD'
    const homeFlag = (match.home_team as any)?.flag_url
    const awayFlag = (match.away_team as any)?.flag_url
    const result = (match.result as any) ?? null

    return (
      <Card key={match.id}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="flex items-center gap-2">
              {homeFlag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={homeFlag} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
              )}
              <span>{homeTeam}</span>
              <span className="text-muted-foreground font-mono">
                {result ? `${result.home_goals}–${result.away_goals}` : '—'}
              </span>
              <span>{awayTeam}</span>
              {awayFlag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={awayFlag} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
              )}
            </div>
            <div className="text-xs text-muted-foreground font-normal mt-0.5">
              {formatUTC(match.match_date)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {memberList.map(member => {
              const pred = predIndex[match.id]?.[member.user_id]
              const username = (member.user as any)?.username ?? 'Desconocido'
              const avatarUrl = (member.user as any)?.avatar_url

              return (
                <div key={member.user_id} className="rounded-md border p-2 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-medium truncate">
                    <Avatar size="sm" className="shrink-0">
                      {avatarUrl && <AvatarImage src={avatarUrl} />}
                      <AvatarFallback className="text-[10px] bg-muted">
                        {username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{username}</span>
                  </div>
                  {pred ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold">
                        {pred.home_goals}–{pred.away_goals}
                      </span>
                      <PointsBadge points={pred.points_earned} />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sin predicción</span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

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
              <h3 className="text-xl font-semibold">{STAGE_LABELS[stage]}</h3>
              {Object.keys(byGroup)
                .sort()
                .map(groupCode => (
                  <div key={groupCode} className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Grupo {groupCode}
                    </p>
                    <div className="space-y-3">
                      {byGroup[groupCode].map(match => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  </div>
                ))}
            </section>
          )
        }

        return (
          <section key={stage} className="space-y-3">
            <h3 className="text-xl font-semibold">{STAGE_LABELS[stage]}</h3>
            <div className="space-y-3">
              {stageMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
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
