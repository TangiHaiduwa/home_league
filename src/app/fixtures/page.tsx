import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ClubCrest } from "@/components/club-crest";
import { getFixturesData } from "@/lib/home-data";

export default async function FixturesPage() {
  const { fixtures, source } = await getFixturesData();
  if (source === "fallback") {
    console.warn("UNAM Home League: using fallback fixtures data.");
  }

  return (
    <div className="relative flex-1 overflow-x-hidden text-[var(--hl-ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(201,154,46,0.25),transparent_45%)]" />
      <SiteHeader />

      <main className="relative mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <h1 className="brand-display fade-up text-5xl text-[var(--hl-red)] md:text-6xl">Fixtures</h1>
        <p className="fade-up delay-1 mt-2 text-[var(--hl-muted)]">Matches, live scores and completed results</p>

        <section className="fade-up delay-2 mt-8 grid gap-4 md:grid-cols-2">
          {fixtures.map((fixture) => (
            <article
              key={`${fixture.home}-${fixture.away}-${fixture.date}`}
              className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.11em] text-[var(--hl-muted)]">{fixture.date}</p>
                <span className="rounded-full bg-[var(--hl-red)]/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.09em] text-[var(--hl-red)]">
                  {fixture.status === "live" ? `LIVE ${fixture.liveMinute ?? 0}'` : fixture.status === "finished" ? "FT" : "Scheduled"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex items-center gap-2">
                  <ClubCrest teamName={fixture.home} />
                  <h2 className="text-base font-black text-[var(--hl-ink)]">{fixture.home}</h2>
                </div>
                <span className="text-xs font-black uppercase tracking-[0.1em] text-[var(--hl-red)]">vs</span>
                <div className="flex items-center justify-end gap-2">
                  <h2 className="text-base font-black text-[var(--hl-ink)]">{fixture.away}</h2>
                  <ClubCrest teamName={fixture.away} />
                </div>
              </div>
              {fixture.homeScore !== null && fixture.awayScore !== null ? (
                <p className="mt-2 text-center text-lg font-black text-[var(--hl-red)]">
                  {fixture.homeScore} - {fixture.awayScore}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-[var(--hl-muted)]">{fixture.venue}</p>
            </article>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
