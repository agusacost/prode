export const STAGE_ORDER = [
  'group_stage',
  'round_of_32',
  'round_of_16',
  'quarterfinal',
  'semifinal',
  'third_place',
  'final',
] as const

export const STAGE_LABELS: Record<(typeof STAGE_ORDER)[number], string> = {
  group_stage: 'Fase de grupos',
  round_of_32: 'Dieciseisavos de final',
  round_of_16: 'Octavos de final',
  quarterfinal: 'Cuartos de final',
  semifinal: 'Semifinales',
  third_place: 'Tercer puesto',
  final: 'Final',
}
