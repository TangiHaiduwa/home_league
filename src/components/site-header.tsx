"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/table", label: "Standings" },
  { href: "/scorers", label: "Top Scorers" },
  { href: "/teams", label: "Teams" },
  { href: "/news", label: "News" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const lastTouchToggleRef = useRef(0);

  const toggleMenu = () => setMenuOpen((value) => !value);

  const handleTouchToggle = (event: React.TouchEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    lastTouchToggleRef.current = Date.now();
    toggleMenu();
  };

  const handleClickToggle = () => {
    if (Date.now() - lastTouchToggleRef.current < 700) return;
    toggleMenu();
  };

  return (
    <header className="relative z-40 border-b border-[var(--hl-red)]/15">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-4 md:justify-between md:px-8">
        <button
          type="button"
          className="fade-up delay-2 relative z-30 inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full border border-[var(--hl-red)]/25 bg-white text-[var(--hl-red)] shadow-[0_6px_20px_rgba(120,11,24,0.18)] md:hidden"
          onClick={handleClickToggle}
          onTouchEnd={handleTouchToggle}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          <span className="text-lg leading-none">{menuOpen ? "x" : "|||"}</span>
        </button>
        <div className="fade-up min-w-0 flex-1 md:flex-none md:pl-0">
          <Link className="brand-display text-3xl leading-none text-[var(--hl-red)] md:text-4xl" href="/">
            UNAM Home League
          </Link>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--hl-muted)]">Home League</p>
        </div>
        <ul className="fade-up delay-1 hidden gap-7 text-sm font-semibold text-[var(--hl-ink)] md:flex">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
        <Link
          className="fade-up delay-2 hidden rounded-full bg-[var(--hl-red)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--hl-red-dark)] md:inline-block"
          href="/fixtures"
        >
          Match Center
        </Link>
      </nav>
      {menuOpen ? (
        <div className="relative z-20 mx-5 mb-4 rounded-2xl border border-[var(--hl-red)]/20 bg-white/95 p-4 shadow-[0_14px_40px_rgba(120,11,24,0.18)] md:hidden">
          <ul className="space-y-1 text-sm font-semibold text-[var(--hl-ink)]">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link className="block rounded-lg px-3 py-2 hover:bg-[var(--hl-gold)]/20" href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            className="mt-3 block rounded-full bg-[var(--hl-red)] px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-[var(--hl-red-dark)]"
            href="/fixtures"
            onClick={() => setMenuOpen(false)}
          >
            Match Center
          </Link>
        </div>
      ) : null}
    </header>
  );
}
