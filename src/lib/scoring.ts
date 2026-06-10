export type Score = { home: number; away: number }

// Calculate points for a prediction based on the actual result
export function calcularPuntos(prediccion: Score, resultado: Score): number {
  // 3 points for exact score match
  if (prediccion.home === resultado.home && prediccion.away === resultado.away) {
    return 3
  }

  // 1 point for correct winner/draw (even if score is wrong)
  const signoPrediccion = Math.sign(prediccion.home - prediccion.away)
  const signoResultado = Math.sign(resultado.home - resultado.away)

  if (signoPrediccion === signoResultado) {
    return 1
  }

  // 0 points for wrong prediction
  return 0
}
