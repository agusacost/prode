-- Protect group-stage fixture and predictions from being wiped by future migrations.
--
-- Context: el fixture de fase de grupos (12 grupos, 48 equipos, 72 partidos) quedo
-- definitivo el 2026-06-10, con el primer partido el 2026-06-11. A partir de ahora
-- los usuarios cargan predicciones para esos partidos, por lo que NUNCA deben
-- borrarse ni esos partidos ni esas predicciones, sin importar que migraciones
-- futuras reordenen/corrijan el resto del bracket (round_of_32 en adelante).

-- 1) Bloquear DELETE de predicciones de partidos de fase de grupos
create or replace function public.prevent_group_stage_prediction_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.matches
    where id = old.match_id
      and stage = 'group_stage'
  ) then
    raise exception 'No se pueden eliminar predicciones de partidos de fase de grupos (match_id: %)', old.match_id;
  end if;
  return old;
end;
$$;

drop trigger if exists protect_group_stage_predictions on public.predictions;
create trigger protect_group_stage_predictions
  before delete on public.predictions
  for each row execute procedure public.prevent_group_stage_prediction_delete();

-- 2) Bloquear TRUNCATE de predictions (no admite WHERE, asi que no podria
--    preservar selectivamente las de fase de grupos)
create or replace function public.prevent_predictions_truncate()
returns trigger
language plpgsql
as $$
begin
  raise exception 'TRUNCATE sobre public.predictions esta bloqueado. Usa DELETE con condiciones especificas (las predicciones de fase de grupos estan protegidas igualmente).';
end;
$$;

drop trigger if exists protect_predictions_truncate on public.predictions;
create trigger protect_predictions_truncate
  before truncate on public.predictions
  for each statement execute procedure public.prevent_predictions_truncate();

-- 3) Bloquear DELETE de partidos de fase de grupos (de los que dependen
--    predictions y match_results)
create or replace function public.prevent_group_stage_match_delete()
returns trigger
language plpgsql
as $$
begin
  if old.stage = 'group_stage' then
    raise exception 'No se pueden eliminar partidos de fase de grupos (match_id: %)', old.id;
  end if;
  return old;
end;
$$;

drop trigger if exists protect_group_stage_matches on public.matches;
create trigger protect_group_stage_matches
  before delete on public.matches
  for each row execute procedure public.prevent_group_stage_match_delete();

-- 4) Bloquear TRUNCATE de matches (incluye TRUNCATE ... CASCADE disparado
--    desde teams / tournament_groups, que en Postgres tambien dispara los
--    triggers BEFORE TRUNCATE de las tablas arrastradas por la cascada)
create or replace function public.prevent_matches_truncate()
returns trigger
language plpgsql
as $$
begin
  raise exception 'TRUNCATE sobre public.matches esta bloqueado. Usa DELETE con condiciones especificas (los partidos de fase de grupos estan protegidos igualmente).';
end;
$$;

drop trigger if exists protect_matches_truncate on public.matches;
create trigger protect_matches_truncate
  before truncate on public.matches
  for each statement execute procedure public.prevent_matches_truncate();
