import Link from "next/link";
import { notFound } from "next/navigation";
import { ClubCrest } from "@/components/club-crest";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getTeamProfileBySlug } from "@/lib/home-data";

type TeamProfilePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TeamProfilePage({ params }: TeamProfilePageProps) {
  const { slug } = await params;
  const { team, source } = await getTeamProfileBySlug(slug);

  if (!team) {
    notFound();
  }

  if (source === "fallback") {
    console.warn("UNAM Home League: using fallback team profile data.");
  }

  return (
    <div className="relative flex-1 overflow-x-hidden text-[var(--hl-ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(201,154,46,0.22),transparent_36%),radial-gradient(circle_at_100%_0%,rgba(159,16,32,0.18),transparent_34%)]" />
      <SiteHeader />

      <main className="relative mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <Link href="/teams" className="fade-up inline-flex text-sm font-bold uppercase tracking-[0.08em] text-[var(--hl-red)]">
          Back To Clubs
        </Link>

        <section className="fade-up delay-1 mt-5 overflow-hidden rounded-[2rem] border border-[var(--hl-red)]/15 bg-white shadow-[0_24px_60px_rgba(120,11,24,0.14)]">
          <div
            className="relative min-h-[340px] bg-cover bg-center px-6 py-8 text-white md:min-h-[420px] md:px-8 md:py-10"
            style={{ backgroundImage: `linear-gradient(rgba(15, 14, 14, 0.28), rgba(15, 14, 14, 0.62)), url("${team.bannerImageUrl}")` }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.18),transparent_30%)]" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <ClubCrest teamName={team.name} imageUrl={team.crestImageUrl} size="lg" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">{team.shortName ?? "Club"}</p>
                    <h1 className="brand-display text-5xl leading-[0.92] md:text-6xl">{team.name}</h1>
                  </div>
                </div>
                <span className="rounded-full border border-white/30 bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.12em]">
                  Registered Squad
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <p className="max-w-3xl text-sm leading-7 text-white/88 md:text-base">{team.profile}</p>
                <div className="grid grid-cols-2 gap-3">
                  <article className="rounded-2xl border border-white/20 bg-black/20 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">Points</p>
                    <p className="brand-display mt-1 text-3xl text-[var(--hl-gold)]">{team.points}</p>
                  </article>
                  <article className="rounded-2xl border border-white/20 bg-black/20 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">Played</p>
                    <p className="brand-display mt-1 text-3xl text-[var(--hl-gold)]">{team.played}</p>
                  </article>
                  <article className="rounded-2xl border border-white/20 bg-black/20 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">Goals For</p>
                    <p className="brand-display mt-1 text-3xl text-[var(--hl-gold)]">{team.goalsFor}</p>
                  </article>
                  <article className="rounded-2xl border border-white/20 bg-black/20 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">Goals Against</p>
                    <p className="brand-display mt-1 text-3xl text-[var(--hl-gold)]">{team.goalsAgainst}</p>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fade-up delay-2 mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="glass-card rounded-3xl border border-[var(--hl-red)]/15 p-6">
            <h2 className="brand-display text-3xl text-[var(--hl-red)]">Season Snapshot</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <article className="rounded-2xl bg-[var(--hl-red)]/6 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--hl-muted)]">Goal Difference</p>
                <p className="mt-1 text-2xl font-black text-[var(--hl-red)]">
                  {team.goalDifference >= 0 ? `+${team.goalDifference}` : team.goalDifference}
                </p>
              </article>
              <article className="rounded-2xl bg-[var(--hl-red)]/6 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--hl-muted)]">Roster Size</p>
                <p className="mt-1 text-2xl font-black text-[var(--hl-red)]">{team.rosterCount}</p>
              </article>
              <article className="rounded-2xl bg-[var(--hl-red)]/6 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--hl-muted)]">Attack Output</p>
                <p className="mt-1 text-2xl font-black text-[var(--hl-red)]">{team.goalsFor}</p>
              </article>
              <article className="rounded-2xl bg-[var(--hl-red)]/6 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--hl-muted)]">Goals Conceded</p>
                <p className="mt-1 text-2xl font-black text-[var(--hl-red)]">{team.goalsAgainst}</p>
              </article>
            </div>
          </article>

          <article className="glass-card rounded-3xl border border-[var(--hl-red)]/15 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="brand-display text-3xl text-[var(--hl-red)]">Registered Players</h2>
              <span className="rounded-full bg-[var(--hl-gold)]/25 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[var(--hl-red)]">
                {team.rosterCount} Players
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {team.players.length ? (
                team.players.map((player) => (
                  <article
                    key={player.id ?? player.fullName}
                    className="grid gap-3 rounded-2xl border border-[var(--hl-red)]/10 bg-white px-4 py-4 sm:grid-cols-[1fr_auto_auto]"
                  >
                    <div>
                      <h3 className="text-lg font-black text-[var(--hl-ink)]">{player.fullName}</h3>
                      <p className="text-sm text-[var(--hl-muted)]">
                        {player.position ?? "Squad Player"}
                        {player.shirtNumber ? ` • No. ${player.shirtNumber}` : ""}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--hl-red)]/6 px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--hl-muted)]">Goals</p>
                      <p className="text-xl font-black text-[var(--hl-red)]">{player.goals}</p>
                    </div>
                    <div className="rounded-2xl bg-[var(--hl-red)]/6 px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--hl-muted)]">Assists</p>
                      <p className="text-xl font-black text-[var(--hl-red)]">{player.assists}</p>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-[var(--hl-red)]/20 bg-white px-4 py-5 text-sm text-[var(--hl-muted)]">
                  No registered players have been added to this club yet.
                </p>
              )}
            </div>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
