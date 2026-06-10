-- Tabla para predicciones del campeón del torneo
create table public.champion_predictions (
  id           uuid primary key default gen_random_uuid(),
  prode_id     uuid not null references public.prodes(id) on delete cascade,
  user_id      uuid not null references public.users(id),
  team_id      uuid not null references public.teams(id),
  points_earned int,
  submitted_at timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (prode_id, user_id)
);

-- Configuración global del torneo (key/value)
create table public.tournament_config (
  key   text primary key,
  value text
);

-- RLS: champion_predictions
alter table public.champion_predictions enable row level security;

create policy "co-member read champion_predictions"
  on public.champion_predictions for select
  using (
    exists (
      select 1 from public.prode_members pm
      where pm.prode_id = champion_predictions.prode_id
        and pm.user_id = auth.uid()
    )
  );

create policy "own insert champion_predictions"
  on public.champion_predictions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.prode_members pm
      where pm.prode_id = champion_predictions.prode_id
        and pm.user_id = auth.uid()
    )
  );

create policy "own update champion_predictions"
  on public.champion_predictions for update
  using (user_id = auth.uid());

-- RLS: tournament_config
alter table public.tournament_config enable row level security;

create policy "public read tournament_config"
  on public.tournament_config for select
  using (true);

create policy "admin write tournament_config"
  on public.tournament_config for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  );

-- Realtime: REPLICA IDENTITY FULL necesario para suscripción filtrada
alter table public.prode_members replica identity full;

-- Índices
create index idx_champion_predictions_prode on public.champion_predictions(prode_id);
create index idx_champion_predictions_user  on public.champion_predictions(user_id);
