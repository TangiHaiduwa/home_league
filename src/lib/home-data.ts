import { supabase } from "@/lib/supabase/server";

export type FixtureStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled" | "abandoned";

export type Fixture = {
  home: string;
  away: string;
  date: string;
  isoDate: string;
  venue: string;
  status: FixtureStatus;
  homeScore: number | null;
  awayScore: number | null;
  liveMinute: number | null;
  statusNote?: string | null;
};

export type Standing = {
  team: string;
  played: number;
  points: number;
};

export type NewsItem = {
  title: string;
  snippet: string;
};

export type Scorer = {
  player: string;
  team: string;
  goals: number;
};

const fallbackFixtures: Fixture[] = [
  {
    home: "Engineering FC",
    away: "Law Legends",
    date: "Fri 18 Apr",
    isoDate: new Date().toISOString(),
    venue: "UNAM Main Pitch",
    status: "live",
    homeScore: 2,
    awayScore: 1,
    liveMinute: 67,
  },
  {
    home: "Commerce United",
    away: "Education XI",
    date: "Sat 19 Apr",
    isoDate: new Date(Date.now() + 86_400_000).toISOString(),
    venue: "UNAM South Ground",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
    liveMinute: null,
  },
  {
    home: "Science Rovers",
    away: "Medical Stars",
    date: "Sun 20 Apr",
    isoDate: new Date(Date.now() - 86_400_000).toISOString(),
    venue: "UNAM Main Pitch",
    status: "finished",
    homeScore: 3,
    awayScore: 2,
    liveMinute: null,
  },
];

const fallbackStandings: Standing[] = [
  { team: "Engineering FC", played: 7, points: 16 },
  { team: "Commerce United", played: 7, points: 14 },
  { team: "Law Legends", played: 7, points: 13 },
  { team: "Science Rovers", played: 7, points: 12 },
];

const fallbackNews: NewsItem[] = [
  {
    title: "Season Kicks Off With Record Attendance",
    snippet: "More than 1,200 students attended opening weekend across two matchdays.",
  },
  {
    title: "Top Scorer Race Heating Up",
    snippet: "Three players are tied on 5 goals after Matchweek 3, setting up a tight chase.",
  },
  {
    title: "Referee Development Program Launched",
    snippet: "UNAM introduces student officiating workshops to strengthen match standards.",
  },
];

const fallbackScorers: Scorer[] = [
  { player: "David Shikongo", team: "Engineering FC", goals: 8 },
  { player: "Elifas Tomas", team: "Law Legends", goals: 7 },
  { player: "Michael !Garoeb", team: "Commerce United", goals: 6 },
  { player: "Petrus Uutoni", team: "Science Rovers", goals: 5 },
  { player: "Tuhafeni Kamati", team: "Medical Stars", goals: 5 },
];

type HomeData = {
  fixtures: Fixture[];
  standings: Standing[];
  news: NewsItem[];
  scorers: Scorer[];
  source: "supabase" | "fallback";
};

function getRelationName(
  relation: { name?: string } | { name?: string }[] | null | undefined,
  fallback = "Unknown Team",
) {
  if (!relation) return fallback;
  if (Array.isArray(relation)) return relation[0]?.name ?? fallback;
  return relation.name ?? fallback;
}

function getPlayerData(
  playerRelation:
    | { first_name?: string; last_name?: string; team?: { name?: string } | { name?: string }[] | null }
    | { first_name?: string; last_name?: string; team?: { name?: string } | { name?: string }[] | null }[]
    | null
    | undefined,
) {
  const player = Array.isArray(playerRelation) ? playerRelation[0] : playerRelation;
  const fullName = [player?.first_name ?? "", player?.last_name ?? ""].join(" ").trim();
  return {
    player: fullName || "Unknown Player",
    team: getRelationName(player?.team, "Unknown Team"),
  };
}

function formatFixtureDate(matchDate: string) {
  return new Date(matchDate).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function normalizeStatus(status: string | null): FixtureStatus {
  const value = (status ?? "scheduled").toLowerCase();
  if (value === "live" || value === "in_progress") return "live";
  if (value === "finished" || value === "ft" || value === "full_time") return "finished";
  if (value === "postponed") return "postponed";
  if (value === "cancelled") return "cancelled";
  if (value === "abandoned") return "abandoned";
  return "scheduled";
}

async function getActiveSeasonId() {
  const { data, error } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data?.id ?? null;
}

function mapFixtureRow(item: {
  home_team: { name?: string } | { name?: string }[] | null;
  away_team: { name?: string } | { name?: string }[] | null;
  match_date: string;
  venue: string | null;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  live_minute: number | null;
  status_note?: string | null;
}): Fixture {
  return {
    home: getRelationName(item.home_team, "TBD"),
    away: getRelationName(item.away_team, "TBD"),
    date: formatFixtureDate(item.match_date),
    isoDate: item.match_date,
    venue: item.venue ?? "UNAM Ground",
    status: normalizeStatus(item.status),
    homeScore: item.home_score,
    awayScore: item.away_score,
    liveMinute: item.live_minute,
    statusNote: item.status_note ?? null,
  };
}

export async function getHomeData(): Promise<HomeData> {
  const activeSeasonId = await getActiveSeasonId();

  let fixturesQuery = supabase
    .from("matches")
    .select(
      "match_date, venue, status, home_score, away_score, live_minute, status_note, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)",
    )
    .order("match_date", { ascending: true })
    .limit(6);

  if (activeSeasonId) {
    fixturesQuery = fixturesQuery.eq("season_id", activeSeasonId);
  }

  const [fixturesResult, standingsResult, newsResult, scorersResult] = await Promise.all([
    fixturesQuery,
    supabase
      .from("league_standings")
      .select("played, points, team:teams!league_standings_team_id_fkey(name)")
      .order("points", { ascending: false })
      .limit(4),
    supabase.from("news").select("title, snippet").order("created_at", { ascending: false }).limit(3),
    supabase
      .from("player_stats")
      .select("goals, player:players!player_stats_player_id_fkey(first_name, last_name, team:teams!players_team_id_fkey(name))")
      .order("goals", { ascending: false })
      .limit(5),
  ]);

  const hasError = fixturesResult.error || standingsResult.error || newsResult.error || scorersResult.error;
  if (hasError) {
    return {
      fixtures: fallbackFixtures,
      standings: fallbackStandings,
      news: fallbackNews,
      scorers: fallbackScorers,
      source: "fallback",
    };
  }

  const fixtures: Fixture[] = fixturesResult.data?.map((item) => mapFixtureRow(item)) ?? [];

  const standings: Standing[] =
    standingsResult.data?.map((item) => ({
      team: getRelationName(item.team as { name?: string } | { name?: string }[] | null, "Unknown Team"),
      played: item.played ?? 0,
      points: item.points ?? 0,
    })) ?? [];

  const news: NewsItem[] =
    newsResult.data?.map((item) => ({
      title: item.title,
      snippet: item.snippet,
    })) ?? [];

  const scorers: Scorer[] =
    scorersResult.data?.map((item) => {
      const playerData = getPlayerData(
        item.player as
          | { first_name?: string; last_name?: string; team?: { name?: string } | { name?: string }[] | null }
          | { first_name?: string; last_name?: string; team?: { name?: string } | { name?: string }[] | null }[]
          | null,
      );

      return {
        player: playerData.player,
        team: playerData.team,
        goals: item.goals ?? 0,
      };
    }) ?? [];

  if (!fixtures.length || !standings.length || !news.length || !scorers.length) {
    return {
      fixtures: fixtures.length ? fixtures : fallbackFixtures,
      standings: standings.length ? standings : fallbackStandings,
      news: news.length ? news : fallbackNews,
      scorers: scorers.length ? scorers : fallbackScorers,
      source: "fallback",
    };
  }

  return { fixtures, standings, news, scorers, source: "supabase" };
}

export async function getFixturesData() {
  const activeSeasonId = await getActiveSeasonId();

  let query = supabase
    .from("matches")
    .select(
      "match_date, venue, status, home_score, away_score, live_minute, status_note, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)",
    )
    .order("match_date", { ascending: true })
    .limit(30);

  if (activeSeasonId) {
    query = query.eq("season_id", activeSeasonId);
  }

  const result = await query;

  if (result.error || !result.data?.length) {
    return { fixtures: fallbackFixtures, source: "fallback" as const };
  }

  return {
    fixtures: result.data.map((item) => mapFixtureRow(item)),
    source: "supabase" as const,
  };
}

export async function getStandingsData() {
  const result = await supabase
    .from("league_standings")
    .select("played, points, team:teams!league_standings_team_id_fkey(name)")
    .order("points", { ascending: false })
    .limit(20);

  if (result.error || !result.data?.length) {
    return { standings: fallbackStandings, source: "fallback" as const };
  }

  return {
    standings: result.data.map((item) => ({
      team: getRelationName(item.team as { name?: string } | { name?: string }[] | null, "Unknown Team"),
      played: item.played ?? 0,
      points: item.points ?? 0,
    })),
    source: "supabase" as const,
  };
}

export async function getNewsData() {
  const result = await supabase
    .from("news")
    .select("title, snippet, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (result.error || !result.data?.length) {
    return {
      news: fallbackNews.map((item) => ({ ...item, date: "Recent" })),
      source: "fallback" as const,
    };
  }

  return {
    news: result.data.map((item) => ({
      title: item.title,
      snippet: item.snippet,
      date: new Date(item.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    })),
    source: "supabase" as const,
  };
}

export async function getTeamsData() {
  const standingsResult = await supabase
    .from("league_standings")
    .select("played, points, team:teams!league_standings_team_id_fkey(name)")
    .order("points", { ascending: false })
    .limit(20);

  if (standingsResult.error || !standingsResult.data?.length) {
    return {
      teams: fallbackStandings.map((row) => ({
        name: row.team,
        played: row.played,
        points: row.points,
      })),
      source: "fallback" as const,
    };
  }

  return {
    teams: standingsResult.data.map((item) => ({
      name: getRelationName(item.team as { name?: string } | { name?: string }[] | null, "Unknown Team"),
      played: item.played ?? 0,
      points: item.points ?? 0,
    })),
    source: "supabase" as const,
  };
}

export async function getScorersData() {
  const result = await supabase
    .from("player_stats")
    .select("goals, player:players!player_stats_player_id_fkey(first_name, last_name, team:teams!players_team_id_fkey(name))")
    .order("goals", { ascending: false })
    .limit(20);

  if (result.error || !result.data?.length) {
    return { scorers: fallbackScorers, source: "fallback" as const };
  }

  return {
    scorers: result.data.map((item) => {
      const playerData = getPlayerData(
        item.player as
          | { first_name?: string; last_name?: string; team?: { name?: string } | { name?: string }[] | null }
          | { first_name?: string; last_name?: string; team?: { name?: string } | { name?: string }[] | null }[]
          | null,
      );
      return {
        player: playerData.player,
        team: playerData.team,
        goals: item.goals ?? 0,
      };
    }),
    source: "supabase" as const,
  };
}
