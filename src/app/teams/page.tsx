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
        <h1 className="brand-display fade-up text-5xl text-[var(--hl-red)] md:text-6xl">Teams</h1>
        <p className="fade-up delay-1 mt-2 text-[var(--hl-muted)]">Clubs competing in UNAM Home League</p>

        <section className="fade-up delay-2 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <article key={team.name} className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-5">
              <div className="flex items-center gap-3">
                <ClubCrest teamName={team.name} />
                <h2 className="text-xl font-black text-[var(--hl-red)]">{team.name}</h2>
              </div>
              <p className="mt-2 text-sm text-[var(--hl-muted)]">Played: {team.played}</p>
              <p className="text-sm font-bold text-[var(--hl-ink)]">Points: {team.points}</p>
            </article>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
