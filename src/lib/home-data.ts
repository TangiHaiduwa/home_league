import { supabase } from "@/lib/supabase/server";
import { buildNewsImageUrl, buildTeamBannerUrl, slugifyTeamName } from "@/lib/league-media";

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
  shortName: string | null;
  slug: string;
  crestImageUrl: string | null;
  played: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

export type NewsItem = {
  id?: number;
  title: string;
  snippet: string;
  imageUrl: string;
  date?: string;
};

export type Scorer = {
  id?: number;
  player: string;
  team: string;
  teamSlug: string;
  crestImageUrl: string | null;
  goals: number;
  assists: number;
  position: string | null;
  shirtNumber: number | null;
};

export type TeamPlayer = {
  id?: number;
  firstName: string;
  lastName: string;
  fullName: string;
  shirtNumber: number | null;
  position: string | null;
  goals: number;
  assists: number;
};

export type TeamProfile = {
  id?: number;
  name: string;
  shortName: string | null;
  slug: string;
  crestImageUrl: string | null;
  bannerImageUrl: string;
  profile: string;
  played: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  rosterCount: number;
  players: TeamPlayer[];
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

const fallbackTeamProfiles: TeamProfile[] = [
  {
    name: "Engineering FC",
    shortName: "ENG",
    slug: slugifyTeamName("Engineering FC"),
    crestImageUrl: null,
    bannerImageUrl: buildTeamBannerUrl("Engineering FC"),
    profile:
      "Engineering FC blend structure and vertical running, often turning quick transitions into early pressure in the final third.",
    played: 7,
    points: 16,
    goalsFor: 14,
    goalsAgainst: 7,
    goalDifference: 7,
    rosterCount: 3,
    players: [
      {
        firstName: "David",
        lastName: "Shikongo",
        fullName: "David Shikongo",
        shirtNumber: 9,
        position: "Forward",
        goals: 8,
        assists: 2,
      },
      {
        firstName: "Paulus",
        lastName: "Hamutenya",
        fullName: "Paulus Hamutenya",
        shirtNumber: 6,
        position: "Midfielder",
        goals: 2,
        assists: 4,
      },
      {
        firstName: "Jason",
        lastName: "Kavari",
        fullName: "Jason Kavari",
        shirtNumber: 1,
        position: "Goalkeeper",
        goals: 0,
        assists: 0,
      },
    ],
  },
  {
    name: "Commerce United",
    shortName: "COM",
    slug: slugifyTeamName("Commerce United"),
    crestImageUrl: null,
    bannerImageUrl: buildTeamBannerUrl("Commerce United"),
    profile:
      "Commerce United are a balanced side that keep the ball moving and rely on wide overloads to create chances across the front line.",
    played: 7,
    points: 14,
    goalsFor: 12,
    goalsAgainst: 8,
    goalDifference: 4,
    rosterCount: 3,
    players: [
      {
        firstName: "Michael",
        lastName: "!Garoeb",
        fullName: "Michael !Garoeb",
        shirtNumber: 11,
        position: "Winger",
        goals: 6,
        assists: 4,
      },
      {
        firstName: "Selma",
        lastName: "Nghilifa",
        fullName: "Selma Nghilifa",
        shirtNumber: 8,
        position: "Midfielder",
        goals: 2,
        assists: 5,
      },
      {
        firstName: "Simeon",
        lastName: "Katjavivi",
        fullName: "Simeon Katjavivi",
        shirtNumber: 4,
        position: "Defender",
        goals: 1,
        assists: 1,
      },
    ],
  },
  {
    name: "Law Legends",
    shortName: "LAW",
    slug: slugifyTeamName("Law Legends"),
    crestImageUrl: null,
    bannerImageUrl: buildTeamBannerUrl("Law Legends"),
    profile:
      "Law Legends are aggressive out of possession and love direct service into the box, making them dangerous whenever the game opens up.",
    played: 7,
    points: 13,
    goalsFor: 11,
    goalsAgainst: 9,
    goalDifference: 2,
    rosterCount: 3,
    players: [
      {
        firstName: "Elifas",
        lastName: "Tomas",
        fullName: "Elifas Tomas",
        shirtNumber: 10,
        position: "Forward",
        goals: 7,
        assists: 1,
      },
      {
        firstName: "Tobias",
        lastName: "Shikalepo",
        fullName: "Tobias Shikalepo",
        shirtNumber: 7,
        position: "Winger",
        goals: 2,
        assists: 3,
      },
      {
        firstName: "Martha",
        lastName: "Amutenya",
        fullName: "Martha Amutenya",
        shirtNumber: 5,
        position: "Defender",
        goals: 0,
        assists: 1,
      },
    ],
  },
  {
    name: "Science Rovers",
    shortName: "SCI",
    slug: slugifyTeamName("Science Rovers"),
    crestImageUrl: null,
    bannerImageUrl: buildTeamBannerUrl("Science Rovers"),
    profile:
      "Science Rovers trust sharp combinations through midfield and have enough pace up top to punish tired legs late in matches.",
    played: 7,
    points: 12,
    goalsFor: 10,
    goalsAgainst: 9,
    goalDifference: 1,
    rosterCount: 3,
    players: [
      {
        firstName: "Petrus",
        lastName: "Uutoni",
        fullName: "Petrus Uutoni",
        shirtNumber: 7,
        position: "Striker",
        goals: 5,
        assists: 2,
      },
      {
        firstName: "Anna",
        lastName: "Haufiku",
        fullName: "Anna Haufiku",
        shirtNumber: 12,
        position: "Midfielder",
        goals: 1,
        assists: 4,
      },
      {
        firstName: "Josef",
        lastName: "Mwandingi",
        fullName: "Josef Mwandingi",
        shirtNumber: 2,
        position: "Defender",
        goals: 0,
        assists: 1,
      },
    ],
  },
  {
    name: "Medical Stars",
    shortName: "MED",
    slug: slugifyTeamName("Medical Stars"),
    crestImageUrl: null,
    bannerImageUrl: buildTeamBannerUrl("Medical Stars"),
    profile:
      "Medical Stars are compact and disciplined, usually building their points through patience and moments of quality in the final pass.",
    played: 7,
    points: 9,
    goalsFor: 8,
    goalsAgainst: 10,
    goalDifference: -2,
    rosterCount: 3,
    players: [
      {
        firstName: "Tuhafeni",
        lastName: "Kamati",
        fullName: "Tuhafeni Kamati",
        shirtNumber: 17,
        position: "Forward",
        goals: 5,
        assists: 1,
      },
      {
        firstName: "Caren",
        lastName: "Neshuku",
        fullName: "Caren Neshuku",
        shirtNumber: 14,
        position: "Midfielder",
        goals: 1,
        assists: 3,
      },
      {
        firstName: "Moses",
        lastName: "Kauaria",
        fullName: "Moses Kauaria",
        shirtNumber: 3,
        position: "Defender",
        goals: 0,
        assists: 0,
      },
    ],
  },
  {
    name: "Education XI",
    shortName: "EDU",
    slug: slugifyTeamName("Education XI"),
    crestImageUrl: null,
    bannerImageUrl: buildTeamBannerUrl("Education XI"),
    profile:
      "Education XI are still searching for consistency, but their young squad keeps competing and creates enough chances to threaten every week.",
    played: 7,
    points: 5,
    goalsFor: 6,
    goalsAgainst: 14,
    goalDifference: -8,
    rosterCount: 3,
    players: [
      {
        firstName: "Mateus",
        lastName: "Kuhanga",
        fullName: "Mateus Kuhanga",
        shirtNumber: 19,
        position: "Forward",
        goals: 3,
        assists: 1,
      },
      {
        firstName: "Naemi",
        lastName: "Tjitunga",
        fullName: "Naemi Tjitunga",
        shirtNumber: 8,
        position: "Midfielder",
        goals: 1,
        assists: 2,
      },
      {
        firstName: "Elago",
        lastName: "Ashipala",
        fullName: "Elago Ashipala",
        shirtNumber: 5,
        position: "Defender",
        goals: 0,
        assists: 0,
      },
    ],
  },
].map((team, index) => ({
  ...team,
  id: index + 1,
  players: team.players.map((player, playerIndex) => ({
    ...player,
    id: (index + 1) * 100 + playerIndex + 1,
  })),
}));

const fallbackStandings: Standing[] = fallbackTeamProfiles
  .map((team) => ({
    team: team.name,
    shortName: team.shortName,
    slug: team.slug,
    crestImageUrl: team.crestImageUrl,
    played: team.played,
    points: team.points,
    goalsFor: team.goalsFor,
    goalsAgainst: team.goalsAgainst,
    goalDifference: team.goalDifference,
  }))
  .sort(compareStandings);

const fallbackNews: NewsItem[] = [
  {
    title: "Season Kicks Off With Record Attendance",
    snippet: "More than 1,200 students attended opening weekend across two matchdays.",
    imageUrl: buildNewsImageUrl("Season Kicks Off With Record Attendance"),
    date: "Recent",
  },
  {
    title: "Top Scorer Race Heating Up",
    snippet: "Engineering, Law, and Commerce all have attackers making an early push in both goals and assists charts.",
    imageUrl: buildNewsImageUrl("Top Scorer Race Heating Up"),
    date: "Recent",
  },
  {
    title: "Referee Development Program Launched",
    snippet: "UNAM introduces student officiating workshops to strengthen match standards across the league.",
    imageUrl: buildNewsImageUrl("Referee Development Program Launched"),
    date: "Recent",
  },
];

const fallbackScorers: Scorer[] = fallbackTeamProfiles
  .flatMap((team) =>
    team.players.map((player) => ({
      id: player.id,
      player: player.fullName,
      team: team.name,
      teamSlug: team.slug,
      crestImageUrl: team.crestImageUrl,
      goals: player.goals,
      assists: player.assists,
      position: player.position,
      shirtNumber: player.shirtNumber,
    })),
  )
  .sort((left, right) => compareScorers(left, right, "goals"));

type Source = "supabase" | "fallback";

type HomeData = {
  fixtures: Fixture[];
  standings: Standing[];
  news: NewsItem[];
  scorers: Scorer[];
  source: Source;
};

type RelationRecord = Record<string, unknown>;

function getRecord(relation: RelationRecord | RelationRecord[] | null | undefined) {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getTeamRelationDetails(relation: RelationRecord | RelationRecord[] | null | undefined, fallback = "Unknown Team") {
  const team = getRecord(relation);
  const name = getString(team?.name) ?? fallback;
  return {
    id: typeof team?.id === "number" ? team.id : undefined,
    name,
    shortName: getString(team?.short_name),
    slug: slugifyTeamName(name),
    crestImageUrl: getString(team?.crest_url),
    bannerImageUrl: getString(team?.team_photo_url) ?? buildTeamBannerUrl(name),
    profile:
      getString(team?.profile) ??
      `${name} continue to build their identity in the UNAM Home League with a competitive squad and growing matchday presence.`,
  };
}

function formatFixtureDate(matchDate: string) {
  return new Date(matchDate).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatNewsDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function compareStandings(left: Standing, right: Standing) {
  return (
    right.points - left.points ||
    right.goalDifference - left.goalDifference ||
    right.goalsFor - left.goalsFor ||
    left.team.localeCompare(right.team)
  );
}

function compareScorers(left: Scorer, right: Scorer, metric: "goals" | "assists") {
  return (
    right[metric] - left[metric] ||
    right.goals - left.goals ||
    right.assists - left.assists ||
    left.player.localeCompare(right.player)
  );
}

export function sortScorersByMetric(scorers: Scorer[], metric: "goals" | "assists") {
  return [...scorers].sort((left, right) => compareScorers(left, right, metric));
}

async function getActiveSeasonId() {
  const { data, error } = await supabase.from("seasons").select("id").eq("is_active", true).single();
  if (error) return null;
  return data?.id ?? null;
}

function mapFixtureRow(item: RelationRecord): Fixture {
  return {
    home: getTeamRelationDetails(item.home_team as RelationRecord | RelationRecord[] | null | undefined, "TBD").name,
    away: getTeamRelationDetails(item.away_team as RelationRecord | RelationRecord[] | null | undefined, "TBD").name,
    date: formatFixtureDate(String(item.match_date ?? new Date().toISOString())),
    isoDate: String(item.match_date ?? new Date().toISOString()),
    venue: getString(item.venue) ?? "UNAM Ground",
    status: normalizeStatus(getString(item.status)),
    homeScore: item.home_score === null ? null : getNumber(item.home_score),
    awayScore: item.away_score === null ? null : getNumber(item.away_score),
    liveMinute: item.live_minute === null ? null : getNumber(item.live_minute),
    statusNote: getString(item.status_note),
  };
}

async function fetchFixturesData(limit: number) {
  const activeSeasonId = await getActiveSeasonId();

  let query = supabase
    .from("matches")
    .select(
      "match_date, venue, status, home_score, away_score, live_minute, status_note, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)",
    )
    .order("match_date", { ascending: true })
    .limit(limit);

  if (activeSeasonId) {
    query = query.eq("season_id", activeSeasonId);
  }

  const result = await query;

  if (result.error || !result.data?.length) {
    return { fixtures: fallbackFixtures.slice(0, limit), source: "fallback" as const };
  }

  return {
    fixtures: result.data.map((item) => mapFixtureRow(item as RelationRecord)),
    source: "supabase" as const,
  };
}

async function fetchStandingsData(limit: number) {
  const result = await supabase
    .from("league_standings")
    .select("*, team:teams!league_standings_team_id_fkey(*)")
    .order("points", { ascending: false })
    .order("goal_difference", { ascending: false })
    .limit(limit);

  if (result.error || !result.data?.length) {
    return { standings: fallbackStandings.slice(0, limit), source: "fallback" as const };
  }

  const standings = result.data
    .map((item) => {
      const team = getTeamRelationDetails(item.team as RelationRecord | RelationRecord[] | null | undefined);
      const goalsFor = getNumber(item.goals_for);
      const goalsAgainst = getNumber(item.goals_against);
      const goalDifference =
        typeof item.goal_difference === "number" ? item.goal_difference : goalsFor - goalsAgainst;

      return {
        team: team.name,
        shortName: team.shortName,
        slug: team.slug,
        crestImageUrl: team.crestImageUrl,
        played: getNumber(item.played),
        points: getNumber(item.points),
        goalsFor,
        goalsAgainst,
        goalDifference,
      };
    })
    .sort(compareStandings);

  return { standings, source: "supabase" as const };
}

async function fetchNewsData(limit: number) {
  const result = await supabase.from("news").select("*").order("created_at", { ascending: false }).limit(limit);

  if (result.error || !result.data?.length) {
    return { news: fallbackNews.slice(0, limit), source: "fallback" as const };
  }

  return {
    news: result.data.map((item) => ({
      id: getNumber(item.id),
      title: getString(item.title) ?? "League Update",
      snippet: getString(item.snippet) ?? "Official league update.",
      imageUrl: getString(item.image_url) ?? buildNewsImageUrl(getString(item.title) ?? "League Update"),
      date: item.created_at ? formatNewsDate(String(item.created_at)) : "Recent",
    })),
    source: "supabase" as const,
  };
}

async function fetchScorersData(limit: number) {
  const result = await supabase
    .from("player_stats")
    .select("*, player:players!player_stats_player_id_fkey(*, team:teams!players_team_id_fkey(*))")
    .order("goals", { ascending: false })
    .order("assists", { ascending: false })
    .limit(limit);

  if (result.error || !result.data?.length) {
    return { scorers: fallbackScorers.slice(0, limit), source: "fallback" as const };
  }

  const scorers = result.data.map((item) => {
    const player = getRecord(item.player as RelationRecord | RelationRecord[] | null | undefined);
    const team = getTeamRelationDetails(player?.team as RelationRecord | RelationRecord[] | null | undefined);
    const firstName = getString(player?.first_name) ?? "";
    const lastName = getString(player?.last_name) ?? "";
    const playerName = `${firstName} ${lastName}`.trim() || "Unknown Player";

    return {
      id: getNumber(item.player_id || item.id),
      player: playerName,
      team: team.name,
      teamSlug: team.slug,
      crestImageUrl: team.crestImageUrl,
      goals: getNumber(item.goals),
      assists: getNumber(item.assists),
      position: getString(player?.position),
      shirtNumber:
        typeof player?.shirt_number === "number" && Number.isFinite(player.shirt_number)
          ? player.shirt_number
          : null,
    };
  });

  return { scorers: sortScorersByMetric(scorers, "goals"), source: "supabase" as const };
}

async function fetchTeamProfilesData() {
  const [teamsResult, standingsResult, playersResult] = await Promise.all([
    supabase.from("teams").select("*").order("name", { ascending: true }).limit(100),
    supabase.from("league_standings").select("*").limit(100),
    supabase
      .from("players")
      .select("*, stats:player_stats(goals, assists)")
      .order("team_id", { ascending: true })
      .order("shirt_number", { ascending: true }),
  ]);

  if (teamsResult.error || !teamsResult.data?.length) {
    return { teams: fallbackTeamProfiles, source: "fallback" as const };
  }

  const standingsByTeamId = new Map<number, RelationRecord>();
  for (const row of standingsResult.data ?? []) {
    if (typeof row.team_id === "number") {
      standingsByTeamId.set(row.team_id, row as RelationRecord);
    }
  }

  const playersByTeamId = new Map<number, TeamPlayer[]>();
  for (const row of playersResult.data ?? []) {
    if (typeof row.team_id !== "number") continue;
    const statRow = getRecord(row.stats as RelationRecord | RelationRecord[] | null | undefined);
    const firstName = getString(row.first_name) ?? "";
    const lastName = getString(row.last_name) ?? "";
    const player: TeamPlayer = {
      id: typeof row.id === "number" ? row.id : undefined,
      firstName: firstName || "Unknown",
      lastName: lastName || "Player",
      fullName: `${firstName} ${lastName}`.trim() || "Unknown Player",
      shirtNumber: typeof row.shirt_number === "number" ? row.shirt_number : null,
      position: getString(row.position),
      goals: getNumber(statRow?.goals),
      assists: getNumber(statRow?.assists),
    };

    const list = playersByTeamId.get(row.team_id) ?? [];
    list.push(player);
    playersByTeamId.set(row.team_id, list);
  }

  const teams = teamsResult.data
    .map((row) => {
      const team = getTeamRelationDetails(row as RelationRecord);
      const teamId = typeof row.id === "number" ? row.id : undefined;
      const standing = teamId ? standingsByTeamId.get(teamId) : undefined;
      const players = teamId ? (playersByTeamId.get(teamId) ?? []) : [];

      players.sort((left, right) => {
        const shirtDifference =
          (left.shirtNumber ?? Number.MAX_SAFE_INTEGER) - (right.shirtNumber ?? Number.MAX_SAFE_INTEGER);
        return shirtDifference || left.fullName.localeCompare(right.fullName);
      });

      const goalsFor = getNumber(standing?.goals_for);
      const goalsAgainst = getNumber(standing?.goals_against);

      return {
        id: teamId,
        name: team.name,
        shortName: team.shortName,
        slug: team.slug,
        crestImageUrl: team.crestImageUrl,
        bannerImageUrl: team.bannerImageUrl,
        profile: team.profile,
        played: getNumber(standing?.played),
        points: getNumber(standing?.points),
        goalsFor,
        goalsAgainst,
        goalDifference:
          typeof standing?.goal_difference === "number"
            ? standing.goal_difference
            : goalsFor - goalsAgainst,
        rosterCount: players.length,
        players,
      };
    })
    .sort((left, right) =>
      compareStandings(
        {
          team: left.name,
          shortName: left.shortName,
          slug: left.slug,
          crestImageUrl: left.crestImageUrl,
          played: left.played,
          points: left.points,
          goalsFor: left.goalsFor,
          goalsAgainst: left.goalsAgainst,
          goalDifference: left.goalDifference,
        },
        {
          team: right.name,
          shortName: right.shortName,
          slug: right.slug,
          crestImageUrl: right.crestImageUrl,
          played: right.played,
          points: right.points,
          goalsFor: right.goalsFor,
          goalsAgainst: right.goalsAgainst,
          goalDifference: right.goalDifference,
        },
      ),
    );

  return { teams, source: "supabase" as const };
}

export async function getHomeData(): Promise<HomeData> {
  const [fixturesResult, standingsResult, newsResult, scorersResult] = await Promise.all([
    fetchFixturesData(6),
    fetchStandingsData(6),
    fetchNewsData(3),
    fetchScorersData(12),
  ]);

  const source: Source =
    fixturesResult.source === "supabase" &&
    standingsResult.source === "supabase" &&
    newsResult.source === "supabase" &&
    scorersResult.source === "supabase"
      ? "supabase"
      : "fallback";

  return {
    fixtures: fixturesResult.fixtures,
    standings: standingsResult.standings,
    news: newsResult.news,
    scorers: scorersResult.scorers,
    source,
  };
}

export async function getFixturesData() {
  return fetchFixturesData(30);
}

export async function getStandingsData() {
  return fetchStandingsData(20);
}

export async function getNewsData() {
  return fetchNewsData(20);
}

export async function getTeamsData() {
  return fetchTeamProfilesData();
}

export async function getScorersData() {
  return fetchScorersData(20);
}

export async function getTeamProfileBySlug(slug: string) {
  const { teams, source } = await fetchTeamProfilesData();
  const team =
    teams.find((item) => item.slug === slug) ?? fallbackTeamProfiles.find((item) => item.slug === slug) ?? null;

  if (!team) {
    return { team: null, source };
  }

  return { team, source };
}
