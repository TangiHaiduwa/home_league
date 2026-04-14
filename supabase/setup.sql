create table if not exists public.teams (
  id bigint generated always as identity primary key,
  name text not null unique,
  short_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id bigint generated always as identity primary key,
  team_id bigint not null references public.teams(id) on delete cascade,
  full_name text not null,
  shirt_number integer,
  position text,
  created_at timestamptz not null default now(),
  unique (team_id, full_name)
);

create table if not exists public.matches (
  id bigint generated always as identity primary key,
  home_team_id bigint not null references public.teams(id) on delete restrict,
  away_team_id bigint not null references public.teams(id) on delete restrict,
  match_date timestamptz not null,
  venue text,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'finished')),
  home_score integer,
  away_score integer,
  live_minute integer,
  created_at timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);

create table if not exists public.league_standings (
  id bigint generated always as identity primary key,
  team_id bigint not null unique references public.teams(id) on delete cascade,
  played integer not null default 0,
  points integer not null default 0,
  goal_difference integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.player_stats (
  id bigint generated always as identity primary key,
  player_id bigint not null unique references public.players(id) on delete cascade,
  goals integer not null default 0,
  assists integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id bigint generated always as identity primary key,
  title text not null,
  snippet text not null,
  created_at timestamptz not null default now()
);

create or replace function public.recompute_league_standings()
returns void
language plpgsql
as $$
begin
  delete from public.league_standings;

  insert into public.league_standings (team_id, played, points, goal_difference)
  with played_matches as (
    select home_team_id, away_team_id, home_score, away_score
    from public.matches
    where status = 'finished'
      and home_score is not null
      and away_score is not null
  ),
  team_totals as (
    select
      t.id as team_id,
      count(pm.*) filter (where pm.home_team_id = t.id or pm.away_team_id = t.id) as played,
      (
        3 * count(*) filter (where (pm.home_team_id = t.id and pm.home_score > pm.away_score) or (pm.away_team_id = t.id and pm.away_score > pm.home_score))
      ) + count(*) filter (where pm.home_score = pm.away_score and (pm.home_team_id = t.id or pm.away_team_id = t.id)) as points,
      (
        coalesce(sum(case when pm.home_team_id = t.id then pm.home_score when pm.away_team_id = t.id then pm.away_score end), 0)
        -
        coalesce(sum(case when pm.home_team_id = t.id then pm.away_score when pm.away_team_id = t.id then pm.home_score end), 0)
      ) as goal_difference
    from public.teams t
    left join played_matches pm on pm.home_team_id = t.id or pm.away_team_id = t.id
    group by t.id
  )
  select team_id, played, points, goal_difference
  from team_totals;
end;
$$;

create or replace function public.handle_matches_standings_refresh()
returns trigger
language plpgsql
as $$
begin
  perform public.recompute_league_standings();
  return null;
end;
$$;

drop trigger if exists matches_standings_refresh on public.matches;
create trigger matches_standings_refresh
after insert or update of status, home_score, away_score, home_team_id, away_team_id or delete
on public.matches
for each row
execute function public.handle_matches_standings_refresh();

alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.league_standings enable row level security;
alter table public.player_stats enable row level security;
alter table public.news enable row level security;

drop policy if exists "Public read teams" on public.teams;
create policy "Public read teams" on public.teams for select using (true);

drop policy if exists "Public read players" on public.players;
create policy "Public read players" on public.players for select using (true);

drop policy if exists "Public read matches" on public.matches;
create policy "Public read matches" on public.matches for select using (true);

drop policy if exists "Public read standings" on public.league_standings;
create policy "Public read standings" on public.league_standings for select using (true);

drop policy if exists "Public read player stats" on public.player_stats;
create policy "Public read player stats" on public.player_stats for select using (true);

drop policy if exists "Public read news" on public.news;
create policy "Public read news" on public.news for select using (true);

insert into public.teams (name, short_name)
values
  ('Engineering FC', 'ENG'),
  ('Law Legends', 'LAW'),
  ('Commerce United', 'COM'),
  ('Education XI', 'EDU'),
  ('Science Rovers', 'SCI'),
  ('Medical Stars', 'MED')
on conflict (name) do update set short_name = excluded.short_name;

insert into public.players (team_id, full_name, shirt_number, position)
select t.id, p.full_name, p.shirt_number, p.position
from (
  values
    ('Engineering FC', 'David Shikongo', 9, 'Forward'),
    ('Law Legends', 'Elifas Tomas', 10, 'Forward'),
    ('Commerce United', 'Michael !Garoeb', 11, 'Winger'),
    ('Science Rovers', 'Petrus Uutoni', 7, 'Striker'),
    ('Medical Stars', 'Tuhafeni Kamati', 17, 'Forward')
) as p(team_name, full_name, shirt_number, position)
join public.teams t on t.name = p.team_name
on conflict (team_id, full_name) do update set
  shirt_number = excluded.shirt_number,
  position = excluded.position;

insert into public.matches (home_team_id, away_team_id, match_date, venue, status, home_score, away_score, live_minute)
select home_t.id, away_t.id, m.match_date, m.venue, m.status, m.home_score, m.away_score, m.live_minute
from (
  values
    ('Engineering FC', 'Law Legends', now() + interval '5 minutes', 'UNAM Main Pitch', 'live', 2, 1, 67),
    ('Commerce United', 'Education XI', now() + interval '1 day', 'UNAM South Ground', 'scheduled', null, null, null),
    ('Science Rovers', 'Medical Stars', now() - interval '1 day', 'UNAM Main Pitch', 'finished', 3, 2, null)
) as m(home_team, away_team, match_date, venue, status, home_score, away_score, live_minute)
join public.teams home_t on home_t.name = m.home_team
join public.teams away_t on away_t.name = m.away_team
where not exists (select 1 from public.matches);

select public.recompute_league_standings();

insert into public.player_stats (player_id, goals, assists)
select p.id, s.goals, s.assists
from (
  values
    ('David Shikongo', 'Engineering FC', 8, 2),
    ('Elifas Tomas', 'Law Legends', 7, 1),
    ('Michael !Garoeb', 'Commerce United', 6, 4),
    ('Petrus Uutoni', 'Science Rovers', 5, 2),
    ('Tuhafeni Kamati', 'Medical Stars', 5, 1)
) as s(player_name, team_name, goals, assists)
join public.teams t on t.name = s.team_name
join public.players p on p.team_id = t.id and p.full_name = s.player_name
on conflict (player_id) do update set
  goals = excluded.goals,
  assists = excluded.assists;

insert into public.news (title, snippet)
select * from (
  values
    ('Season Kicks Off With Record Attendance', 'More than 1,200 students attended opening weekend across two matchdays.'),
    ('Top Scorer Race Heating Up', 'Three players are tied on 5 goals after Matchweek 3, setting up a tight chase.'),
    ('Referee Development Program Launched', 'UNAM introduces student officiating workshops to strengthen match standards.')
) as v(title, snippet)
where not exists (select 1 from public.news);
