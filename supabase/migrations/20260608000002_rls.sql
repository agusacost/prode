-- tournament_groups: public read
alter table public.tournament_groups enable row level security;
create policy "public read" on public.tournament_groups for select using (true);

-- teams: public read
alter table public.teams enable row level security;
create policy "public read" on public.teams for select using (true);

-- matches: public read
alter table public.matches enable row level security;
create policy "public read" on public.matches for select using (true);

-- match_results: public read, admin write
alter table public.match_results enable row level security;
create policy "public read" on public.match_results for select using (true);
create policy "admin write" on public.match_results for all
  using (exists (select 1 from public.users where id = auth.uid() and is_admin));

-- users: public read, own update
alter table public.users enable row level security;
create policy "public read" on public.users for select using (true);
create policy "own update" on public.users for update using (auth.uid() = id);

-- prodes: member read, owner insert/update
alter table public.prodes enable row level security;
create policy "member read" on public.prodes for select
  using (exists (select 1 from public.prode_members where prode_id = prodes.id and user_id = auth.uid()));
create policy "owner insert" on public.prodes for insert with check (owner_id = auth.uid());
create policy "owner update" on public.prodes for update using (owner_id = auth.uid());

-- prode_members: co-member read, self insert/delete
alter table public.prode_members enable row level security;
create policy "co-member read" on public.prode_members for select
  using (exists (select 1 from public.prode_members pm2 where pm2.prode_id = prode_members.prode_id and pm2.user_id = auth.uid()));
create policy "self insert" on public.prode_members for insert with check (user_id = auth.uid());
create policy "self delete" on public.prode_members for delete using (user_id = auth.uid() and role = 'member');

-- predictions: own visible always, co-member visible always
alter table public.predictions enable row level security;
create policy "own predictions visible" on public.predictions for select
  using (user_id = auth.uid());
create policy "co-member predictions visible" on public.predictions for select
  using (
    exists (select 1 from public.prode_members pm where pm.prode_id = predictions.prode_id and pm.user_id = auth.uid())
  );
create policy "own insert" on public.predictions for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.prode_members where prode_id = predictions.prode_id and user_id = auth.uid())
    and exists (select 1 from public.matches where id = predictions.match_id and match_date > now() and status = 'scheduled')
  );
create policy "own update before kickoff" on public.predictions for update
  using (
    user_id = auth.uid()
    and exists (select 1 from public.matches where id = predictions.match_id and match_date > now() and status = 'scheduled')
  );
