-- Admin access controls for authenticated league admins.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Admins can verify their own membership row.
drop policy if exists "Admin can view own membership" on public.admin_users;
create policy "Admin can view own membership"
on public.admin_users
for select
using (auth.uid() = user_id);

-- Public read is already enabled for matches/news in setup.sql. Add admin write permissions.
drop policy if exists "Admins can update matches" on public.matches;
create policy "Admins can update matches"
on public.matches
for update
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can insert matches" on public.matches;
create policy "Admins can insert matches"
on public.matches
for insert
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete matches" on public.matches;
create policy "Admins can delete matches"
on public.matches
for delete
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can insert news" on public.news;
create policy "Admins can insert news"
on public.news
for insert
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can update news" on public.news;
create policy "Admins can update news"
on public.news
for update
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete news" on public.news;
create policy "Admins can delete news"
on public.news
for delete
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can insert teams" on public.teams;
create policy "Admins can insert teams"
on public.teams
for insert
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can update teams" on public.teams;
create policy "Admins can update teams"
on public.teams
for update
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete teams" on public.teams;
create policy "Admins can delete teams"
on public.teams
for delete
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can insert players" on public.players;
create policy "Admins can insert players"
on public.players
for insert
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can update players" on public.players;
create policy "Admins can update players"
on public.players
for update
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete players" on public.players;
create policy "Admins can delete players"
on public.players
for delete
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can insert player stats" on public.player_stats;
create policy "Admins can insert player stats"
on public.player_stats
for insert
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can update player stats" on public.player_stats;
create policy "Admins can update player stats"
on public.player_stats
for update
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete player stats" on public.player_stats;
create policy "Admins can delete player stats"
on public.player_stats
for delete
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Add your current authenticated admin user(s) here by UUID after creating auth users.
-- Example:
-- insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-000000000000') on conflict do nothing;
