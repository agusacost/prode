-- Close predictions 1 hour before kickoff (previously closed at exact match_date)

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
      select 1 from public.matches
      where id = predictions.match_id
        and match_date > now() + interval '1 hour'
        and status = 'scheduled'
    )
  );

CREATE POLICY "own update before kickoff" ON public.predictions FOR UPDATE
  USING (
    user_id = auth.uid()
    AND exists (
      select 1 from public.matches
      where id = predictions.match_id
        and match_date > now() + interval '1 hour'
        and status = 'scheduled'
    )
  );
