alter table public.teams add column if not exists profile text;
alter table public.teams add column if not exists crest_url text;
alter table public.teams add column if not exists team_photo_url text;

alter table public.league_standings add column if not exists goals_for integer not null default 0;
alter table public.league_standings add column if not exists goals_against integer not null default 0;

alter table public.news add column if not exists image_url text;

create or replace function public.recompute_league_standings()
returns void
language plpgsql
as $$
begin
  delete from public.league_standings;

  insert into public.league_standings (team_id, played, points, goals_for, goals_against, goal_difference)
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
      coalesce(sum(case when pm.home_team_id = t.id then pm.home_score when pm.away_team_id = t.id then pm.away_score end), 0) as goals_for,
      coalesce(sum(case when pm.home_team_id = t.id then pm.away_score when pm.away_team_id = t.id then pm.home_score end), 0) as goals_against,
      (
        coalesce(sum(case when pm.home_team_id = t.id then pm.home_score when pm.away_team_id = t.id then pm.away_score end), 0)
        -
        coalesce(sum(case when pm.home_team_id = t.id then pm.away_score when pm.away_team_id = t.id then pm.home_score end), 0)
      ) as goal_difference
    from public.teams t
    left join played_matches pm on pm.home_team_id = t.id or pm.away_team_id = t.id
    group by t.id
  )
  select team_id, played, points, goals_for, goals_against, goal_difference
  from team_totals;
end;
$$;

update public.teams
set profile = case name
  when 'Engineering FC' then 'Engineering FC blend structure and vertical running, often turning quick transitions into early pressure in the final third.'
  when 'Law Legends' then 'Law Legends are aggressive out of possession and love direct service into the box, making them dangerous whenever the game opens up.'
  when 'Commerce United' then 'Commerce United are a balanced side that keep the ball moving and rely on wide overloads to create chances across the front line.'
  when 'Education XI' then 'Education XI are still searching for consistency, but their young squad keeps competing and creates enough chances to threaten every week.'
  when 'Science Rovers' then 'Science Rovers trust sharp combinations through midfield and have enough pace up top to punish tired legs late in matches.'
  when 'Medical Stars' then 'Medical Stars are compact and disciplined, usually building their points through patience and moments of quality in the final pass.'
  else profile
end
where profile is null;

select public.recompute_league_standings();
