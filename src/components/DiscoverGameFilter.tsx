"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { GameCover } from "@/components/GameCover";
import type { CatalogGameForSelector } from "@/lib/game-catalog";

export function DiscoverGameFilter({ games, selectedSlugs }: { games: CatalogGameForSelector[]; selectedSlugs: string[] }) {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(selectedSlugs), [selectedSlugs]);
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return games
      .filter((game) => !needle || [game.name, game.slug, ...game.aliases].some((value) => value.toLowerCase().includes(needle)))
      .sort((a, b) => Number(selected.has(b.slug)) - Number(selected.has(a.slug)) || (b._count?.posts ?? 0) - (a._count?.posts ?? 0) || a.name.localeCompare(b.name))
      .slice(0, 80);
  }, [games, query, selected]);

  function chooseGame(event: React.MouseEvent<HTMLButtonElement>, slug: string) {
    const form = event.currentTarget.closest("form");
    const params = new URLSearchParams();
    if (form) {
      new FormData(form).forEach((value, key) => {
        if (typeof value === "string" && key !== "game" && value.trim()) params.append(key, value.trim());
      });
    }
    if (slug) {
      const next = new Set(selectedSlugs);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      for (const value of next) params.append("game", value);
    }
    window.location.href = `/discover${params.size ? `?${params.toString()}` : ""}`;
  }

  return (
    <div className="grid gap-3">
      {selectedSlugs.map((slug) => <input key={slug} name="game" type="hidden" value={slug} />)}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="field min-w-[min(100%,22rem)] flex-1">
          <span>Filter games</span>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[var(--muted)]" size={16} aria-hidden />
            <input
              aria-label="Search games"
              className="input pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search games"
              value={query}
            />
          </div>
        </label>
        <button className={`btn secondary ${selectedSlugs.length ? "" : "ring-1 ring-[rgba(45,212,191,0.45)]"}`} onClick={(event) => chooseGame(event, "")} type="button">
          All games
        </button>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {results.map((game) => {
          const active = selected.has(game.slug);
          return (
            <button
              className={`min-w-[13.5rem] overflow-hidden rounded-lg border text-left transition ${active ? "border-[var(--accent)] bg-[rgba(45,212,191,0.12)]" : "border-[var(--line)] bg-[var(--panel)] hover:border-[var(--accent)]"}`}
              key={game.id}
              onClick={(event) => chooseGame(event, game.slug)}
              type="button"
            >
              <GameCover game={game} className="h-20" imageSizes="216px" initialsClassName="text-lg" />
              <span className="block min-w-0 p-3">
                <strong className="block truncate text-sm">{game.name}</strong>
                <span className="text-xs text-[var(--muted)]">{game._count?.posts ?? 0} active</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
