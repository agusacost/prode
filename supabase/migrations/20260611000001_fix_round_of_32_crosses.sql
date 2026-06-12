-- Fix round_of_32 cross formulas to match the official FIFA 2026 Round of 32
-- bracket (Partidos 73-88). Updates in place (same row ids) so any existing
-- predictions tied to these match ids are preserved.

with ordered as (
  select id, row_number() over (order by match_date asc) as rn
  from public.matches
  where stage = 'round_of_32'
),
formulas (rn, home_slot, away_slot) as (
  values
    (1,  '2° Grupo A', '2° Grupo B'),
    (2,  '1° Grupo E', '3° A/B/C/D/F'),
    (3,  '1° Grupo F', '2° Grupo C'),
    (4,  '1° Grupo C', '2° Grupo F'),
    (5,  '1° Grupo I', '3° C/D/F/G/H'),
    (6,  '2° Grupo E', '2° Grupo I'),
    (7,  '1° Grupo A', '3° C/E/F/H/I'),
    (8,  '1° Grupo L', '3° E/H/I/J/K'),
    (9,  '1° Grupo D', '3° B/E/F/I/J'),
    (10, '1° Grupo G', '3° A/E/H/I/J'),
    (11, '2° Grupo K', '2° Grupo L'),
    (12, '1° Grupo H', '2° Grupo J'),
    (13, '1° Grupo B', '3° E/F/G/I/J'),
    (14, '1° Grupo J', '2° Grupo H'),
    (15, '1° Grupo K', '3° D/E/I/J/L'),
    (16, '2° Grupo D', '2° Grupo G')
)
update public.matches m
set home_slot = f.home_slot,
    away_slot = f.away_slot
from ordered o
join formulas f on f.rn = o.rn
where m.id = o.id;
