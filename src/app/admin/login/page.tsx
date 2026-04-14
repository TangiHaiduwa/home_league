import Link from "next/link";
import { loginAdmin } from "@/app/admin/actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(159,16,32,0.12),transparent_46%)]" />
      <main className="glass-card relative w-full max-w-md rounded-3xl border border-[var(--hl-red)]/20 p-7 shadow-[0_18px_50px_rgba(120,11,24,0.16)]">
        <p className="brand-display text-4xl text-[var(--hl-red)]">Admin Login</p>
        <p className="mt-2 text-sm text-[var(--hl-muted)]">Sign in with your admin account credentials.</p>
        {error ? (
          <p className="mt-4 rounded-xl border border-[var(--hl-red)]/20 bg-[var(--hl-red)]/8 px-3 py-2 text-sm text-[var(--hl-red)]">
            {error}
          </p>
        ) : null}
        <form action={loginAdmin} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-[var(--hl-ink)]">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
              placeholder="admin@unamleague.com"
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--hl-ink)]">
            Password
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-[var(--hl-red)]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--hl-red)]"
              placeholder="********"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[var(--hl-red-dark)]"
          >
            Sign In
          </button>
        </form>
        <Link href="/" className="mt-4 block text-center text-xs font-bold uppercase tracking-[0.08em] text-[var(--hl-red)]">
          Back To Site
        </Link>
      </main>
    </div>
  );
}
