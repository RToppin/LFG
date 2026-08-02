"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { GameCover } from "@/components/GameCover";
import type { CatalogGameForSelector } from "@/lib/game-catalog";

export function DiscoverGameFilter({ games, selectedSlug }: { games: CatalogGameForSelector[]; selectedSlug?: string }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return games
      .filter((game) => !needle || [game.name, game.slug, ...game.aliases].some((value) => value.toLowerCase().includes(needle)))
      .sort((a, b) => (b._count?.posts ?? 0) - (a._count?.posts ?? 0) || a.name.localeCompare(b.name))
      .slice(0, 80);
  }, [games, query]);

  function chooseGame(event: React.MouseEvent<HTMLButtonElement>, slug: string) {
    const form = event.currentTarget.closest("form");
    const params = new URLSearchParams();
    if (form) {
      new FormData(form).forEach((value, key) => {
        if (typeof value === "string") params.set(key, value);
      });
    }
    if (slug) params.set("game", slug);
    else params.delete("game");
    for (const [key, value] of Array.from(params.entries())) {
      if (!value) params.delete(key);
    }
    window.location.href = `/discover${params.size ? `?${params.toString()}` : ""}`;
  }

  return (
    <div className="grid gap-3">
      <input name="game" type="hidden" value={selectedSlug ?? ""} />
      <label className="field">
        <span>Choose a game</span>
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
      <div className="grid max-h-[32rem] gap-2 overflow-y-auto rounded-lg border border-[var(--line)] p-2">
        <button
          className={`rounded-lg p-2 text-left text-sm hover:bg-[var(--panel-strong)] ${!selectedSlug ? "bg-[var(--panel-strong)]" : ""}`}
          onClick={(event) => chooseGame(event, "")}
          type="button"
        >
          <strong>All open groups</strong>
          <span className="ml-2 text-[var(--muted)]">{games.reduce((sum, game) => sum + (game._count?.posts ?? 0), 0)} active</span>
        </button>
        {results.map((game) => (
          <button
            className={`grid grid-cols-[4rem_1fr] items-center gap-3 rounded-lg p-2 text-left text-sm hover:bg-[var(--panel-strong)] ${selectedSlug === game.slug ? "bg-[var(--panel-strong)]" : ""}`}
            key={game.id}
            onClick={(event) => chooseGame(event, game.slug)}
            type="button"
          >
            <GameCover game={game} className="size-14 rounded-lg" imageSizes="56px" initialsClassName="text-sm" />
            <span className="min-w-0">
              <strong className="block truncate">{game.name}</strong>
              <span className="text-[var(--muted)]">{game._count?.posts ?? 0} active</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
