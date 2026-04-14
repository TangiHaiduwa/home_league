begin;

-- Ensure normalized schema exists before any cleanup.
do $$
begin
  if to_regclass('public.teams') is null
     or to_regclass('public.matches') is null
     or to_regclass('public.league_standings') is null
     or to_regclass('public.player_stats') is null then
    raise exception 'Normalized tables missing. Run supabase/setup.sql first.';
  end if;
end $$;

-- Backup legacy MVP tables if they still exist.
do $$
begin
  if to_regclass('public.fixtures') is not null then
    execute 'drop table if exists public.legacy_fixtures_backup';
    execute 'create table public.legacy_fixtures_backup as table public.fixtures';
  end if;

  if to_regclass('public.standings') is not null then
    execute 'drop table if exists public.legacy_standings_backup';
    execute 'create table public.legacy_standings_backup as table public.standings';
  end if;

  if to_regclass('public.scorers') is not null then
    execute 'drop table if exists public.legacy_scorers_backup';
    execute 'create table public.legacy_scorers_backup as table public.scorers';
  end if;
end $$;

-- Drop legacy tables after backup.
drop table if exists public.fixtures cascade;
drop table if exists public.standings cascade;
drop table if exists public.scorers cascade;

commit;
