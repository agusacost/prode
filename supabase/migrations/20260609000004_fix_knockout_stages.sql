-- Replace incorrect knockout structure (round_of_32 doesn't exist in FIFA 2026)
-- Correct format: octavos (round_of_16), cuartos, semifinales, final

DELETE FROM public.matches WHERE stage IN ('round_of_32','round_of_16','quarterfinal','semifinal','third_place','final');

-- Octavos de final — 8 partidos, 16 clasificados (12 primeros + 4 mejores segundos)
INSERT INTO public.matches (home_slot, away_slot, stage, match_date, venue, status)
VALUES
  ('1° Grupo A', '2° Grupo B',    'round_of_16', '2026-07-01 19:00:00+00', 'Estadio Azteca, Ciudad de México',    'scheduled'),
  ('1° Grupo C', '2° Grupo D',    'round_of_16', '2026-07-01 22:00:00+00', 'MetLife Stadium, Nueva York/NJ',      'scheduled'),
  ('1° Grupo B', '2° Grupo A',    'round_of_16', '2026-07-02 19:00:00+00', 'SoFi Stadium, Los Ángeles',           'scheduled'),
  ('1° Grupo D', '2° Grupo C',    'round_of_16', '2026-07-02 22:00:00+00', 'Levi''s Stadium, San Francisco',      'scheduled'),
  ('1° Grupo E', '2° Grupo F',    'round_of_16', '2026-07-03 19:00:00+00', 'AT&T Stadium, Dallas',                'scheduled'),
  ('1° Grupo G', '2° Grupo H',    'round_of_16', '2026-07-03 22:00:00+00', 'NRG Stadium, Houston',                'scheduled'),
  ('1° Grupo F', '2° Grupo E',    'round_of_16', '2026-07-04 19:00:00+00', 'Hard Rock Stadium, Miami',            'scheduled'),
  ('1° Grupo H', '2° Grupo G',    'round_of_16', '2026-07-04 22:00:00+00', 'Lumen Field, Seattle',                'scheduled');

-- Cuartos de final — 4 partidos
INSERT INTO public.matches (home_slot, away_slot, stage, match_date, venue, status)
VALUES
  ('Gan. 8vo 1', 'Gan. 8vo 2', 'quarterfinal', '2026-07-06 19:00:00+00', 'Gillette Stadium, Boston',            'scheduled'),
  ('Gan. 8vo 3', 'Gan. 8vo 4', 'quarterfinal', '2026-07-07 19:00:00+00', 'BC Place, Vancouver',                 'scheduled'),
  ('Gan. 8vo 5', 'Gan. 8vo 6', 'quarterfinal', '2026-07-09 19:00:00+00', 'Mercedes-Benz Stadium, Atlanta',      'scheduled'),
  ('Gan. 8vo 7', 'Gan. 8vo 8', 'quarterfinal', '2026-07-10 19:00:00+00', 'Arrowhead Stadium, Kansas City',      'scheduled');

-- Semifinales
INSERT INTO public.matches (home_slot, away_slot, stage, match_date, venue, status)
VALUES
  ('Gan. 4to 1', 'Gan. 4to 2', 'semifinal', '2026-07-14 19:00:00+00', 'AT&T Stadium, Dallas',           'scheduled'),
  ('Gan. 4to 3', 'Gan. 4to 4', 'semifinal', '2026-07-15 19:00:00+00', 'MetLife Stadium, Nueva York/NJ', 'scheduled');

-- Tercer puesto
INSERT INTO public.matches (home_slot, away_slot, stage, match_date, venue, status)
VALUES
  ('Per. SF 1', 'Per. SF 2', 'third_place', '2026-07-18 19:00:00+00', 'Hard Rock Stadium, Miami', 'scheduled');

-- Final
INSERT INTO public.matches (home_slot, away_slot, stage, match_date, venue, status)
VALUES
  ('Gan. SF 1', 'Gan. SF 2', 'final', '2026-07-19 19:00:00+00', 'MetLife Stadium, Nueva York/NJ', 'scheduled');
