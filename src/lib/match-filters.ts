import { STAGE_ORDER } from './stages'

export interface MatchFilters {
  text: string
  group: string
  stage: string
  day: string
}

export function dayKeyUTC(dateStr: string): string {
  const d = new Date(dateStr)
  const dd = d.getUTCDate().toString().padStart(2, '0')
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, '0')
  const yyyy = d.getUTCFullYear()
  return `${yyyy}-${mm}-${dd}`
}

export function filterMatches<T extends {
  home_team?: { name: string } | null
  away_team?: { name: string } | null
  home_slot?: string | null
  away_slot?: string | null
  stage: string
  match_date: string
  group?: { code: string } | null
}>(matches: T[], filters: MatchFilters): T[] {
  return matches.filter(match => {
    // Text filter: search in team names or slots
    if (filters.text) {
      const text = filters.text.toLowerCase().trim()
      const homeTeam = (match.home_team?.name || match.home_slot || '').toLowerCase()
      const awayTeam = (match.away_team?.name || match.away_slot || '').toLowerCase()
      if (!homeTeam.includes(text) && !awayTeam.includes(text)) {
        return false
      }
    }

    // Group filter
    if (filters.group) {
      if ((match.group?.code ?? '') !== filters.group) {
        return false
      }
    }

    // Stage filter
    if (filters.stage) {
      if (match.stage !== filters.stage) {
        return false
      }
    }

    // Day filter (UTC date)
    if (filters.day) {
      if (dayKeyUTC(match.match_date) !== filters.day) {
        return false
      }
    }

    return true
  })
}

export function availableDays<T extends { match_date: string }>(matches: T[]): string[] {
  const days = new Set(matches.map(m => dayKeyUTC(m.match_date)))
  return Array.from(days).sort()
}

export function availableGroups<T extends { stage: string; group?: { code: string } | null }>(
  matches: T[]
): string[] {
  const groups = new Set(
    matches
      .filter(m => m.stage === 'group_stage')
      .map(m => m.group?.code)
      .filter((code): code is string => Boolean(code))
  )
  return Array.from(groups).sort()
}

export function availableStages<T extends { stage: string }>(matches: T[]): string[] {
  const stages = new Set(matches.map(m => m.stage))
  return STAGE_ORDER.filter(s => stages.has(s))
}

export function formatDayLabel(dayKey: string): string {
  const [, mm, dd] = dayKey.split('-')
  return `${dd}/${mm}`
}
