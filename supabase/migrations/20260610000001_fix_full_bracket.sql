-- Replace partial knockout bracket with full FIFA 2026 structure
-- 16 (dieciseisavos) + 8 (octavos) + 4 (cuartos) + 2 (semis) + 1 (3ro) + 1 (final) = 32

DELETE FROM public.predictions WHERE match_id IN (
  SELECT id FROM public.matches WHERE stage NOT IN ('group_stage')
);
DELETE FROM public.match_results WHERE match_id IN (
  SELECT id FROM public.matches WHERE stage NOT IN ('group_stage')
);
DELETE FROM public.matches WHERE stage NOT IN ('group_stage');

-- Dieciseisavos de final (P81–P96) — ordinal por match_date ASC
-- 24 clasificados (1°/2° de cada grupo) + 8 mejores 3ros
INSERT INTO public.matches (home_slot, away_slot, stage, match_date, venue, status) VALUES
  ('1° Grupo A',  '3° C/E/F/H',  'round_of_32', '2026-06-30 16:00:00+00', 'Estadio Azteca, Ciudad de México',    'scheduled'),  -- R32-1
  ('1° Grupo B',  '2° Grupo F',  'round_of_32', '2026-06-30 19:00:00+00', 'AT&T Stadium, Dallas',                'scheduled'),  -- R32-2
  ('1° Grupo E',  '2° Grupo A',  'round_of_32', '2026-06-30 22:00:00+00', 'MetLife Stadium, Nueva York/NJ',      'scheduled'),  -- R32-3
  ('1° Grupo I',  '3° C/D/F/G',  'round_of_32', '2026-07-01 01:00:00+00', 'Gillette Stadium, Boston',            'scheduled'),  -- R32-4
  ('1° Grupo F',  '2° Grupo C',  'round_of_32', '2026-07-01 16:00:00+00', 'SoFi Stadium, Los Ángeles',           'scheduled'),  -- R32-5
  ('2° Grupo E',  '2° Grupo I',  'round_of_32', '2026-07-01 19:00:00+00', 'NRG Stadium, Houston',                'scheduled'),  -- R32-6
  ('1° Grupo C',  '3° A/B/F/I',  'round_of_32', '2026-07-01 22:00:00+00', 'Hard Rock Stadium, Miami',            'scheduled'),  -- R32-7
  ('1° Grupo D',  '3° B/E/F/I',  'round_of_32', '2026-07-02 01:00:00+00', 'Levi''s Stadium, San Francisco',      'scheduled'),  -- R32-8
  ('1° Grupo G',  '3° A/B/C/E',  'round_of_32', '2026-07-02 16:00:00+00', 'Lumen Field, Seattle',                'scheduled'),  -- R32-9
  ('2° Grupo D',  '2° Grupo G',  'round_of_32', '2026-07-02 19:00:00+00', 'BC Place, Vancouver',                 'scheduled'),  -- R32-10
  ('1° Grupo H',  '2° Grupo J',  'round_of_32', '2026-07-02 22:00:00+00', 'Mercedes-Benz Stadium, Atlanta',      'scheduled'),  -- R32-11
  ('1° Grupo J',  '3° B/C/D/E',  'round_of_32', '2026-07-03 01:00:00+00', 'Arrowhead Stadium, Kansas City',      'scheduled'),  -- R32-12
  ('1° Grupo K',  '3° B/C/G/H',  'round_of_32', '2026-07-03 16:00:00+00', 'Lincoln Financial Field, Filadelfia', 'scheduled'),  -- R32-13
  ('2° Grupo B',  '2° Grupo K',  'round_of_32', '2026-07-03 19:00:00+00', 'Estadio BBVA, Guadalupe',             'scheduled'),  -- R32-14
  ('1° Grupo L',  '3° E/H/I/J',  'round_of_32', '2026-07-03 22:00:00+00', 'BMO Field, Toronto',                  'scheduled'),  -- R32-15
  ('2° Grupo H',  '2° Grupo L',  'round_of_32', '2026-07-04 01:00:00+00', 'Estadio Akron, Guadalajara',          'scheduled');  -- R32-16

-- Octavos de final (P97–P108) — 8 matches, ordinal por match_date ASC
INSERT INTO public.matches (home_slot, away_slot, stage, match_date, venue, status) VALUES
  ('Gan. R32-1',  'Gan. R32-2',  'round_of_16', '2026-07-05 17:00:00+00', 'Estadio Azteca, Ciudad de México',    'scheduled'),  -- R16-1
  ('Gan. R32-3',  'Gan. R32-4',  'round_of_16', '2026-07-05 21:00:00+00', 'MetLife Stadium, Nueva York/NJ',      'scheduled'),  -- R16-2
  ('Gan. R32-5',  'Gan. R32-6',  'round_of_16', '2026-07-06 17:00:00+00', 'SoFi Stadium, Los Ángeles',           'scheduled'),  -- R16-3
  ('Gan. R32-7',  'Gan. R32-8',  'round_of_16', '2026-07-06 21:00:00+00', 'NRG Stadium, Houston',                'scheduled'),  -- R16-4
  ('Gan. R32-9',  'Gan. R32-10', 'round_of_16', '2026-07-07 17:00:00+00', 'Lumen Field, Seattle',                'scheduled'),  -- R16-5
  ('Gan. R32-11', 'Gan. R32-12', 'round_of_16', '2026-07-07 21:00:00+00', 'Mercedes-Benz Stadium, Atlanta',      'scheduled'),  -- R16-6
  ('Gan. R32-13', 'Gan. R32-14', 'round_of_16', '2026-07-08 17:00:00+00', 'AT&T Stadium, Dallas',                'scheduled'),  -- R16-7
  ('Gan. R32-15', 'Gan. R32-16', 'round_of_16', '2026-07-08 21:00:00+00', 'Hard Rock Stadium, Miami',            'scheduled');  -- R16-8

-- Cuartos de final — 4 matches, ordinal por match_date ASC
INSERT INTO public.matches (home_slot, away_slot, stage, match_date, venue, status) VALUES
  ('Gan. R16-1', 'Gan. R16-2', 'quarterfinal', '2026-07-10 19:00:00+00', 'MetLife Stadium, Nueva York/NJ',   'scheduled'),  -- QF-1
  ('Gan. R16-3', 'Gan. R16-4', 'quarterfinal', '2026-07-11 19:00:00+00', 'SoFi Stadium, Los Ángeles',        'scheduled'),  -- QF-2
  ('Gan. R16-5', 'Gan. R16-6', 'quarterfinal', '2026-07-12 19:00:00+00', 'Estadio Azteca, Ciudad de México', 'scheduled'),  -- QF-3
  ('Gan. R16-7', 'Gan. R16-8', 'quarterfinal', '2026-07-13 19:00:00+00', 'AT&T Stadium, Dallas',             'scheduled');  -- QF-4

-- Semifinales
INSERT INTO public.matches (home_slot, away_slot, stage, match_date, venue, status) VALUES
  ('Gan. QF-1', 'Gan. QF-2', 'semifinal', '2026-07-15 19:00:00+00', 'MetLife Stadium, Nueva York/NJ',   'scheduled'),  -- SF-1
  ('Gan. QF-3', 'Gan. QF-4', 'semifinal', '2026-07-16 19:00:00+00', 'Estadio Azteca, Ciudad de México', 'scheduled');  -- SF-2

-- Tercer puesto
INSERT INTO public.matches (home_slot, away_slot, stage, match_date, venue, status) VALUES
  ('Per. SF-1', 'Per. SF-2', 'third_place', '2026-07-18 19:00:00+00', 'Hard Rock Stadium, Miami', 'scheduled');

-- Final
INSERT INTO public.matches (home_slot, away_slot, stage, match_date, venue, status) VALUES
  ('Gan. SF-1', 'Gan. SF-2', 'final', '2026-07-19 19:00:00+00', 'MetLife Stadium, Nueva York/NJ', 'scheduled');
