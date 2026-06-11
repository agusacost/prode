-- Cierre fijo de predicciones de fase de grupos: 2026-06-11 15:00 ART (18:00 UTC).
--
-- A partir de esa hora, ningun usuario puede insertar ni editar predicciones
-- para partidos de stage = 'group_stage', sin importar el horario individual
-- de cada partido (algunos arrancan despues de esa hora). Se suma a la regla
-- existente de cierre 1h antes del kickoff (20260610000002_close_predictions_1h.sql).

DROP POLICY IF EXISTS "own insert" ON public.predictions;
DROP POLICY IF EXISTS "own update before kickoff" ON public.predictions;

CREATE POLICY "own insert" ON public.predictions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND exists (
      select 1 from public.prode_members pm
      where pm.prode_id = predictions.prode_id
        and pm.user_id = auth.uid()
    )
    AND exists (
      select 1 from public.matches m
      where m.id = predictions.match_id
        and m.match_date > now() + interval '1 hour'
        and m.status = 'scheduled'
        and (m.stage <> 'group_stage' or now() < '2026-06-11 18:00:00+00'::timestamptz)
    )
  );

CREATE POLICY "own update before kickoff" ON public.predictions FOR UPDATE
  USING (
    user_id = auth.uid()
    AND exists (
      select 1 from public.matches m
      where m.id = predictions.match_id
        and m.match_date > now() + interval '1 hour'
        and m.status = 'scheduled'
        and (m.stage <> 'group_stage' or now() < '2026-06-11 18:00:00+00'::timestamptz)
    )
  );
