# Plan: Verificación de API-Football y corrección de fixtures

## Context

El seed.sql contiene los datos del fixture del Mundial 2026. Los equipos y grupos son correctos, pero los **timestamps de los partidos son incorrectos** — están desfasados entre 1 y 19 horas respecto al calendario oficial. El usuario encontró la API de api-football.com como posible fuente para obtener los datos correctos.

---

## Hallazgos de la investigación

### ¿Qué está mal en el seed actual?

Los **grupos y equipos son correctos** (verificado contra múltiples fuentes). Los **timestamps están todos mal**. Ejemplos (ESPN UTC vs Seed UTC):

| Partido | ESPN (correcto) | Seed (incorrecto) |
|---------|-----------------|-------------------|
| MEX vs RSA | 11 Jun 19:00 UTC | 11 Jun 20:00 UTC |
| KOR vs CZE | 12 Jun 02:00 UTC | 12 Jun 09:00 UTC |
| CAN vs BIH | 12 Jun 19:00 UTC | 12 Jun 00:00 UTC |
| USA vs PAR | 13 Jun 01:00 UTC | 13 Jun 06:00 UTC |
| QAT vs SUI | 13 Jun 19:00 UTC | 13 Jun 01:00 UTC |

Los venues parecen correctos. El desfase es inconsistente (no es un simple error de timezone), sugiriendo que el seed usó un schedule extraoficial desactualizado.

### ¿Es completa la API de api-football.com?

**SÍ**, cubre todo lo necesario:

| Endpoint | Datos |
|----------|-------|
| `GET /fixtures?league=1&season=2026` | 104 partidos con fecha/hora UTC, venue, estado |
| `GET /standings?league=1&season=2026` | 12 grupos con tabla de posiciones |
| `GET /teams?league=1&season=2026` | 48 equipos |

- **League ID**: `1` (FIFA World Cup)
- **Season**: `2026`
- **Base URL**: `https://v3.football.api-sports.io`
- **Auth**: header `x-apisports-key: TU_API_KEY`

**Limitación importante del plan gratuito:**
- 100 requests/día
- Solo 10 ligas disponibles — no está confirmado si el Mundial (league=1) está en el free tier
- Sin datos en vivo (live scores)

Para un fetch puntual de los 104 partidos bastan ~2 requests (fixtures paginados), así que el free tier es suficiente para migrar los datos una sola vez.

### Alternativa gratuita sin API key

El repo **openfootball/worldcup.json** (GitHub público) ya tiene los datos correctos del Mundial 2026 en JSON, sin key ni límites de rate.

---

## Enfoque recomendado

**Opción A (con api-football):** Crear un script Node.js que fetchee los fixtures de la API y genere un archivo SQL de UPDATE para corregir las fechas en Supabase. Requiere API key.

**Opción B (sin api-football — más simple):** Como ya tenemos el schedule oficial completo de ESPN/FIFA en esta sesión para los 72 partidos de grupo, crear directamente un migration SQL con los timestamps corregidos. Para los partidos de Ronda de 32 en adelante, los horarios ya están casi correctos (post-grupo no cambian tanto) o se pueden completar de la misma fuente.

---

## Plan de implementación (Opción A — API-Football)

### 1. Script de fetch (`scripts/fetch-fixtures.mjs`)

```js
// Llama a GET /fixtures?league=1&season=2026
// Mapea fixture.teams.home.name → team code en nuestra BD
// Genera SQL: UPDATE matches SET match_date = $date WHERE home_team_id = ... AND away_team_id = ...
```

### 2. Migration SQL (`supabase/migrations/20260609000002_fix_match_dates.sql`)

UPDATE statements para corregir los 72 partidos de fase de grupos con las fechas correctas de la API.

### 3. Verificación

- Ejecutar `supabase db reset` o aplicar la migración
- Confirmar en la UI de fixture que los horarios son correctos

---

## Archivos críticos

- `supabase/seed.sql` — fuente de datos a corregir (timestamps incorrectos en líneas 91–175)
- `supabase/migrations/` — agregar nueva migración de corrección
- `src/app/(app)/prodes/[prodeId]/fixture/page.tsx` — consume `match_date` directamente

---

## Pregunta pendiente

¿Tenés o querés conseguir un API key de api-football.com (gratis en su web)?  
Si no, puedo generar directamente el SQL con los timestamps correctos usando el schedule oficial que ya tengo de ESPN (sin necesidad de ninguna API).

---

## Verificación

1. Aplicar la migración
2. Ir a la vista `/fixture` y confirmar que el partido MEX vs RSA figura a las 19:00 UTC (3pm ET, 1pm hora local México)
3. Verificar que los últimos partidos del grupo (Jun 24-28) muestran los horarios correctos
