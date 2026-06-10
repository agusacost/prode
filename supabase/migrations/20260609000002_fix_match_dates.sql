-- Fix group stage match timestamps (source: openfootball/worldcup.json)
-- All times converted to UTC. Seed had inconsistent offsets (1–19h off).

-- Grupo A
UPDATE public.matches SET match_date = '2026-06-11 19:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'MEX')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'RSA');
UPDATE public.matches SET match_date = '2026-06-12 02:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'KOR')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'CZE');
UPDATE public.matches SET match_date = '2026-06-18 16:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'CZE')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'RSA');
UPDATE public.matches SET match_date = '2026-06-19 01:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'MEX')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'KOR');
UPDATE public.matches SET match_date = '2026-06-25 01:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'RSA')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'KOR');
UPDATE public.matches SET match_date = '2026-06-25 01:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'CZE')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'MEX');

-- Grupo B
UPDATE public.matches SET match_date = '2026-06-12 19:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'CAN')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'BIH');
UPDATE public.matches SET match_date = '2026-06-13 19:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'QAT')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'SUI');
UPDATE public.matches SET match_date = '2026-06-18 19:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'SUI')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'BIH');
UPDATE public.matches SET match_date = '2026-06-18 22:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'CAN')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'QAT');
UPDATE public.matches SET match_date = '2026-06-24 19:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'SUI')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'CAN');
UPDATE public.matches SET match_date = '2026-06-24 19:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'BIH')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'QAT');

-- Grupo C
UPDATE public.matches SET match_date = '2026-06-13 22:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'BRA')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'MAR');
UPDATE public.matches SET match_date = '2026-06-14 01:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'HAI')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'SCO');
UPDATE public.matches SET match_date = '2026-06-19 22:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'SCO')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'MAR');
UPDATE public.matches SET match_date = '2026-06-20 00:30:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'BRA')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'HAI');
UPDATE public.matches SET match_date = '2026-06-24 22:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'MAR')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'HAI');
UPDATE public.matches SET match_date = '2026-06-24 22:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'SCO')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'BRA');

-- Grupo D
UPDATE public.matches SET match_date = '2026-06-13 01:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'USA')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'PAR');
UPDATE public.matches SET match_date = '2026-06-14 04:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'AUS')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'TUR');
UPDATE public.matches SET match_date = '2026-06-19 19:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'USA')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'AUS');
UPDATE public.matches SET match_date = '2026-06-20 03:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'TUR')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'PAR');
UPDATE public.matches SET match_date = '2026-06-26 02:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'TUR')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'USA');
UPDATE public.matches SET match_date = '2026-06-26 02:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'PAR')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'AUS');

-- Grupo E
UPDATE public.matches SET match_date = '2026-06-14 17:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'GER')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'CUW');
UPDATE public.matches SET match_date = '2026-06-14 23:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'CIV')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'ECU');
UPDATE public.matches SET match_date = '2026-06-20 20:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'GER')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'CIV');
UPDATE public.matches SET match_date = '2026-06-21 00:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'ECU')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'CUW');
UPDATE public.matches SET match_date = '2026-06-25 20:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'CUW')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'CIV');
UPDATE public.matches SET match_date = '2026-06-25 20:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'ECU')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'GER');

-- Grupo F
UPDATE public.matches SET match_date = '2026-06-14 20:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'NED')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'JPN');
UPDATE public.matches SET match_date = '2026-06-15 02:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'SWE')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'TUN');
UPDATE public.matches SET match_date = '2026-06-20 17:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'NED')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'SWE');
UPDATE public.matches SET match_date = '2026-06-21 04:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'TUN')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'JPN');
UPDATE public.matches SET match_date = '2026-06-25 23:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'JPN')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'SWE');
UPDATE public.matches SET match_date = '2026-06-25 23:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'TUN')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'NED');

-- Grupo G
UPDATE public.matches SET match_date = '2026-06-15 19:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'BEL')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'EGY');
UPDATE public.matches SET match_date = '2026-06-16 01:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'IRN')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'NZL');
UPDATE public.matches SET match_date = '2026-06-21 19:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'BEL')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'IRN');
UPDATE public.matches SET match_date = '2026-06-22 01:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'NZL')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'EGY');
UPDATE public.matches SET match_date = '2026-06-27 03:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'NZL')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'BEL');
UPDATE public.matches SET match_date = '2026-06-27 03:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'EGY')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'IRN');

-- Grupo H
UPDATE public.matches SET match_date = '2026-06-15 16:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'ESP')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'CPV');
UPDATE public.matches SET match_date = '2026-06-15 22:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'KSA')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'URU');
UPDATE public.matches SET match_date = '2026-06-21 16:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'ESP')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'KSA');
UPDATE public.matches SET match_date = '2026-06-21 22:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'URU')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'CPV');
UPDATE public.matches SET match_date = '2026-06-27 00:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'CPV')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'KSA');
UPDATE public.matches SET match_date = '2026-06-27 00:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'URU')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'ESP');

-- Grupo I
UPDATE public.matches SET match_date = '2026-06-16 19:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'FRA')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'SEN');
UPDATE public.matches SET match_date = '2026-06-16 22:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'IRQ')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'NOR');
UPDATE public.matches SET match_date = '2026-06-22 21:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'FRA')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'IRQ');
UPDATE public.matches SET match_date = '2026-06-23 00:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'NOR')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'SEN');
UPDATE public.matches SET match_date = '2026-06-26 19:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'NOR')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'FRA');
UPDATE public.matches SET match_date = '2026-06-26 19:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'SEN')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'IRQ');

-- Grupo J
UPDATE public.matches SET match_date = '2026-06-17 01:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'ARG')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'ALG');
UPDATE public.matches SET match_date = '2026-06-17 04:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'AUT')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'JOR');
UPDATE public.matches SET match_date = '2026-06-22 17:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'ARG')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'AUT');
UPDATE public.matches SET match_date = '2026-06-23 03:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'JOR')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'ALG');
UPDATE public.matches SET match_date = '2026-06-28 02:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'ALG')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'AUT');
UPDATE public.matches SET match_date = '2026-06-28 02:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'JOR')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'ARG');

-- Grupo K
UPDATE public.matches SET match_date = '2026-06-17 17:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'POR')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'COD');
UPDATE public.matches SET match_date = '2026-06-18 02:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'UZB')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'COL');
UPDATE public.matches SET match_date = '2026-06-23 17:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'POR')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'UZB');
UPDATE public.matches SET match_date = '2026-06-24 02:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'COL')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'COD');
UPDATE public.matches SET match_date = '2026-06-27 23:30:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'COL')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'POR');
UPDATE public.matches SET match_date = '2026-06-27 23:30:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'COD')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'UZB');

-- Grupo L
UPDATE public.matches SET match_date = '2026-06-17 20:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'ENG')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'CRO');
UPDATE public.matches SET match_date = '2026-06-17 23:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'GHA')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'PAN');
UPDATE public.matches SET match_date = '2026-06-23 20:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'ENG')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'GHA');
UPDATE public.matches SET match_date = '2026-06-23 23:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'PAN')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'CRO');
UPDATE public.matches SET match_date = '2026-06-27 21:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'PAN')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'ENG');
UPDATE public.matches SET match_date = '2026-06-27 21:00:00+00'
WHERE home_team_id = (SELECT id FROM public.teams WHERE code = 'CRO')
  AND away_team_id = (SELECT id FROM public.teams WHERE code = 'GHA');
