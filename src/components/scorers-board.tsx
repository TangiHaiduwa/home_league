"use client";

import { useState } from "react";
import { ClubCrest } from "@/components/club-crest";
import type { Scorer } from "@/lib/home-data";

type ScorersBoardProps = {
  scorers: Scorer[];
  compact?: boolean;
};

type ScorerProfile = Scorer & {
  position: string;
  matches: number;
  bio: string;
};

function enrichProfile(scorer: Scorer): ScorerProfile {
  const positions = ["Forward", "Striker", "Winger", "Attacking Midfielder"];
  const seed = (scorer.player.length + scorer.team.length + scorer.goals) % positions.length;

  return {
    ...scorer,
    position: positions[seed],
    matches: scorer.goals + 4 + seed,
    bio: `${scorer.player} has become one of ${scorer.team}'s key attacking threats this season.`,
  };
}

export function ScorersBoard({ scorers, compact = false }: ScorersBoardProps) {
  const [active, setActive] = useState<ScorerProfile | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-[var(--hl-gold)]/35">
        <div className={`grid ${compact ? "grid-cols-[40px_1fr_58px]" : "grid-cols-[44px_1fr_1fr_70px]"} bg-[var(--hl-red)] px-4 py-3 text-sm font-black uppercase tracking-[0.09em] text-[var(--hl-gold)]`}>
          <span>#</span>
          <span>Player</span>
          {compact ? null : <span>Team</span>}
          <span className="text-center">Goals</span>
        </div>
        {scorers.map((row, index) => (
          <button
            key={`${row.player}-${row.team}`}
            type="button"
            className={`grid w-full ${compact ? "grid-cols-[40px_1fr_58px]" : "grid-cols-[44px_1fr_1fr_70px]"} items-center border-b border-[var(--hl-gold)]/25 bg-white px-4 py-4 text-left text-sm transition hover:bg-[var(--hl-gold)]/10 last:border-b-0`}
            onClick={() => setActive(enrichProfile(row))}
          >
            <span className="font-black text-[var(--hl-red)]">{index + 1}</span>
            <span className="flex items-center gap-3 font-semibold">
              <ClubCrest teamName={row.team} size="sm" />
              <span>{row.player}</span>
            </span>
            {compact ? null : <span className="text-[var(--hl-muted)]">{row.team}</span>}
            <span className="text-center font-black text-[var(--hl-red)]">{row.goals}</span>
          </button>
        ))}
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl bg-[var(--hl-white)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <ClubCrest teamName={active.team} size="lg" />
                <div>
                  <h3 className="text-2xl font-black text-[var(--hl-red)]">{active.player}</h3>
                  <p className="text-sm text-[var(--hl-muted)]">{active.team}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-full border border-[var(--hl-red)]/25 px-3 py-1 text-sm font-bold text-[var(--hl-red)]"
              >
                Close
              </button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <article className="rounded-xl bg-[var(--hl-red)]/8 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--hl-muted)]">Goals</p>
                <p className="text-xl font-black text-[var(--hl-red)]">{active.goals}</p>
              </article>
              <article className="rounded-xl bg-[var(--hl-red)]/8 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--hl-muted)]">Matches</p>
                <p className="text-xl font-black text-[var(--hl-red)]">{active.matches}</p>
              </article>
              <article className="rounded-xl bg-[var(--hl-red)]/8 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--hl-muted)]">Position</p>
                <p className="text-sm font-black text-[var(--hl-red)]">{active.position}</p>
              </article>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--hl-muted)]">{active.bio}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
