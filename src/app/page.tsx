import { getHomeData, sortScorersByMetric } from "@/lib/home-data";
import { ClubCrest } from "@/components/club-crest";
import { ScorersBoard } from "@/components/scorers-board";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import Link from "next/link";

export default async function Home() {
  const { fixtures, standings, news, scorers, source } = await getHomeData();
  const getStatusLabel = (status: string, liveMinute: number | null) => {
    if (status === "live") return `LIVE ${liveMinute ?? 0}'`;
    if (status === "finished") return "FULL TIME";
    if (status === "postponed") return "POSTPONED";
    if (status === "cancelled") return "CANCELLED";
    if (status === "abandoned") return "ABANDONED";
    return "SCHEDULED";
  };

  const featuredFixture = fixtures.find((fixture) => fixture.status === "live") ?? fixtures[0];
  const hasFeaturedScore =
    featuredFixture && featuredFixture.homeScore !== null && featuredFixture.awayScore !== null;
  const featuredStatusText = featuredFixture
    ? featuredFixture.status === "scheduled"
      ? featuredFixture.date
      : getStatusLabel(featuredFixture.status, featuredFixture.liveMinute)
    : "Fri 18 Apr";

  const topScorers = sortScorersByMetric(scorers, "goals").slice(0, 5);
  const topAssists = sortScorersByMetric(scorers, "assists").slice(0, 5);
  const goalsThisSeason = standings.reduce((total, row) => total + row.goalsFor, 0);

  if (source === "fallback") {
    console.warn("UNAM Home League: using fallback homepage data. Run the latest Supabase SQL files to enable live data.");
  }

  return (
    <div className="relative flex-1 overflow-x-hidden text-[var(--hl-ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(159,16,32,0.12),transparent_48%),radial-gradient(circle_at_0%_70%,rgba(201,154,46,0.2),transparent_40%)]" />

      <SiteHeader />

      <main className="relative mx-auto w-full max-w-6xl space-y-14 px-5 py-10 md:px-8 md:py-14">
        <section className="fade-up grid gap-4 sm:grid-cols-3">
          <article className="glass-card rounded-2xl border border-[var(--hl-red)]/15 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--hl-muted)]">Matchweek</p>
            <p className="brand-display text-4xl text-[var(--hl-red)]">03</p>
          </article>
          <article className="glass-card rounded-2xl border border-[var(--hl-red)]/15 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--hl-muted)]">Teams</p>
            <p className="brand-display text-4xl text-[var(--hl-red)]">{standings.length || 12}</p>
          </article>
          <article className="glass-card rounded-2xl border border-[var(--hl-red)]/15 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--hl-muted)]">Goals This Season</p>
            <p className="brand-display text-4xl text-[var(--hl-red)]">{goalsThisSeason || 89}</p>
          </article>
        </section>

        <section className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="fade-up space-y-5">
            <h1 className="brand-display text-5xl leading-[0.9] text-[var(--hl-red)] md:text-7xl">
              UNAM Home League
              <br />
              Matchday Hub.
            </h1>
            <p className="max-w-xl text-base leading-7 text-[var(--hl-muted)] md:text-lg">
              Follow every matchday with official fixtures, live scores, results, league standings, player stats, and
              verified announcements.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-[var(--hl-red)] px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-white transition hover:bg-[var(--hl-red-dark)]"
                href="/fixtures"
              >
                View Fixtures
              </Link>
              <Link
                className="rounded-full border border-[var(--hl-gold)] bg-white px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--hl-red)] transition hover:bg-[var(--hl-gold)]/15"
                href="/table"
              >
                League Table
              </Link>
            </div>

            <article className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-5 shadow-[0_18px_50px_rgba(120,11,24,0.16)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--hl-muted)]">Featured Match</p>
                <p className="rounded-full bg-[var(--hl-red)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-white">
                  {featuredStatusText}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex flex-col items-center gap-2 text-center">
                  <ClubCrest teamName={featuredFixture?.home ?? "Engineering FC"} size="lg" />
                  <p className="text-sm font-black text-[var(--hl-ink)]">{featuredFixture?.home ?? "Engineering FC"}</p>
                </div>
                <div className="text-center">
                  <p className="brand-display text-5xl leading-none text-[var(--hl-red)]">
                    {hasFeaturedScore ? `${featuredFixture.homeScore}-${featuredFixture.awayScore}` : "vs"}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--hl-muted)]">
                    {featuredStatusText}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <ClubCrest teamName={featuredFixture?.away ?? "Law Legends"} size="lg" />
                  <p className="text-sm font-black text-[var(--hl-ink)]">{featuredFixture?.away ?? "Law Legends"}</p>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-[var(--hl-muted)]">{featuredFixture?.venue ?? "UNAM Main Pitch"}</p>
            </article>
          </div>

          <div className="fade-up delay-1 glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6 shadow-[0_18px_50px_rgba(120,11,24,0.16)] md:p-7">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-[var(--hl-red)]">Next Matchday</p>
            <div className="mt-4 space-y-4">
              {fixtures.map((fixture) => (
                <article key={`${fixture.home}-${fixture.away}`} className="rounded-2xl border border-[var(--hl-gold)]/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--hl-muted)]">{fixture.date}</p>
                    <span className="rounded-full bg-[var(--hl-red)]/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.09em] text-[var(--hl-red)]">
                      {fixture.status === "scheduled" ? "Scheduled" : getStatusLabel(fixture.status, fixture.liveMinute)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ClubCrest teamName={fixture.home} size="sm" />
                      <p className="text-sm font-black text-[var(--hl-ink)]">{fixture.home}</p>
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.08em] text-[var(--hl-red)]">vs</span>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-[var(--hl-ink)]">{fixture.away}</p>
                      <ClubCrest teamName={fixture.away} size="sm" />
                    </div>
                  </div>
                  {fixture.homeScore !== null && fixture.awayScore !== null ? (
                    <p className="mt-1 text-center text-sm font-black text-[var(--hl-red)]">
                      {fixture.homeScore} - {fixture.awayScore}
                    </p>
                  ) : null}
                  {fixture.statusNote ? <p className="mt-1 text-xs text-[var(--hl-muted)]">{fixture.statusNote}</p> : null}
                  <p className="text-sm text-[var(--hl-muted)]">{fixture.venue}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="fade-up delay-2 glass-card rounded-3xl border border-[var(--hl-red)]/15 p-6 md:p-7">
            <div className="flex items-center justify-between">
              <h2 className="brand-display text-3xl text-[var(--hl-red)]">Standings Preview</h2>
              <span className="rounded-full bg-[var(--hl-gold)]/25 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[var(--hl-red)]">
                Week 3
              </span>
            </div>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--hl-gold)]/30">
              <div className="min-w-[620px]">
                <div className="grid grid-cols-[44px_1.4fr_50px_58px_58px_58px_62px] bg-[var(--hl-red)] px-4 py-3 text-xs font-black uppercase tracking-[0.09em] text-[var(--hl-gold)]">
                  <span>#</span>
                  <span>Team</span>
                  <span className="text-center">P</span>
                  <span className="text-center">GF</span>
                  <span className="text-center">GA</span>
                  <span className="text-center">GD</span>
                  <span className="text-center">Pts</span>
                </div>
                {standings.map((row, index) => {
                  const inDanger = index === standings.length - 1;

                  return (
                    <div
                      key={row.team}
                      className={`grid grid-cols-[44px_1.4fr_50px_58px_58px_58px_62px] items-center border-b px-4 py-3 text-sm last:border-b-0 ${
                        inDanger
                          ? "border-[var(--hl-red)]/40 bg-[var(--hl-red)]/6"
                          : "border-[var(--hl-gold)]/25 bg-white"
                      }`}
                    >
                      <span className="font-black text-[var(--hl-red)]">{index + 1}</span>
                      <Link
                        href={`/teams/${row.slug}`}
                        className={`flex items-center gap-2 font-semibold ${inDanger ? "underline decoration-2 underline-offset-4 decoration-red-500" : ""}`}
                      >
                        <ClubCrest teamName={row.team} imageUrl={row.crestImageUrl} size="sm" />
                        {row.team}
                      </Link>
                      <span className="text-center font-bold text-[var(--hl-muted)]">{row.played}</span>
                      <span className="text-center font-bold text-[var(--hl-muted)]">{row.goalsFor}</span>
                      <span className="text-center font-bold text-[var(--hl-muted)]">{row.goalsAgainst}</span>
                      <span className="text-center font-bold text-[var(--hl-muted)]">{row.goalDifference}</span>
                      <span className="text-center font-black text-[var(--hl-red)]">{row.points}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-[var(--hl-muted)]">
              P = Played, GF = Goals For, GA = Goals Against, GD = Goal Difference
            </p>
          </div>

          <div className="fade-up delay-3 glass-card rounded-3xl border border-[var(--hl-red)]/15 p-6 md:p-7">
            <div className="flex items-center justify-between">
              <h2 className="brand-display text-3xl text-[var(--hl-red)]">League Updates</h2>
              <Link className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--hl-red)]" href="/news">
                All News
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {news.map((item) => (
                <article key={item.title} className="overflow-hidden rounded-2xl border border-[var(--hl-gold)]/35 bg-white">
                  <div
                    className="h-36 w-full bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(rgba(20, 13, 13, 0.08), rgba(20, 13, 13, 0.28)), url("${item.imageUrl}")` }}
                  />
                  <div className="px-4 py-4">
                    <h3 className="text-base font-black text-[var(--hl-ink)]">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--hl-muted)]">{item.snippet}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="fade-up delay-3 glass-card rounded-3xl border border-[var(--hl-red)]/15 p-6 md:p-7">
            <div className="flex items-center justify-between">
              <h2 className="brand-display text-3xl text-[var(--hl-red)]">Top Attackers</h2>
              <Link className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--hl-red)]" href="/scorers">
                Full List
              </Link>
            </div>
            <div className="mt-4 space-y-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--hl-muted)]">Goals</p>
                <ScorersBoard scorers={topScorers} compact metric="goals" />
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--hl-muted)]">Assists</p>
                <ScorersBoard scorers={topAssists} compact metric="assists" />
              </div>
            </div>
          </div>
        </section>

        <section className="fade-up delay-3 rounded-3xl bg-[var(--hl-red)] px-6 py-8 text-white shadow-[0_20px_60px_rgba(120,11,24,0.35)] md:px-10">
          <h2 className="brand-display text-4xl leading-[0.95] text-[var(--hl-gold)] md:text-5xl">
            Official Home Of
            <br />
            UNAM Home League
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
            This is the league&apos;s official website for public updates, match information, competition records, and
            club profiles.
          </p>
          <Link
            className="mt-5 inline-block rounded-full bg-[var(--hl-gold)] px-6 py-3 text-sm font-black uppercase tracking-[0.1em] text-[var(--hl-red)] transition hover:bg-[#ddb251]"
            href="/teams"
          >
            Explore Clubs
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
