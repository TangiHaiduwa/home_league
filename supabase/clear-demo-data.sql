begin;

-- Keep schema and admin users, remove seeded/demo league content only.
truncate table
  public.player_stats,
  public.players,
  public.matches,
  public.league_standings,
  public.news,
  public.teams
restart identity cascade;

commit;
