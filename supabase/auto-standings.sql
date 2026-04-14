-- Apply to an existing DB that already has the normalized schema.

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

select public.recompute_league_standings();
