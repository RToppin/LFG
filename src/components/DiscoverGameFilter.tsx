"use client";

import { useMemo, useState } from "react";
import type { CatalogGameForSelector } from "@/lib/game-catalog";

export function DiscoverGameFilter({ games, selectedSlug }: { games: CatalogGameForSelector[]; selectedSlug?: string }) {
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState(selectedSlug ?? "");
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return games
      .filter((game) => !needle || [game.name, game.slug, ...game.aliases].some((value) => value.toLowerCase().includes(needle)))
      .slice(0, 60);
  }, [games, query]);
  return (
    <div className="grid gap-2">
      <input name="game" type="hidden" value={slug} />
      <input
        aria-label="Search game filter"
        className="input w-64"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter by approved game"
        value={query}
      />
      <div className="grid max-h-48 gap-1 overflow-y-auto rounded-lg border border-[var(--line)] p-2">
        <button className="rounded-lg p-2 text-left text-sm hover:bg-[var(--panel-strong)]" onClick={() => setSlug("")} type="button">
          Any approved game
        </button>
        {results.map((game) => (
          <button
            className={`rounded-lg p-2 text-left text-sm hover:bg-[var(--panel-strong)] ${slug === game.slug ? "bg-[var(--panel-strong)]" : ""}`}
            key={game.id}
            onClick={() => setSlug(game.slug)}
            type="button"
          >
            <strong>{game.name}</strong>
            <span className="ml-2 text-[var(--muted)]">{game._count?.posts ?? 0} active</span>
          </button>
        ))}
      </div>
    </div>
  );
}
