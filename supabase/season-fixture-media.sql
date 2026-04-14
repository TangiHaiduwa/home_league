begin;

create table if not exists public.seasons (
  id bigint generated always as identity primary key,
  name text not null unique,
  start_date date,
  end_date date,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists seasons_single_active_idx
  on public.seasons (is_active)
  where is_active = true;

alter table public.seasons enable row level security;

drop policy if exists "Public read seasons" on public.seasons;
create policy "Public read seasons"
on public.seasons
for select
using (true);

drop policy if exists "Admins can insert seasons" on public.seasons;
create policy "Admins can insert seasons"
on public.seasons
for insert
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can update seasons" on public.seasons;
create policy "Admins can update seasons"
on public.seasons
for update
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete seasons" on public.seasons;
create policy "Admins can delete seasons"
on public.seasons
for delete
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

insert into public.seasons (name, is_active)
values ('UNAM Home League 2026', true)
on conflict (name) do nothing;

alter table public.matches
  add column if not exists season_id bigint references public.seasons(id) on delete set null,
  add column if not exists status_note text;

update public.matches
set season_id = (select id from public.seasons where is_active = true limit 1)
where season_id is null;

alter table public.matches drop constraint if exists matches_status_check;
alter table public.matches add constraint matches_status_check
  check (status in ('scheduled', 'live', 'finished', 'postponed', 'cancelled', 'abandoned'));

create table if not exists public.media_assets (
  id bigint generated always as identity primary key,
  title text not null,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video', 'document', 'link')),
  caption text,
  season_id bigint references public.seasons(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists media_assets_created_at_idx on public.media_assets (created_at desc);

alter table public.media_assets enable row level security;

drop policy if exists "Public read media assets" on public.media_assets;
create policy "Public read media assets"
on public.media_assets
for select
using (true);

drop policy if exists "Admins can insert media assets" on public.media_assets;
create policy "Admins can insert media assets"
on public.media_assets
for insert
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can update media assets" on public.media_assets;
create policy "Admins can update media assets"
on public.media_assets
for update
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete media assets" on public.media_assets;
create policy "Admins can delete media assets"
on public.media_assets
for delete
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

commit;
