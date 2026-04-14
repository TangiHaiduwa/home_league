begin;

alter table public.players
  add column if not exists first_name text,
  add column if not exists last_name text;

update public.players
set
  first_name = coalesce(
    nullif(trim(first_name), ''),
    nullif(split_part(trim(full_name), ' ', 1), ''),
    'Unknown'
  ),
  last_name = coalesce(
    nullif(trim(last_name), ''),
    nullif(trim(regexp_replace(trim(full_name), '^\S+\s*', '')), ''),
    ''
  );

alter table public.players
  alter column first_name set not null,
  alter column last_name set not null;

alter table public.players drop constraint if exists players_team_id_full_name_key;
alter table public.players drop constraint if exists players_team_id_first_name_last_name_key;
alter table public.players add constraint players_team_id_first_name_last_name_key unique (team_id, first_name, last_name);

alter table public.players drop column if exists full_name;

commit;
