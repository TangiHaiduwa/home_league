begin;

create table if not exists public.player_transfers (
  id bigint generated always as identity primary key,
  player_id bigint not null references public.players(id) on delete cascade,
  from_team_id bigint not null references public.teams(id) on delete restrict,
  to_team_id bigint not null references public.teams(id) on delete restrict,
  transfer_reason text,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (from_team_id <> to_team_id)
);

create index if not exists player_transfers_player_created_idx
  on public.player_transfers (player_id, created_at desc);

create index if not exists player_transfers_created_idx
  on public.player_transfers (created_at desc);

alter table public.player_transfers enable row level security;

drop policy if exists "Admins can read player transfers" on public.player_transfers;
create policy "Admins can read player transfers"
on public.player_transfers
for select
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can insert player transfers" on public.player_transfers;
create policy "Admins can insert player transfers"
on public.player_transfers
for insert
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

commit;
