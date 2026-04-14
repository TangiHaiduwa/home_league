begin;

alter table public.admin_users
  add column if not exists role text not null default 'super_admin'
  check (role in ('super_admin', 'match_official', 'media_officer'));

create or replace function public.is_super_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = uid
      and role = 'super_admin'
  );
$$;

create table if not exists public.admin_activity_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_logs_created_at_idx on public.admin_activity_logs(created_at desc);

alter table public.admin_activity_logs enable row level security;

drop policy if exists "Admin can view own membership" on public.admin_users;
drop policy if exists "Admins can view admin users" on public.admin_users;
create policy "Admins can view admin users"
on public.admin_users
for select
using (auth.uid() = user_id or public.is_super_admin(auth.uid()));

drop policy if exists "Super admins can insert admin users" on public.admin_users;
create policy "Super admins can insert admin users"
on public.admin_users
for insert
with check (
  public.is_super_admin(auth.uid())
);

drop policy if exists "Super admins can update admin users" on public.admin_users;
create policy "Super admins can update admin users"
on public.admin_users
for update
using (
  public.is_super_admin(auth.uid())
)
with check (
  public.is_super_admin(auth.uid())
);

drop policy if exists "Super admins can delete admin users" on public.admin_users;
create policy "Super admins can delete admin users"
on public.admin_users
for delete
using (
  public.is_super_admin(auth.uid())
);

drop policy if exists "Admins can read activity logs" on public.admin_activity_logs;
create policy "Admins can read activity logs"
on public.admin_activity_logs
for select
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can insert activity logs" on public.admin_activity_logs;
create policy "Admins can insert activity logs"
on public.admin_activity_logs
for insert
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

commit;
