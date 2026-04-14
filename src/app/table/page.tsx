import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ClubCrest } from "@/components/club-crest";
import { getStandingsData } from "@/lib/home-data";

export default async function TablePage() {
  const { standings, source } = await getStandingsData();
  if (source === "fallback") {
    console.warn("UNAM Home League: using fallback standings data.");
  }

  return (
    <div className="relative flex-1 overflow-x-hidden text-[var(--hl-ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_20%,rgba(159,16,32,0.13),transparent_42%)]" />
      <SiteHeader />

      <main className="relative mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <h1 className="brand-display fade-up text-5xl text-[var(--hl-red)] md:text-6xl">League Table</h1>
        <p className="fade-up delay-1 mt-2 text-[var(--hl-muted)]">
          Current standings in UNAM Home League with goals for, goals against, and goal difference.
        </p>

        <section className="fade-up delay-2 mt-8 overflow-x-auto rounded-3xl border border-[var(--hl-gold)]/35">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[44px_1.5fr_70px_70px_70px_70px_70px] bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.09em] text-[var(--hl-gold)]">
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
                  className={`grid grid-cols-[44px_1.5fr_70px_70px_70px_70px_70px] items-center border-b px-4 py-4 text-sm last:border-b-0 ${
                    inDanger ? "border-[var(--hl-red)]/40 bg-[var(--hl-red)]/6" : "border-[var(--hl-gold)]/25 bg-white"
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
        </section>

        <p className="mt-3 text-xs font-medium text-[var(--hl-muted)]">
          The club currently bottom of the table is underlined in red to mark the relegation danger spot.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
