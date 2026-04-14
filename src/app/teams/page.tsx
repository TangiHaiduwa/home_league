import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ClubCrest } from "@/components/club-crest";
import { getTeamsData } from "@/lib/home-data";

export default async function TeamsPage() {
  const { teams, source } = await getTeamsData();
  if (source === "fallback") {
    console.warn("UNAM Home League: using fallback teams data.");
  }

  return (
    <div className="relative flex-1 overflow-x-hidden text-[var(--hl-ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(201,154,46,0.22),transparent_45%)]" />
      <SiteHeader />

      <main className="relative mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <h1 className="brand-display fade-up text-5xl text-[var(--hl-red)] md:text-6xl">Clubs</h1>
        <p className="fade-up delay-1 mt-2 text-[var(--hl-muted)]">
          Each club profile includes a banner, crest, season snapshot, and registered squad.
        </p>

        <section className="fade-up delay-2 mt-8 grid gap-5 lg:grid-cols-2">
          {teams.map((team) => (
            <article key={team.slug} className="overflow-hidden rounded-3xl border border-[var(--hl-red)]/15 bg-white shadow-[0_18px_48px_rgba(120,11,24,0.12)]">
              <div
                className="relative h-52 w-full bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(rgba(15, 14, 14, 0.2), rgba(15, 14, 14, 0.55)), url("${team.bannerImageUrl}")` }}
              >
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
                  <div className="flex items-center gap-3">
                    <ClubCrest teamName={team.name} imageUrl={team.crestImageUrl} size="lg" />
                    <div>
                      <h2 className="text-2xl font-black">{team.name}</h2>
                      <p className="text-sm text-white/80">{team.shortName ?? "Club Profile"}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-black uppercase tracking-[0.08em]">
                    {team.points} pts
                  </span>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <p className="text-sm leading-7 text-[var(--hl-muted)]">{team.profile}</p>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <article className="rounded-2xl bg-[var(--hl-red)]/6 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--hl-muted)]">Played</p>
                    <p className="text-lg font-black text-[var(--hl-red)]">{team.played}</p>
                  </article>
                  <article className="rounded-2xl bg-[var(--hl-red)]/6 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--hl-muted)]">GF</p>
                    <p className="text-lg font-black text-[var(--hl-red)]">{team.goalsFor}</p>
                  </article>
                  <article className="rounded-2xl bg-[var(--hl-red)]/6 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--hl-muted)]">GA</p>
                    <p className="text-lg font-black text-[var(--hl-red)]">{team.goalsAgainst}</p>
                  </article>
                  <article className="rounded-2xl bg-[var(--hl-red)]/6 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--hl-muted)]">Squad</p>
                    <p className="text-lg font-black text-[var(--hl-red)]">{team.rosterCount}</p>
                  </article>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--hl-muted)]">
                    Goal Difference: {team.goalDifference >= 0 ? `+${team.goalDifference}` : team.goalDifference}
                  </p>
                  <Link
                    href={`/teams/${team.slug}`}
                    className="rounded-full bg-[var(--hl-red)] px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-[var(--hl-red-dark)]"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
