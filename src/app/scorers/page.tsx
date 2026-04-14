import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ScorersBoard } from "@/components/scorers-board";
import { getScorersData } from "@/lib/home-data";

export default async function ScorersPage() {
  const { scorers, source } = await getScorersData();
  if (source === "fallback") {
    console.warn("UNAM Home League: using fallback scorers data.");
  }

  return (
    <div className="relative flex-1 overflow-x-hidden text-[var(--hl-ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(201,154,46,0.24),transparent_40%)]" />
      <SiteHeader />

      <main className="relative mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <h1 className="brand-display fade-up text-5xl text-[var(--hl-red)] md:text-6xl">Top Scorers</h1>
        <p className="fade-up delay-1 mt-2 text-[var(--hl-muted)]">Golden Boot race - click a player for profile details</p>

        <section className="fade-up delay-2 mt-8">
          <ScorersBoard scorers={scorers} />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
