-- Resets round_of_32 team assignments. A previous run of "Resolver bracket"
-- happened before the group stage was complete, using calcularPosiciones
-- standings that were effectively all-zero (alphabetical-ish), and assigned
-- teams to 15 of the 16 round_of_32 matches with the old (incorrect)
-- formulas. Predictions table has no rows for round_of_32 yet, so this is
-- safe to clear.

update public.matches
set home_team_id = null, away_team_id = null
where stage = 'round_of_32';
