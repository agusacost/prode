-- Seed data — FIFA World Cup 2026 (fixture oficial)

-- 12 Grupos
insert into public.tournament_groups (id, name, code, stage) values
  (gen_random_uuid(), 'Grupo A', 'A', 'group_stage'),
  (gen_random_uuid(), 'Grupo B', 'B', 'group_stage'),
  (gen_random_uuid(), 'Grupo C', 'C', 'group_stage'),
  (gen_random_uuid(), 'Grupo D', 'D', 'group_stage'),
  (gen_random_uuid(), 'Grupo E', 'E', 'group_stage'),
  (gen_random_uuid(), 'Grupo F', 'F', 'group_stage'),
  (gen_random_uuid(), 'Grupo G', 'G', 'group_stage'),
  (gen_random_uuid(), 'Grupo H', 'H', 'group_stage'),
  (gen_random_uuid(), 'Grupo I', 'I', 'group_stage'),
  (gen_random_uuid(), 'Grupo J', 'J', 'group_stage'),
  (gen_random_uuid(), 'Grupo K', 'K', 'group_stage'),
  (gen_random_uuid(), 'Grupo L', 'L', 'group_stage');

-- 48 Equipos
with group_ids as (
  select id, code from public.tournament_groups
)
insert into public.teams (id, name, code, flag_url, group_id)
select
  gen_random_uuid(),
  t.name,
  t.code,
  'https://flagcdn.com/w320/' || lower(t.flag_code) || '.png',
  (select id from group_ids where code = t.group_code)
from (values
  ('México',               'MEX', 'mx',     'A'),
  ('Sudáfrica',            'RSA', 'za',     'A'),
  ('Corea del Sur',        'KOR', 'kr',     'A'),
  ('Rep. Checa',           'CZE', 'cz',     'A'),
  ('Canadá',               'CAN', 'ca',     'B'),
  ('Bosnia-Herzegovina',   'BIH', 'ba',     'B'),
  ('Qatar',                'QAT', 'qa',     'B'),
  ('Suiza',                'SUI', 'ch',     'B'),
  ('Brasil',               'BRA', 'br',     'C'),
  ('Marruecos',            'MAR', 'ma',     'C'),
  ('Haití',                'HAI', 'ht',     'C'),
  ('Escocia',              'SCO', 'gb-sct', 'C'),
  ('Estados Unidos',       'USA', 'us',     'D'),
  ('Paraguay',             'PAR', 'py',     'D'),
  ('Australia',            'AUS', 'au',     'D'),
  ('Turquía',              'TUR', 'tr',     'D'),
  ('Alemania',             'GER', 'de',     'E'),
  ('Curazao',              'CUW', 'cw',     'E'),
  ('Costa de Marfil',      'CIV', 'ci',     'E'),
  ('Ecuador',              'ECU', 'ec',     'E'),
  ('Países Bajos',         'NED', 'nl',     'F'),
  ('Japón',                'JPN', 'jp',     'F'),
  ('Suecia',               'SWE', 'se',     'F'),
  ('Túnez',                'TUN', 'tn',     'F'),
  ('Bélgica',              'BEL', 'be',     'G'),
  ('Egipto',               'EGY', 'eg',     'G'),
  ('Irán',                 'IRN', 'ir',     'G'),
  ('Nueva Zelanda',        'NZL', 'nz',     'G'),
  ('España',               'ESP', 'es',     'H'),
  ('Cabo Verde',           'CPV', 'cv',     'H'),
  ('Arabia Saudita',       'KSA', 'sa',     'H'),
  ('Uruguay',              'URU', 'uy',     'H'),
  ('Francia',              'FRA', 'fr',     'I'),
  ('Senegal',              'SEN', 'sn',     'I'),
  ('Irak',                 'IRQ', 'iq',     'I'),
  ('Noruega',              'NOR', 'no',     'I'),
  ('Argentina',            'ARG', 'ar',     'J'),
  ('Argelia',              'ALG', 'dz',     'J'),
  ('Austria',              'AUT', 'at',     'J'),
  ('Jordania',             'JOR', 'jo',     'J'),
  ('Portugal',             'POR', 'pt',     'K'),
  ('RD Congo',             'COD', 'cd',     'K'),
  ('Uzbekistán',           'UZB', 'uz',     'K'),
  ('Colombia',             'COL', 'co',     'K'),
  ('Inglaterra',           'ENG', 'gb-eng', 'L'),
  ('Croacia',              'CRO', 'hr',     'L'),
  ('Ghana',                'GHA', 'gh',     'L'),
  ('Panamá',               'PAN', 'pa',     'L')
) as t(name, code, flag_code, group_code);

-- 72 partidos de fase de grupos
insert into public.matches (home_team_id, away_team_id, stage, match_date, venue, status, group_id)
select
  (select id from public.teams where code = m.home_code),
  (select id from public.teams where code = m.away_code),
  'group_stage',
  m.match_date::timestamptz,
  m.venue,
  'scheduled',
  (select id from public.tournament_groups where code = m.group_code)
from (values
  -- Grupo A
  ('MEX','RSA','2026-06-11 19:00:00+00','Estadio Azteca, Ciudad de México',          'A'),
  ('KOR','CZE','2026-06-12 02:00:00+00','Estadio Akron, Guadalajara',                'A'),
  ('CZE','RSA','2026-06-18 16:00:00+00','Mercedes-Benz Stadium, Atlanta',            'A'),
  ('MEX','KOR','2026-06-19 01:00:00+00','Estadio Akron, Guadalajara',                'A'),
  ('RSA','KOR','2026-06-25 01:00:00+00','Estadio BBVA, Guadalupe',                   'A'),
  ('CZE','MEX','2026-06-25 01:00:00+00','Estadio Azteca, Ciudad de México',          'A'),
  -- Grupo B
  ('CAN','BIH','2026-06-12 19:00:00+00','BMO Field, Toronto',                        'B'),
  ('QAT','SUI','2026-06-13 19:00:00+00','Levi''s Stadium, San Francisco',            'B'),
  ('SUI','BIH','2026-06-18 19:00:00+00','SoFi Stadium, Los Ángeles',                 'B'),
  ('CAN','QAT','2026-06-18 22:00:00+00','BC Place, Vancouver',                       'B'),
  ('SUI','CAN','2026-06-24 19:00:00+00','BC Place, Vancouver',                       'B'),
  ('BIH','QAT','2026-06-24 19:00:00+00','Lumen Field, Seattle',                      'B'),
  -- Grupo C
  ('BRA','MAR','2026-06-13 22:00:00+00','MetLife Stadium, Nueva York/NJ',            'C'),
  ('HAI','SCO','2026-06-14 01:00:00+00','Gillette Stadium, Boston',                  'C'),
  ('SCO','MAR','2026-06-19 22:00:00+00','Gillette Stadium, Boston',                  'C'),
  ('BRA','HAI','2026-06-20 00:30:00+00','Lincoln Financial Field, Filadelfia',       'C'),
  ('MAR','HAI','2026-06-24 22:00:00+00','Mercedes-Benz Stadium, Atlanta',            'C'),
  ('SCO','BRA','2026-06-24 22:00:00+00','Hard Rock Stadium, Miami',                  'C'),
  -- Grupo D
  ('USA','PAR','2026-06-13 01:00:00+00','SoFi Stadium, Los Ángeles',                 'D'),
  ('AUS','TUR','2026-06-14 04:00:00+00','BC Place, Vancouver',                       'D'),
  ('USA','AUS','2026-06-19 19:00:00+00','Lumen Field, Seattle',                      'D'),
  ('TUR','PAR','2026-06-20 03:00:00+00','Levi''s Stadium, San Francisco',            'D'),
  ('TUR','USA','2026-06-26 02:00:00+00','SoFi Stadium, Los Ángeles',                 'D'),
  ('PAR','AUS','2026-06-26 02:00:00+00','Levi''s Stadium, San Francisco',            'D'),
  -- Grupo E
  ('GER','CUW','2026-06-14 17:00:00+00','NRG Stadium, Houston',                      'E'),
  ('CIV','ECU','2026-06-14 23:00:00+00','Lincoln Financial Field, Filadelfia',       'E'),
  ('GER','CIV','2026-06-20 20:00:00+00','BMO Field, Toronto',                        'E'),
  ('ECU','CUW','2026-06-21 00:00:00+00','Arrowhead Stadium, Kansas City',            'E'),
  ('CUW','CIV','2026-06-25 20:00:00+00','Lincoln Financial Field, Filadelfia',       'E'),
  ('ECU','GER','2026-06-25 20:00:00+00','MetLife Stadium, Nueva York/NJ',            'E'),
  -- Grupo F
  ('NED','JPN','2026-06-14 20:00:00+00','AT&T Stadium, Dallas',                      'F'),
  ('SWE','TUN','2026-06-15 02:00:00+00','Estadio BBVA, Guadalupe',                   'F'),
  ('NED','SWE','2026-06-20 17:00:00+00','NRG Stadium, Houston',                      'F'),
  ('TUN','JPN','2026-06-21 04:00:00+00','Estadio BBVA, Guadalupe',                   'F'),
  ('TUN','NED','2026-06-25 23:00:00+00','Arrowhead Stadium, Kansas City',            'F'),
  ('JPN','SWE','2026-06-25 23:00:00+00','AT&T Stadium, Dallas',                      'F'),
  -- Grupo G
  ('BEL','EGY','2026-06-15 19:00:00+00','Lumen Field, Seattle',                      'G'),
  ('IRN','NZL','2026-06-16 01:00:00+00','SoFi Stadium, Los Ángeles',                 'G'),
  ('BEL','IRN','2026-06-21 19:00:00+00','SoFi Stadium, Los Ángeles',                 'G'),
  ('NZL','EGY','2026-06-22 01:00:00+00','BC Place, Vancouver',                       'G'),
  ('NZL','BEL','2026-06-27 03:00:00+00','BC Place, Vancouver',                       'G'),
  ('EGY','IRN','2026-06-27 03:00:00+00','Lumen Field, Seattle',                      'G'),
  -- Grupo H
  ('KSA','URU','2026-06-15 22:00:00+00','Hard Rock Stadium, Miami',                  'H'),
  ('ESP','CPV','2026-06-15 16:00:00+00','Mercedes-Benz Stadium, Atlanta',            'H'),
  ('URU','CPV','2026-06-21 22:00:00+00','Hard Rock Stadium, Miami',                  'H'),
  ('ESP','KSA','2026-06-21 16:00:00+00','Mercedes-Benz Stadium, Atlanta',            'H'),
  ('CPV','KSA','2026-06-27 00:00:00+00','NRG Stadium, Houston',                      'H'),
  ('URU','ESP','2026-06-27 00:00:00+00','Estadio Akron, Guadalajara',                'H'),
  -- Grupo I
  ('FRA','SEN','2026-06-16 19:00:00+00','MetLife Stadium, Nueva York/NJ',            'I'),
  ('IRQ','NOR','2026-06-16 22:00:00+00','Gillette Stadium, Boston',                  'I'),
  ('FRA','IRQ','2026-06-22 21:00:00+00','Lincoln Financial Field, Filadelfia',       'I'),
  ('NOR','SEN','2026-06-23 00:00:00+00','BMO Field, Toronto',                        'I'),
  ('NOR','FRA','2026-06-26 19:00:00+00','Gillette Stadium, Boston',                  'I'),
  ('SEN','IRQ','2026-06-26 19:00:00+00','BMO Field, Toronto',                        'I'),
  -- Grupo J
  ('ARG','ALG','2026-06-17 01:00:00+00','Arrowhead Stadium, Kansas City',            'J'),
  ('AUT','JOR','2026-06-17 04:00:00+00','Levi''s Stadium, San Francisco',            'J'),
  ('ARG','AUT','2026-06-22 17:00:00+00','AT&T Stadium, Dallas',                      'J'),
  ('JOR','ALG','2026-06-23 03:00:00+00','Levi''s Stadium, San Francisco',            'J'),
  ('ALG','AUT','2026-06-28 02:00:00+00','Arrowhead Stadium, Kansas City',            'J'),
  ('JOR','ARG','2026-06-28 02:00:00+00','AT&T Stadium, Dallas',                      'J'),
  -- Grupo K
  ('POR','COD','2026-06-17 17:00:00+00','NRG Stadium, Houston',                      'K'),
  ('UZB','COL','2026-06-18 02:00:00+00','Estadio Azteca, Ciudad de México',          'K'),
  ('POR','UZB','2026-06-23 17:00:00+00','NRG Stadium, Houston',                      'K'),
  ('COL','COD','2026-06-24 02:00:00+00','Estadio Akron, Guadalajara',                'K'),
  ('COL','POR','2026-06-27 23:30:00+00','Hard Rock Stadium, Miami',                  'K'),
  ('COD','UZB','2026-06-27 23:30:00+00','Mercedes-Benz Stadium, Atlanta',            'K'),
  -- Grupo L
  ('ENG','CRO','2026-06-17 20:00:00+00','AT&T Stadium, Dallas',                      'L'),
  ('GHA','PAN','2026-06-17 23:00:00+00','BMO Field, Toronto',                        'L'),
  ('ENG','GHA','2026-06-23 20:00:00+00','Gillette Stadium, Boston',                  'L'),
  ('PAN','CRO','2026-06-23 23:00:00+00','Gillette Stadium, Boston',                  'L'),
  ('PAN','ENG','2026-06-27 21:00:00+00','MetLife Stadium, Nueva York/NJ',            'L'),
  ('CRO','GHA','2026-06-27 21:00:00+00','Lincoln Financial Field, Filadelfia',       'L')
) as m(home_code, away_code, match_date, venue, group_code);

-- Dieciseisavos de final (P81–P96) — 24 clasificados + 8 mejores 3ros
insert into public.matches (home_team_id, away_team_id, home_slot, away_slot, stage, match_date, venue, status)
values
  (null, null, '2° Grupo A',  '2° Grupo B',    'round_of_32', '2026-06-30 16:00:00+00', 'Estadio Azteca, Ciudad de México',    'scheduled'),
  (null, null, '1° Grupo E',  '3° A/B/C/D/F',  'round_of_32', '2026-06-30 19:00:00+00', 'AT&T Stadium, Dallas',                'scheduled'),
  (null, null, '1° Grupo F',  '2° Grupo C',    'round_of_32', '2026-06-30 22:00:00+00', 'MetLife Stadium, Nueva York/NJ',      'scheduled'),
  (null, null, '1° Grupo C',  '2° Grupo F',    'round_of_32', '2026-07-01 01:00:00+00', 'Gillette Stadium, Boston',            'scheduled'),
  (null, null, '1° Grupo I',  '3° C/D/F/G/H',  'round_of_32', '2026-07-01 16:00:00+00', 'SoFi Stadium, Los Ángeles',           'scheduled'),
  (null, null, '2° Grupo E',  '2° Grupo I',    'round_of_32', '2026-07-01 19:00:00+00', 'NRG Stadium, Houston',                'scheduled'),
  (null, null, '1° Grupo A',  '3° C/E/F/H/I',  'round_of_32', '2026-07-01 22:00:00+00', 'Hard Rock Stadium, Miami',            'scheduled'),
  (null, null, '1° Grupo L',  '3° E/H/I/J/K',  'round_of_32', '2026-07-02 01:00:00+00', 'Levi''s Stadium, San Francisco',      'scheduled'),
  (null, null, '1° Grupo D',  '3° B/E/F/I/J',  'round_of_32', '2026-07-02 16:00:00+00', 'Lumen Field, Seattle',                'scheduled'),
  (null, null, '1° Grupo G',  '3° A/E/H/I/J',  'round_of_32', '2026-07-02 19:00:00+00', 'BC Place, Vancouver',                 'scheduled'),
  (null, null, '2° Grupo K',  '2° Grupo L',    'round_of_32', '2026-07-02 22:00:00+00', 'Mercedes-Benz Stadium, Atlanta',      'scheduled'),
  (null, null, '1° Grupo H',  '2° Grupo J',    'round_of_32', '2026-07-03 01:00:00+00', 'Arrowhead Stadium, Kansas City',      'scheduled'),
  (null, null, '1° Grupo B',  '3° E/F/G/I/J',  'round_of_32', '2026-07-03 16:00:00+00', 'Lincoln Financial Field, Filadelfia', 'scheduled'),
  (null, null, '1° Grupo J',  '2° Grupo H',    'round_of_32', '2026-07-03 19:00:00+00', 'Estadio BBVA, Guadalupe',             'scheduled'),
  (null, null, '1° Grupo K',  '3° D/E/I/J/L',  'round_of_32', '2026-07-03 22:00:00+00', 'BMO Field, Toronto',                  'scheduled'),
  (null, null, '2° Grupo D',  '2° Grupo G',    'round_of_32', '2026-07-04 01:00:00+00', 'Estadio Akron, Guadalajara',          'scheduled');

-- Octavos de final (P97–P108)
insert into public.matches (home_team_id, away_team_id, home_slot, away_slot, stage, match_date, venue, status)
values
  (null, null, 'Gan. R32-1',  'Gan. R32-2',  'round_of_16', '2026-07-05 17:00:00+00', 'Estadio Azteca, Ciudad de México',    'scheduled'),
  (null, null, 'Gan. R32-3',  'Gan. R32-4',  'round_of_16', '2026-07-05 21:00:00+00', 'MetLife Stadium, Nueva York/NJ',      'scheduled'),
  (null, null, 'Gan. R32-5',  'Gan. R32-6',  'round_of_16', '2026-07-06 17:00:00+00', 'SoFi Stadium, Los Ángeles',           'scheduled'),
  (null, null, 'Gan. R32-7',  'Gan. R32-8',  'round_of_16', '2026-07-06 21:00:00+00', 'NRG Stadium, Houston',                'scheduled'),
  (null, null, 'Gan. R32-9',  'Gan. R32-10', 'round_of_16', '2026-07-07 17:00:00+00', 'Lumen Field, Seattle',                'scheduled'),
  (null, null, 'Gan. R32-11', 'Gan. R32-12', 'round_of_16', '2026-07-07 21:00:00+00', 'Mercedes-Benz Stadium, Atlanta',      'scheduled'),
  (null, null, 'Gan. R32-13', 'Gan. R32-14', 'round_of_16', '2026-07-08 17:00:00+00', 'AT&T Stadium, Dallas',                'scheduled'),
  (null, null, 'Gan. R32-15', 'Gan. R32-16', 'round_of_16', '2026-07-08 21:00:00+00', 'Hard Rock Stadium, Miami',            'scheduled');

-- Cuartos de final
insert into public.matches (home_team_id, away_team_id, home_slot, away_slot, stage, match_date, venue, status)
values
  (null, null, 'Gan. R16-1', 'Gan. R16-2', 'quarterfinal', '2026-07-10 19:00:00+00', 'MetLife Stadium, Nueva York/NJ',   'scheduled'),
  (null, null, 'Gan. R16-3', 'Gan. R16-4', 'quarterfinal', '2026-07-11 19:00:00+00', 'SoFi Stadium, Los Ángeles',        'scheduled'),
  (null, null, 'Gan. R16-5', 'Gan. R16-6', 'quarterfinal', '2026-07-12 19:00:00+00', 'Estadio Azteca, Ciudad de México', 'scheduled'),
  (null, null, 'Gan. R16-7', 'Gan. R16-8', 'quarterfinal', '2026-07-13 19:00:00+00', 'AT&T Stadium, Dallas',             'scheduled');

-- Semifinales
insert into public.matches (home_team_id, away_team_id, home_slot, away_slot, stage, match_date, venue, status)
values
  (null, null, 'Gan. QF-1', 'Gan. QF-2', 'semifinal', '2026-07-15 19:00:00+00', 'MetLife Stadium, Nueva York/NJ',   'scheduled'),
  (null, null, 'Gan. QF-3', 'Gan. QF-4', 'semifinal', '2026-07-16 19:00:00+00', 'Estadio Azteca, Ciudad de México', 'scheduled');

-- Tercer puesto
insert into public.matches (home_team_id, away_team_id, home_slot, away_slot, stage, match_date, venue, status)
values
  (null, null, 'Per. SF-1', 'Per. SF-2', 'third_place', '2026-07-18 19:00:00+00', 'Hard Rock Stadium, Miami', 'scheduled');

-- Final
insert into public.matches (home_team_id, away_team_id, home_slot, away_slot, stage, match_date, venue, status)
values
  (null, null, 'Gan. SF-1', 'Gan. SF-2', 'final', '2026-07-19 19:00:00+00', 'MetLife Stadium, Nueva York/NJ', 'scheduled');
