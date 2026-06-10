-- Performance indexes for hot query paths
create index idx_predictions_match_id   on public.predictions(match_id);
create index idx_predictions_prode_user on public.predictions(prode_id, user_id);
create index idx_prode_members_prode    on public.prode_members(prode_id);
create index idx_prode_members_user     on public.prode_members(user_id);
create index idx_matches_stage_date     on public.matches(stage, match_date);
create index idx_matches_group_id       on public.matches(group_id);
