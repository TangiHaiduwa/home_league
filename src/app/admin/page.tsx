import {
  addAdminUser,
  addAwayGoal,
  addHomeGoal,
  addMinute,
  createFixture,
  createMediaAsset,
  createNewsPost,
  createPlayer,
  createSeason,
  createTeam,
  deleteMediaAsset,
  deleteMatch,
  deleteNewsPost,
  deletePlayer,
  deleteTeam,
  finishMatch,
  logoutAdmin,
  transferPlayer,
  startLiveMatch,
  setActiveSeason,
  updateAdminUserRole,
  updateMatchResult,
  updateNewsPost,
  removeAdminUser,
} from "@/app/admin/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

type AdminPageProps = {
  searchParams: Promise<{ error?: string; success?: string; section?: string }>;
};

const roleOptions = [
  { value: "super_admin", label: "Super Admin" },
  { value: "match_official", label: "Match Official" },
  { value: "media_officer", label: "Media Officer" },
];

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
      "id, match_date, status, home_score, away_score, live_minute, venue, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)",
    )
    .order("match_date", { ascending: true })
    .limit(50);

  const { data: latestNews } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("name", { ascending: true })
    .limit(100);

  const { data: latestPlayers } = await supabase
    .from("players")
    .select("id, team_id, first_name, last_name, shirt_number, position, created_at, team:teams!players_team_id_fkey(name)")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, start_date, end_date, is_active")
    .order("created_at", { ascending: false })
    .limit(30);

  const activeSeasonId = seasons?.find((season) => season.is_active)?.id ?? null;

  const { data: mediaAssets, error: mediaError } = await supabase
    .from("media_assets")
    .select("id, title, media_url, media_type, caption, created_at, season:seasons(name)")
    .order("created_at", { ascending: false })
    .limit(40);

  const { data: transferHistory, error: transferHistoryError } = await supabase
    .from("player_transfers")
    .select(
      "id, created_at, transfer_reason, actor_user_id, player:players!player_transfers_player_id_fkey(first_name, last_name), from_team:teams!player_transfers_from_team_id_fkey(name), to_team:teams!player_transfers_to_team_id_fkey(name)",
    )
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: adminUsers, error: adminUsersError } = await supabase
    .from("admin_users")
    .select("user_id, role, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: activityLogs, error: activityError } = await supabase
    .from("admin_activity_logs")
    .select("id, actor_user_id, action_type, entity_type, entity_id, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

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
          <p className="mt-1 text-sm text-[var(--hl-muted)]">Manage matches, teams, players, news, and admin access.</p>
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
        <Link href="/admin?section=live" className={tabClass("live")}>Live Control</Link>
        <Link href="/admin?section=seasons" className={tabClass("seasons")}>Seasons</Link>
        <Link href="/admin?section=matches" className={tabClass("matches")}>Matches</Link>
        <Link href="/admin?section=teams-players" className={tabClass("teams-players")}>Teams & Players</Link>
        <Link href="/admin?section=news" className={tabClass("news")}>News</Link>
        <Link href="/admin?section=media" className={tabClass("media")}>Media Center</Link>
        <Link href="/admin?section=access" className={tabClass("access")}>Access & Logs</Link>
      </nav>

      <section className="grid gap-6 md:grid-cols-2">
        {activeSection === "live" ? (
          <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6 md:col-span-2">
            <h2 className="text-xl font-black text-[var(--hl-red)]">Field Mode (Live Control)</h2>
            <p className="mt-1 text-sm text-[var(--hl-muted)]">Quick mobile actions for officials at the pitch.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {matches?.map((match) => {
                const home = getTeamName(match.home_team as { name?: string } | { name?: string }[] | null);
                const away = getTeamName(match.away_team as { name?: string } | { name?: string }[] | null);
                const homeScore = match.home_score ?? 0;
                const awayScore = match.away_score ?? 0;
                const minute = match.live_minute ?? 0;
                return (
                  <article key={`field-${match.id}`} className="rounded-2xl border border-[var(--hl-red)]/15 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-[var(--hl-ink)]">{home} vs {away}</p>
                      <span className="rounded-full bg-[var(--hl-red)]/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.09em] text-[var(--hl-red)]">
                        {match.status === "live"
                          ? `LIVE ${minute}'`
                          : match.status === "finished"
                            ? "FT"
                            : match.status === "postponed"
                              ? "Postponed"
                              : match.status === "cancelled"
                                ? "Cancelled"
                                : match.status === "abandoned"
                                  ? "Abandoned"
                                  : "Scheduled"}
                      </span>
                    </div>
                    <p className="brand-display mt-2 text-4xl text-[var(--hl-red)]">{homeScore} - {awayScore}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <form action={addHomeGoal}><input type="hidden" name="match_id" value={match.id} /><button type="submit" className="w-full rounded-xl bg-[var(--hl-red)] px-3 py-3 text-sm font-black text-white">+ Goal {home}</button></form>
                      <form action={addAwayGoal}><input type="hidden" name="match_id" value={match.id} /><button type="submit" className="w-full rounded-xl bg-[var(--hl-red)] px-3 py-3 text-sm font-black text-white">+ Goal {away}</button></form>
                      <form action={addMinute}><input type="hidden" name="match_id" value={match.id} /><button type="submit" className="w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-3 text-sm font-black text-[var(--hl-red)]">+1 Minute</button></form>
                      <form action={startLiveMatch}><input type="hidden" name="match_id" value={match.id} /><button type="submit" className="w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-3 text-sm font-black text-[var(--hl-red)]">Start Live</button></form>
                    </div>
                    <form action={finishMatch} className="mt-2"><input type="hidden" name="match_id" value={match.id} /><button type="submit" className="w-full rounded-xl bg-[var(--hl-gold)] px-3 py-3 text-sm font-black text-[var(--hl-red)]">Full Time</button></form>
                  </article>
                );
              })}
            </div>
          </article>
        ) : null}

        {activeSection === "seasons" ? (
          <>
            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Create Season</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Set up a new competition season.</p>
              <form action={createSeason} className="mt-4 space-y-3">
                <label className="block text-sm font-semibold">Season Name
                  <input name="name" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm" placeholder="UNAM Home League 2026/27" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold">Start Date
                    <input name="start_date" type="date" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm" />
                  </label>
                  <label className="block text-sm font-semibold">End Date
                    <input name="end_date" type="date" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm" />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input name="make_active" type="checkbox" className="h-4 w-4" />
                  Set as active season
                </label>
                <button type="submit" className="w-full rounded-full bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white">Create Season</button>
              </form>
            </article>

            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Current Seasons</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Activate the season officials should operate on.</p>
              <ul className="mt-4 space-y-3">
                {seasons?.map((season) => (
                  <li key={season.id} className="rounded-xl border border-[var(--hl-red)]/10 bg-white p-3">
                    <p className="font-semibold text-[var(--hl-ink)]">{season.name}</p>
                    <p className="text-xs text-[var(--hl-muted)]">
                      {season.start_date ?? "No start"} - {season.end_date ?? "No end"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {season.is_active ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-green-700">Active</span>
                      ) : (
                        <form action={setActiveSeason}>
                          <input type="hidden" name="season_id" value={season.id} />
                          <button type="submit" className="rounded-full bg-[var(--hl-gold)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--hl-red)]">Set Active</button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </>
        ) : null}

        {activeSection === "matches" ? (
          <>
            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Create Fixture</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Schedule a new match with date/time and venue.</p>
              <form action={createFixture} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold">Home Team
                    <select name="home_team_id" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]">
                      <option value="">Select team</option>{teams?.map((team) => (<option key={`home-${team.id}`} value={team.id}>{team.name}</option>))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">Away Team
                    <select name="away_team_id" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]">
                      <option value="">Select team</option>{teams?.map((team) => (<option key={`away-${team.id}`} value={team.id}>{team.name}</option>))}
                    </select>
                  </label>
                </div>
                <label className="block text-sm font-semibold">Match Date & Time<input name="match_date" type="datetime-local" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" /></label>
                <label className="block text-sm font-semibold">Venue<input name="venue" type="text" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="UNAM Main Pitch" /></label>
                <label className="block text-sm font-semibold">Status
                  <select name="status" defaultValue="scheduled" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]">
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="finished">Finished</option>
                    <option value="postponed">Postponed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="abandoned">Abandoned</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold">Season
                  <select name="season_id" defaultValue={activeSeasonId ? String(activeSeasonId) : ""} className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]">
                    <option value="">Active Season</option>
                    {seasons?.map((season) => (
                      <option key={`season-create-${season.id}`} value={season.id}>
                        {season.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">Status Note (optional)
                  <input name="status_note" type="text" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="Reason for postponement/cancellation" />
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block text-sm font-semibold">Home Score<input name="home_score" type="number" min="0" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" /></label>
                  <label className="block text-sm font-semibold">Away Score<input name="away_score" type="number" min="0" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" /></label>
                  <label className="block text-sm font-semibold">Live Minute<input name="live_minute" type="number" min="0" max="130" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" /></label>
                </div>
                <button type="submit" className="w-full rounded-full bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[var(--hl-red-dark)]">Create Fixture</button>
              </form>
            </article>

            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Update or Delete Match</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Set scores, status, or remove incorrect fixtures.</p>
              <form action={updateMatchResult} className="mt-4 space-y-3">
                <label className="block text-sm font-semibold">Match
                  <select name="match_id" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]">
                    <option value="">Select a match</option>
                    {matches?.map((match) => {
                      const home = getTeamName(match.home_team as { name?: string } | { name?: string }[] | null);
                      const away = getTeamName(match.away_team as { name?: string } | { name?: string }[] | null);
                      const matchDate = new Date(match.match_date).toLocaleDateString("en-GB");
                      return <option key={match.id} value={match.id}>{home} vs {away} - {matchDate}</option>;
                    })}
                  </select>
                </label>
                <label className="block text-sm font-semibold">Status
                  <select name="status" defaultValue="scheduled" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]">
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="finished">Finished</option>
                    <option value="postponed">Postponed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="abandoned">Abandoned</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold">Status Note (optional)
                  <input name="status_note" type="text" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="Reason for status change" />
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block text-sm font-semibold">Home Score<input name="home_score" type="number" min="0" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" /></label>
                  <label className="block text-sm font-semibold">Away Score<input name="away_score" type="number" min="0" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" /></label>
                  <label className="block text-sm font-semibold">Live Minute<input name="live_minute" type="number" min="0" max="130" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" /></label>
                </div>
                <button type="submit" className="w-full rounded-full bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[var(--hl-red-dark)]">Save Match Update</button>
              </form>

              <form action={deleteMatch} className="mt-4 space-y-3 border-t border-[var(--hl-red)]/10 pt-4">
                <label className="block text-sm font-semibold">Delete Match
                  <select name="match_id" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]">
                    <option value="">Select match to delete</option>
                    {matches?.map((match) => {
                      const home = getTeamName(match.home_team as { name?: string } | { name?: string }[] | null);
                      const away = getTeamName(match.away_team as { name?: string } | { name?: string }[] | null);
                      return <option key={`del-${match.id}`} value={match.id}>{home} vs {away}</option>;
                    })}
                  </select>
                </label>
                <button type="submit" className="w-full rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-red-700">Delete Match</button>
              </form>
            </article>
          </>
        ) : null}

        {activeSection === "news" ? (
          <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6 md:col-span-2">
            <h2 className="text-xl font-black text-[var(--hl-red)]">Publish News</h2>
            <p className="mt-1 text-sm text-[var(--hl-muted)]">Create and edit official league announcements with article imagery.</p>
            <form action={createNewsPost} className="mt-4 space-y-3">
              <label className="block text-sm font-semibold">Headline<input name="title" type="text" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="Matchweek 4 kicks off this Friday" /></label>
              <label className="block text-sm font-semibold">Summary<textarea name="snippet" rows={4} required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="Keep this short and informative for homepage cards." /></label>
              <label className="block text-sm font-semibold">Image URL (optional)<input name="image_url" type="url" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="https://..." /></label>
              <button type="submit" className="w-full rounded-full bg-[var(--hl-gold)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-[var(--hl-red)] transition hover:bg-[#ddb251]">Publish News</button>
            </form>

            <div className="mt-6 border-t border-[var(--hl-red)]/10 pt-4">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--hl-muted)]">Manage News</p>
              <div className="mt-3 space-y-3">
                {latestNews?.map((item) => (
                  <article key={item.id} className="rounded-xl border border-[var(--hl-red)]/10 bg-white p-3">
                    <form action={updateNewsPost} className="space-y-2">
                      <input type="hidden" name="news_id" value={item.id} />
                      <input name="title" defaultValue={item.title} required className="w-full rounded-lg border border-[var(--hl-red)]/20 px-3 py-2 text-sm" />
                      <input name="image_url" type="url" defaultValue={(item as { image_url?: string | null }).image_url ?? ""} className="w-full rounded-lg border border-[var(--hl-red)]/20 px-3 py-2 text-sm" placeholder="https://..." />
                      <textarea name="snippet" defaultValue={item.snippet} rows={3} required className="w-full rounded-lg border border-[var(--hl-red)]/20 px-3 py-2 text-sm" />
                      <button type="submit" className="rounded-full bg-[var(--hl-red)] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-white">Save</button>
                    </form>
                    <form action={deleteNewsPost} className="mt-2">
                      <input type="hidden" name="news_id" value={item.id} />
                      <button type="submit" className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-red-700">Delete</button>
                    </form>
                  </article>
                ))}
              </div>
            </div>
          </article>
        ) : null}

        {activeSection === "teams-players" ? (
          <>
            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Create Team</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Add a new team or update its profile, crest, and banner image.</p>
              <form action={createTeam} className="mt-4 space-y-3">
                <label className="block text-sm font-semibold">Team Name<input name="name" type="text" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="Architecture United" /></label>
                <label className="block text-sm font-semibold">Short Name (optional)<input name="short_name" type="text" maxLength={6} className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-[var(--hl-red)]" placeholder="ARC" /></label>
                <label className="block text-sm font-semibold">Club Profile (optional)<textarea name="profile" rows={4} className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="Short description for the club profile page." /></label>
                <label className="block text-sm font-semibold">Crest URL (optional)<input name="crest_url" type="url" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="https://..." /></label>
                <label className="block text-sm font-semibold">Team Photo URL (optional)<input name="team_photo_url" type="url" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="https://..." /></label>
                <button type="submit" className="w-full rounded-full bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[var(--hl-red-dark)]">Save Team</button>
              </form>

              <div className="mt-6 border-t border-[var(--hl-red)]/10 pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--hl-muted)]">Current Teams</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {teams?.map((team) => (
                    <li key={team.id} className="rounded-lg border border-[var(--hl-red)]/10 bg-white px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--hl-ink)]">{team.name}{team.short_name ? ` (${team.short_name})` : ""}</p>
                          <p className="text-xs text-[var(--hl-muted)]">{(team as { profile?: string | null }).profile ? "Profile ready" : "Profile not added yet"}</p>
                        </div>
                        <form action={deleteTeam}><input type="hidden" name="team_id" value={team.id} /><button type="submit" className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-red-700">Delete</button></form>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Create Player</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Add player roster and optional initial stats.</p>
              <form action={createPlayer} className="mt-4 space-y-3">
                <label className="block text-sm font-semibold">Team
                  <select name="team_id" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]">
                    <option value="">Select team</option>{teams?.map((team) => (<option key={team.id} value={team.id}>{team.name}{team.short_name ? ` (${team.short_name})` : ""}</option>))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold">First Name<input name="first_name" type="text" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="John" /></label>
                  <label className="block text-sm font-semibold">Last Name<input name="last_name" type="text" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="Doe" /></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold">Shirt No.<input name="shirt_number" type="number" min="1" max="99" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" /></label>
                  <label className="block text-sm font-semibold">Position<input name="position" type="text" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" placeholder="Forward" /></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold">Goals<input name="goals" type="number" min="0" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" /></label>
                  <label className="block text-sm font-semibold">Assists<input name="assists" type="number" min="0" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]" /></label>
                </div>
                <button type="submit" className="w-full rounded-full bg-[var(--hl-gold)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-[var(--hl-red)] transition hover:bg-[#ddb251]">Save Player</button>
              </form>

              <div className="mt-6 border-t border-[var(--hl-red)]/10 pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--hl-muted)]">Recent Players</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {latestPlayers?.map((player) => {
                    const teamName = getTeamName(player.team as { name?: string } | { name?: string }[] | null);
                    return (
                      <li key={player.id} className="rounded-lg border border-[var(--hl-red)]/10 bg-white px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[var(--hl-ink)]">{player.first_name} {player.last_name}</p>
                            <p className="text-xs text-[var(--hl-muted)]">{teamName}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <form action={transferPlayer} className="flex items-center gap-2">
                              <input type="hidden" name="player_id" value={player.id} />
                              <select
                                name="to_team_id"
                                defaultValue={String(player.team_id)}
                                className="rounded-lg border border-[var(--hl-red)]/20 px-2 py-1 text-xs"
                              >
                                {teams?.map((team) => (
                                  <option key={`transfer-${player.id}-${team.id}`} value={team.id}>
                                    {team.name}
                                  </option>
                                ))}
                              </select>
                              <input
                                name="transfer_reason"
                                type="text"
                                className="w-36 rounded-lg border border-[var(--hl-red)]/20 px-2 py-1 text-xs"
                                placeholder="Why (optional)"
                              />
                              <button type="submit" className="rounded-full bg-[var(--hl-red)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">Transfer</button>
                            </form>
                            <form action={deletePlayer}><input type="hidden" name="player_id" value={player.id} /><button type="submit" className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-red-700">Delete</button></form>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {!transferHistoryError ? (
                <div className="mt-6 border-t border-[var(--hl-red)]/10 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--hl-muted)]">Transfer History</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {transferHistory?.map((entry) => {
                      const playerRelation = entry.player as
                        | { first_name?: string; last_name?: string }
                        | { first_name?: string; last_name?: string }[]
                        | null;
                      const fromRelation = entry.from_team as { name?: string } | { name?: string }[] | null;
                      const toRelation = entry.to_team as { name?: string } | { name?: string }[] | null;
                      const player = Array.isArray(playerRelation) ? playerRelation[0] : playerRelation;
                      const playerName = [player?.first_name ?? "", player?.last_name ?? ""].join(" ").trim() || "Unknown Player";
                      const fromTeam = getTeamName(fromRelation);
                      const toTeam = getTeamName(toRelation);

                      return (
                        <li key={entry.id} className="rounded-lg border border-[var(--hl-red)]/10 bg-white px-3 py-2">
                          <p className="font-semibold text-[var(--hl-ink)]">{playerName}: {fromTeam} to {toTeam}</p>
                          {entry.transfer_reason ? (
                            <p className="text-xs text-[var(--hl-muted)]">Why: {entry.transfer_reason}</p>
                          ) : null}
                          <p className="text-xs text-[var(--hl-muted)]">{new Date(entry.created_at).toLocaleString("en-GB")}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </article>
          </>
        ) : null}

        {activeSection === "media" ? (
          <>
            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Add Media Asset</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Store official links for photos, videos, and documents.</p>
              <form action={createMediaAsset} className="mt-4 space-y-3">
                <label className="block text-sm font-semibold">Title
                  <input name="title" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm" placeholder="Matchday 4 Team Photo" />
                </label>
                <label className="block text-sm font-semibold">Media URL
                  <input name="media_url" type="url" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm" placeholder="https://..." />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold">Type
                    <select name="media_type" defaultValue="image" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm">
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                      <option value="link">Link</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">Season
                    <select name="season_id" defaultValue={activeSeasonId ? String(activeSeasonId) : ""} className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm">
                      <option value="">Active Season</option>
                      {seasons?.map((season) => (
                        <option key={`media-season-${season.id}`} value={season.id}>
                          {season.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block text-sm font-semibold">Caption (optional)
                  <textarea name="caption" rows={3} className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm" placeholder="Short description for officials and media team." />
                </label>
                <button type="submit" className="w-full rounded-full bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white">Save Media</button>
              </form>
            </article>

            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Media Library</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Latest uploaded media references.</p>
              {mediaError ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Media Center will appear after running `supabase/season-fixture-media.sql`.</p>
              ) : null}
              <ul className="mt-4 space-y-3">
                {mediaAssets?.map((item) => {
                  const seasonRelation = item.season as { name?: string } | { name?: string }[] | null;
                  const seasonName = getTeamName(seasonRelation);
                  return (
                    <li key={item.id} className="rounded-xl border border-[var(--hl-red)]/10 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--hl-ink)]">{item.title}</p>
                          <p className="text-xs text-[var(--hl-muted)] uppercase">{item.media_type} · {seasonName}</p>
                          <a href={item.media_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[var(--hl-red)] underline">{item.media_url}</a>
                          {item.caption ? <p className="mt-1 text-xs text-[var(--hl-muted)]">{item.caption}</p> : null}
                        </div>
                        <form action={deleteMediaAsset}>
                          <input type="hidden" name="media_id" value={item.id} />
                          <button type="submit" className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-red-700">Delete</button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          </>
        ) : null}

        {activeSection === "access" ? (
          <>
            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Admin Access</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Grant or remove access without editing SQL manually.</p>
              {adminUsersError ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Role-based admin controls need `supabase/admin-enhancements.sql` to be executed.</p>
              ) : null}
              <form action={addAdminUser} className="mt-4 space-y-3">
                <label className="block text-sm font-semibold">User ID (UUID)<input name="user_id" required className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm" placeholder="00000000-0000-0000-0000-000000000000" /></label>
                <label className="block text-sm font-semibold">Role
                  <select name="role" defaultValue="match_official" className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm">
                    {roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </label>
                <button type="submit" className="w-full rounded-full bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white">Save Admin User</button>
              </form>

              <div className="mt-6 border-t border-[var(--hl-red)]/10 pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--hl-muted)]">Current Admin Users</p>
                <ul className="mt-2 space-y-2">
                  {adminUsers?.map((adminItem) => (
                    <li key={adminItem.user_id} className="rounded-lg border border-[var(--hl-red)]/10 bg-white p-3">
                      <p className="text-xs text-[var(--hl-muted)]">{adminItem.user_id}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <form action={updateAdminUserRole} className="flex items-center gap-2">
                          <input type="hidden" name="user_id" value={adminItem.user_id} />
                          <select name="role" defaultValue={(adminItem as { role?: string }).role ?? "match_official"} className="rounded-lg border border-[var(--hl-red)]/20 px-2 py-1 text-xs">
                            {roleOptions.map((role) => <option key={`${adminItem.user_id}-${role.value}`} value={role.value}>{role.label}</option>)}
                          </select>
                          <button type="submit" className="rounded-full bg-[var(--hl-red)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">Update Role</button>
                        </form>
                        {adminItem.user_id !== user.id ? (
                          <form action={removeAdminUser}>
                            <input type="hidden" name="user_id" value={adminItem.user_id} />
                            <button type="submit" className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-red-700">Remove</button>
                          </form>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--hl-muted)]">You</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <h2 className="text-xl font-black text-[var(--hl-red)]">Activity Log</h2>
              <p className="mt-1 text-sm text-[var(--hl-muted)]">Recent admin actions for accountability.</p>
              {activityError ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Run `supabase/admin-enhancements.sql` to enable activity logging.</p>
              ) : null}
              <ul className="mt-4 space-y-2 text-sm">
                {activityLogs?.map((log) => (
                  <li key={log.id} className="rounded-lg border border-[var(--hl-red)]/10 bg-white px-3 py-2">
                    <p className="font-semibold text-[var(--hl-ink)]">{log.action_type} {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ""}</p>
                    <p className="text-xs text-[var(--hl-muted)]">by {log.actor_user_id} · {new Date(log.created_at).toLocaleString("en-GB")}</p>
                  </li>
                ))}
              </ul>
            </article>
          </>
        ) : null}
      </section>
    </div>
  );
}

