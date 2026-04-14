import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getNewsData } from "@/lib/home-data";

export default async function NewsPage() {
  const { news, source } = await getNewsData();
  if (source === "fallback") {
    console.warn("UNAM Home League: using fallback news data.");
  }

  return (
    <div className="relative flex-1 overflow-x-hidden text-[var(--hl-ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(159,16,32,0.14),transparent_38%)]" />
      <SiteHeader />

      <main className="relative mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <h1 className="brand-display fade-up text-5xl text-[var(--hl-red)] md:text-6xl">News</h1>
        <p className="fade-up delay-1 mt-2 text-[var(--hl-muted)]">Latest stories from UNAM Home League</p>

        <section className="fade-up delay-2 mt-8 space-y-4">
          {news.map((item) => (
            <article key={`${item.title}-${item.date}`} className="glass-card rounded-3xl border border-[var(--hl-red)]/20 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--hl-muted)]">{item.date}</p>
              <h2 className="mt-2 text-2xl font-black text-[var(--hl-red)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--hl-muted)]">{item.snippet}</p>
            </article>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
