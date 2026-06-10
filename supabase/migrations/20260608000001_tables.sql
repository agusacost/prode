-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- public.users — extended from auth.users
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- public.tournament_groups
create table public.tournament_groups (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  code  char(1) not null,
  stage text not null default 'group_stage'
);

-- public.teams
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        char(3) not null,
  flag_url    text,
  group_id    uuid references public.tournament_groups(id)
);

-- public.matches
create table public.matches (
  id           uuid primary key default gen_random_uuid(),
  home_team_id uuid references public.teams(id),
  away_team_id uuid references public.teams(id),
  home_slot    text,
  away_slot    text,
  stage        text not null,
  match_date   timestamptz not null,
  venue        text,
  status       text not null default 'scheduled',
  group_id     uuid references public.tournament_groups(id)
);

-- public.match_results
create table public.match_results (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid unique not null references public.matches(id),
  home_goals   int not null check (home_goals >= 0),
  away_goals   int not null check (away_goals >= 0),
  updated_at   timestamptz not null default now()
);

-- public.prodes
create table public.prodes (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.users(id),
  name        text not null,
  invite_code text unique not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- public.prode_members
create table public.prode_members (
  id             uuid primary key default gen_random_uuid(),
  prode_id       uuid not null references public.prodes(id) on delete cascade,
  user_id        uuid not null references public.users(id),
  role           text not null default 'member',
  total_score    int not null default 0,
  exact_results  int not null default 0,
  correct_signs  int not null default 0,
  joined_at      timestamptz not null default now(),
  unique (prode_id, user_id)
);

-- public.predictions
create table public.predictions (
  id            uuid primary key default gen_random_uuid(),
  prode_id      uuid not null references public.prodes(id) on delete cascade,
  user_id       uuid not null references public.users(id),
  match_id      uuid not null references public.matches(id),
  home_goals    int not null check (home_goals >= 0),
  away_goals    int not null check (away_goals >= 0),
  points_earned int,
  submitted_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (prode_id, user_id, match_id)
);
