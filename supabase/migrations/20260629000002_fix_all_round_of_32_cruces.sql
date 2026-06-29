-- 20260629000002_fix_all_round_of_32_cruces.sql
-- Fix all 16 round_of_32 matchups accurately.

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY match_date ASC) AS rn
  FROM matches
  WHERE stage = 'round_of_32'
),
team_ids AS (
  SELECT name, id FROM teams
)
UPDATE matches m
SET
  home_team_id = CASE o.rn
    WHEN 1 THEN (SELECT id FROM team_ids WHERE name = 'Alemania')
    WHEN 2 THEN (SELECT id FROM team_ids WHERE name = 'Portugal')
    WHEN 3 THEN (SELECT id FROM team_ids WHERE name = 'Francia')
    WHEN 4 THEN (SELECT id FROM team_ids WHERE name = 'Países Bajos')
    WHEN 5 THEN (SELECT id FROM team_ids WHERE name = 'España')
    WHEN 6 THEN (SELECT id FROM team_ids WHERE name = 'Estados Unidos')
    WHEN 7 THEN (SELECT id FROM team_ids WHERE name = 'Egipto')
    WHEN 9 THEN (SELECT id FROM team_ids WHERE name = 'Suiza')
    WHEN 10 THEN (SELECT id FROM team_ids WHERE name = 'Brasil')
    WHEN 11 THEN (SELECT id FROM team_ids WHERE name = 'Costa de Marfil')
    WHEN 12 THEN (SELECT id FROM team_ids WHERE name = 'México')
    WHEN 13 THEN (SELECT id FROM team_ids WHERE name = 'Inglaterra')
    WHEN 14 THEN (SELECT id FROM team_ids WHERE name = 'Argentina')
    WHEN 15 THEN (SELECT id FROM team_ids WHERE name = 'Colombia')
    WHEN 16 THEN (SELECT id FROM team_ids WHERE name = 'Bélgica')
    WHEN 8 THEN (SELECT id FROM team_ids WHERE name = 'Canadá')
  END,
  away_team_id = CASE o.rn
    WHEN 1 THEN (SELECT id FROM team_ids WHERE name = 'Paraguay')
    WHEN 2 THEN (SELECT id FROM team_ids WHERE name = 'Croacia')
    WHEN 3 THEN (SELECT id FROM team_ids WHERE name = 'Suecia')
    WHEN 4 THEN (SELECT id FROM team_ids WHERE name = 'Marruecos')
    WHEN 5 THEN (SELECT id FROM team_ids WHERE name = 'Austria')
    WHEN 6 THEN (SELECT id FROM team_ids WHERE name = 'Bosnia-Herzegovina')
    WHEN 7 THEN (SELECT id FROM team_ids WHERE name = 'Australia')
    WHEN 9 THEN (SELECT id FROM team_ids WHERE name = 'Argelia')
    WHEN 10 THEN (SELECT id FROM team_ids WHERE name = 'Japón')
    WHEN 11 THEN (SELECT id FROM team_ids WHERE name = 'Noruega')
    WHEN 12 THEN (SELECT id FROM team_ids WHERE name = 'Ecuador')
    WHEN 13 THEN (SELECT id FROM team_ids WHERE name = 'RD Congo')
    WHEN 14 THEN (SELECT id FROM team_ids WHERE name = 'Cabo Verde')
    WHEN 15 THEN (SELECT id FROM team_ids WHERE name = 'Ghana')
    WHEN 16 THEN (SELECT id FROM team_ids WHERE name = 'Senegal')
    WHEN 8 THEN (SELECT id FROM team_ids WHERE name = 'Sudáfrica')
  END
FROM ordered o
WHERE m.id = o.id;

-- 2. Mark Canada vs South Africa as finished and insert result
UPDATE matches m
SET status = 'finished'
FROM teams home, teams away
WHERE m.stage = 'round_of_32'
  AND m.home_team_id = home.id AND home.name = 'Canadá'
  AND m.away_team_id = away.id AND away.name = 'Sudáfrica';

INSERT INTO match_results (match_id, home_goals, away_goals)
SELECT m.id, 1, 0
FROM matches m
JOIN teams home ON m.home_team_id = home.id
JOIN teams away ON m.away_team_id = away.id
WHERE m.stage = 'round_of_32'
  AND home.name = 'Canadá'
  AND away.name = 'Sudáfrica'
ON CONFLICT (match_id) DO UPDATE SET home_goals = 1, away_goals = 0;
