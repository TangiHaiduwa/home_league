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
        <p className="fade-up delay-1 mt-2 text-[var(--hl-muted)]">Current standings in UNAM Home League</p>

        <section className="fade-up delay-2 mt-8 overflow-hidden rounded-3xl border border-[var(--hl-gold)]/35">
          <div className="grid grid-cols-[44px_1fr_70px_70px] bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.09em] text-[var(--hl-gold)]">
            <span>#</span>
            <span>Team</span>
            <span className="text-center">P</span>
            <span className="text-center">Pts</span>
          </div>
          {standings.map((row, index) => (
            <div
              key={row.team}
              className="grid grid-cols-[44px_1fr_70px_70px] items-center border-b border-[var(--hl-gold)]/25 bg-white px-4 py-4 text-sm last:border-b-0"
            >
              <span className="font-black text-[var(--hl-red)]">{index + 1}</span>
              <span className="flex items-center gap-2 font-semibold">
                <ClubCrest teamName={row.team} size="sm" />
                {row.team}
              </span>
              <span className="text-center font-bold text-[var(--hl-muted)]">{row.played}</span>
              <span className="text-center font-black text-[var(--hl-red)]">{row.points}</span>
            </div>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
