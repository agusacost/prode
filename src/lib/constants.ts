// Fecha fija de cierre de predicciones de fase de grupos: 2026-06-11 15:00 ART (18:00 UTC).
// Argentina no tiene horario de verano, por lo que ART = UTC-3 todo el año.
export const GROUP_STAGE_PREDICTIONS_DEADLINE = '2026-06-11T18:00:00Z'

export function isGroupStageLocked(now: Date = new Date()): boolean {
  return now.getTime() >= new Date(GROUP_STAGE_PREDICTIONS_DEADLINE).getTime()
}
