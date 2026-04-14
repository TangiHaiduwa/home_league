import {
  addAwayGoal,
  addHomeGoal,
  addMinute,
  createFixture,
  createPlayer,
  createNewsPost,
  createTeam,
  finishMatch,
  logoutAdmin,
  startLiveMatch,
  updateMatchResult,
} from "@/app/admin/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

type AdminPageProps = {
  searchParams: Promise<{ error?: string; success?: string; section?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { error, success, section } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const activeSection = section ?? "live";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?error=Please sign in first");
  }

  const { data: adminRow } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).single();
  if (!adminRow) {
    redirect("/admin/login?error=You are not an admin user");
  }

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, match_date, status, home_score, away_score, live_minute, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)",
    )
    .order("match_date", { ascending: true })
    .limit(30);

  const { data: latestNews } = await supabase
    .from("news")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, short_name")
    .order("name", { ascending: true })
    .limit(100);

  const { data: latestPlayers } = await supabase
    .from("players")
    .select("id, full_name, team:teams!players_team_id_fkey(name)")
    .order("created_at", { ascending: false })
    .limit(8);

  const getTeamName = (
    teamRelation: { name?: string } | { name?: string }[] | null | undefined,
  ) => {
    if (!teamRelation) return "Unknown Team";
    if (Array.isArray(teamRelation)) return teamRelation[0]?.name ?? "Unknown Team";
    return teamRelation.name ?? "Unknown Team";
  };

  const tabClass = (id: string) =>
    `rounded-full px-4 py-2 text-sm font-bold transition ${
      activeSection === id
        ? "bg-[var(--hl-red)] text-white"
        : "border border-[var(--hl-red)]/20 bg-white text-[var(--hl-red)] hover:bg-[var(--hl-red)]/10"
    }`;

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-8 px-5 py-10 md:px-8 md:py-14">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="brand-display text-5xl text-[var(--hl-red)] md:text-6xl">Admin Console</h1>
          <p className="mt-1 text-sm text-[var(--hl-muted)]">Manage results, live status, and league news.</p>
        </div>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="rounded-full border border-[var(--hl-red)]/20 bg-white px-4 py-2 text-sm font-bold text-[var(--hl-red)]"
          >
            Sign Out
          </button>
        </form>
      </header>

      {error ? (
        <p className="rounded-xl border border-[var(--hl-red)]/20 bg-[var(--hl-red)]/8 px-3 py-2 text-sm text-[var(--hl-red)]">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
      ) : null}

      <nav className="flex flex-wrap gap-2">
        <Link href="/admin?section=live" className={tabClass("live")}>
          Live Control
        </Link>
        <Link href="/admin?section=matches" className={tabClass("matches")}>
          Matches
        </Link>
        <Link href="/admin?section=teams-players" className={tabClass("teams-players")}>
          Teams & Players
        </Link>
        <Link href="/admin?section=news" className={tabClass("news")}>
          News
        </Link>
      </nav>

      <section className="grid gap-6 md:grid-cols-2">
        {activeSection === "live" ? (
          <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6 md:col-span-2">
          <h2 className="text-xl font-black text-[var(--hl-red)]">Field Mode (Live Control)</h2>
          <p className="mt-1 text-sm text-[var(--hl-muted)]">
            Use these quick actions on mobile while officials are at the field.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {matches?.map((match) => {
              const home = getTeamName(
                match.home_team as { name?: string } | { name?: string }[] | null,
              );
              const away = getTeamName(
                match.away_team as { name?: string } | { name?: string }[] | null,
              );
              const homeScore = match.home_score ?? 0;
              const awayScore = match.away_score ?? 0;
              const minute = match.live_minute ?? 0;
              return (
                <article key={`field-${match.id}`} className="rounded-2xl border border-[var(--hl-red)]/15 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-[var(--hl-ink)]">
                      {home} vs {away}
                    </p>
                    <span className="rounded-full bg-[var(--hl-red)]/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.09em] text-[var(--hl-red)]">
                      {match.status === "live" ? `LIVE ${minute}'` : match.status === "finished" ? "FT" : "Scheduled"}
                    </span>
                  </div>
                  <p className="brand-display mt-2 text-4xl text-[var(--hl-red)]">
                    {homeScore} - {awayScore}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <form action={addHomeGoal}>
                      <input type="hidden" name="match_id" value={match.id} />
                      <button type="submit" className="w-full rounded-xl bg-[var(--hl-red)] px-3 py-3 text-sm font-black text-white">
                        + Goal {home}
                      </button>
                    </form>
                    <form action={addAwayGoal}>
                      <input type="hidden" name="match_id" value={match.id} />
                      <button type="submit" className="w-full rounded-xl bg-[var(--hl-red)] px-3 py-3 text-sm font-black text-white">
                        + Goal {away}
                      </button>
                    </form>
                    <form action={addMinute}>
                      <input type="hidden" name="match_id" value={match.id} />
                      <button type="submit" className="w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-3 text-sm font-black text-[var(--hl-red)]">
                        +1 Minute
                      </button>
                    </form>
                    <form action={startLiveMatch}>
                      <input type="hidden" name="match_id" value={match.id} />
                      <button type="submit" className="w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-3 text-sm font-black text-[var(--hl-red)]">
                        Start Live
                      </button>
                    </form>
                  </div>
                  <form action={finishMatch} className="mt-2">
                    <input type="hidden" name="match_id" value={match.id} />
                    <button type="submit" className="w-full rounded-xl bg-[var(--hl-gold)] px-3 py-3 text-sm font-black text-[var(--hl-red)]">
                      Full Time
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
          </article>
        ) : null}

        {activeSection === "matches" ? (
          <>
            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Create Fixture</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Schedule a new match with date/time and venue.</p>
              <form action={createFixture} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold">
                    Home Team
                    <select
                      name="home_team_id"
                      required
                      className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    >
                      <option value="">Select team</option>
                      {teams?.map((team) => (
                        <option key={`home-${team.id}`} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">
                    Away Team
                    <select
                      name="away_team_id"
                      required
                      className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    >
                      <option value="">Select team</option>
                      {teams?.map((team) => (
                        <option key={`away-${team.id}`} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block text-sm font-semibold">
                  Match Date & Time
                  <input
                    name="match_date"
                    type="datetime-local"
                    required
                    className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Venue
                  <input
                    name="venue"
                    type="text"
                    className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    placeholder="UNAM Main Pitch"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Status
                  <select
                    name="status"
                    defaultValue="scheduled"
                    className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="finished">Finished</option>
                  </select>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block text-sm font-semibold">
                    Home Score
                    <input
                      name="home_score"
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Away Score
                    <input
                      name="away_score"
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Live Minute
                    <input
                      name="live_minute"
                      type="number"
                      min="0"
                      max="130"
                      className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[var(--hl-red-dark)]"
                >
                  Create Fixture
                </button>
              </form>
            </article>

            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Update Match</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Set live scores, final scores, and match status.</p>
              <form action={updateMatchResult} className="mt-4 space-y-3">
                <label className="block text-sm font-semibold">
                  Match
                  <select
                    name="match_id"
                    required
                    className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                  >
                    <option value="">Select a match</option>
                    {matches?.map((match) => {
                      const home = getTeamName(
                        match.home_team as { name?: string } | { name?: string }[] | null,
                      );
                      const away = getTeamName(
                        match.away_team as { name?: string } | { name?: string }[] | null,
                      );
                      const matchDate = new Date(match.match_date).toLocaleDateString("en-GB");
                      return (
                        <option key={match.id} value={match.id}>
                          {home} vs {away} - {matchDate}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="block text-sm font-semibold">
                  Status
                  <select
                    name="status"
                    defaultValue="scheduled"
                    className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="finished">Finished</option>
                  </select>
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <label className="block text-sm font-semibold">
                    Home Score
                    <input
                      name="home_score"
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Away Score
                    <input
                      name="away_score"
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Live Minute
                    <input
                      name="live_minute"
                      type="number"
                      min="0"
                      max="130"
                      className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[var(--hl-red-dark)]"
                >
                  Save Match Update
                </button>
              </form>
            </article>
          </>
        ) : null}

        {activeSection === "news" ? (
          <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6 md:col-span-2">
          <h2 className="text-xl font-black text-[var(--hl-red)]">Publish News</h2>
          <p className="mt-1 text-sm text-[var(--hl-muted)]">Create a new headline for the homepage and news page.</p>
          <form action={createNewsPost} className="mt-4 space-y-3">
            <label className="block text-sm font-semibold">
              Headline
              <input
                name="title"
                type="text"
                required
                className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                placeholder="Matchweek 4 kicks off this Friday"
              />
            </label>
            <label className="block text-sm font-semibold">
              Summary
              <textarea
                name="snippet"
                rows={4}
                required
                className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                placeholder="Keep this short and informative for homepage cards."
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-[var(--hl-gold)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-[var(--hl-red)] transition hover:bg-[#ddb251]"
            >
              Publish News
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--hl-red)]/10 pt-4">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--hl-muted)]">Recent News</p>
            <ul className="mt-2 space-y-2 text-sm">
              {latestNews?.map((item) => (
                <li key={item.id} className="rounded-lg border border-[var(--hl-red)]/10 bg-white px-3 py-2">
                  <p className="font-semibold text-[var(--hl-ink)]">{item.title}</p>
                </li>
              ))}
            </ul>
          </div>
          </article>
        ) : null}

        {activeSection === "teams-players" ? (
          <>
            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Create Team</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Add a new team or update short code by name.</p>
              <form action={createTeam} className="mt-4 space-y-3">
                <label className="block text-sm font-semibold">
                  Team Name
                  <input
                    name="name"
                    type="text"
                    required
                    className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    placeholder="Architecture United"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Short Name (optional)
                  <input
                    name="short_name"
                    type="text"
                    maxLength={6}
                    className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-[var(--hl-red)]"
                    placeholder="ARC"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[var(--hl-red-dark)]"
                >
                  Save Team
                </button>
              </form>
            </article>

            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Create Player</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Add player roster and optional initial stats.</p>
              <form action={createPlayer} className="mt-4 space-y-3">
                <label className="block text-sm font-semibold">
                  Team
                  <select
                    name="team_id"
                    required
                    className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                  >
                    <option value="">Select team</option>
                    {teams?.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                        {team.short_name ? ` (${team.short_name})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Full Name
                  <input
                    name="full_name"
                    type="text"
                    required
                    className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    placeholder="John Doe"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold">
                    Shirt No.
                    <input
                      name="shirt_number"
                      type="number"
                      min="1"
                      max="99"
                      className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Position
                    <input
                      name="position"
                      type="text"
                      className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                      placeholder="Forward"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold">
                    Goals
                    <input
                      name="goals"
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Assists
                    <input
                      name="assists"
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[var(--hl-gold)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-[var(--hl-red)] transition hover:bg-[#ddb251]"
                >
                  Save Player
                </button>
              </form>

              <div className="mt-6 border-t border-[var(--hl-red)]/10 pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--hl-muted)]">Recent Players</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {latestPlayers?.map((player) => {
                    const teamName = getTeamName(
                      player.team as { name?: string } | { name?: string }[] | null,
                    );
                    return (
                      <li key={player.id} className="rounded-lg border border-[var(--hl-red)]/10 bg-white px-3 py-2">
                        <p className="font-semibold text-[var(--hl-ink)]">{player.full_name}</p>
                        <p className="text-xs text-[var(--hl-muted)]">{teamName}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </article>
          </>
        ) : null}
      </section>
    </div>
  );
}
