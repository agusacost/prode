export interface TeamInfo {
  id: string
  name: string
  code: string
  flag_url: string | null
}

export interface MatchWithResult {
  id: string
  home_team_id: string | null
  away_team_id: string | null
  status: string
  result: { home_goals: number; away_goals: number } | null
  prediction?: { home_goals: number; away_goals: number } | null
}

export interface StandingRow {
  team: TeamInfo
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
}

export function calcularPosiciones(
  teams: TeamInfo[],
  matches: MatchWithResult[],
  mode: 'real' | 'prediction' = 'real'
): StandingRow[] {
  const rows: Record<string, StandingRow> = {}

  for (const team of teams) {
    rows[team.id] = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
  }

  for (const match of matches) {
    const score = mode === 'prediction'
      ? match.prediction
      : (match.status === 'finished' ? match.result : null)
    if (!score) continue
    if (!match.home_team_id || !match.away_team_id) continue

    const home = rows[match.home_team_id]
    const away = rows[match.away_team_id]
    if (!home || !away) continue

    const { home_goals: hg, away_goals: ag } = score

    home.played++; away.played++
    home.gf += hg; home.ga += ag
    away.gf += ag; away.ga += hg
    home.gd = home.gf - home.ga
    away.gd = away.gf - away.ga

    if (hg > ag) {
      home.won++; home.pts += 3; away.lost++
    } else if (hg < ag) {
      away.won++; away.pts += 3; home.lost++
    } else {
      home.drawn++; home.pts += 1; away.drawn++; away.pts += 1
    }
  }

  return Object.values(rows).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.team.name.localeCompare(b.team.name)
  })
}
