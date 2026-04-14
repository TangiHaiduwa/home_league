import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ScorersBoard } from "@/components/scorers-board";
import { getScorersData, sortScorersByMetric } from "@/lib/home-data";

export default async function ScorersPage() {
  const { scorers, source } = await getScorersData();
  const topScorers = sortScorersByMetric(scorers, "goals");
  const topAssists = sortScorersByMetric(scorers, "assists");

  if (source === "fallback") {
    console.warn("UNAM Home League: using fallback scorers data.");
  }

  return (
    <div className="relative flex-1 overflow-x-hidden text-[var(--hl-ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(201,154,46,0.24),transparent_40%)]" />
      <SiteHeader />

      <main className="relative mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <h1 className="brand-display fade-up text-5xl text-[var(--hl-red)] md:text-6xl">Top Scorers & Assists</h1>
        <p className="fade-up delay-1 mt-2 text-[var(--hl-muted)]">
          Golden Boot and playmaker race. Click a player for profile details.
        </p>

        <section className="fade-up delay-2 mt-8 grid gap-6 lg:grid-cols-2">
          <article className="glass-card rounded-3xl border border-[var(--hl-red)]/15 p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="brand-display text-3xl text-[var(--hl-red)]">Goals</h2>
              <span className="rounded-full bg-[var(--hl-gold)]/25 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[var(--hl-red)]">
                Golden Boot
              </span>
            </div>
            <ScorersBoard scorers={topScorers} metric="goals" />
          </article>

          <article className="glass-card rounded-3xl border border-[var(--hl-red)]/15 p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="brand-display text-3xl text-[var(--hl-red)]">Assists</h2>
              <span className="rounded-full bg-[var(--hl-gold)]/25 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[var(--hl-red)]">
                Chance Makers
              </span>
            </div>
            <ScorersBoard scorers={topAssists} metric="assists" />
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
