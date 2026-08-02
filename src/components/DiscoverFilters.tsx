"use client";

import { Search } from "lucide-react";
import { GameCover } from "@/components/GameCover";
import type { CatalogGameForSelector } from "@/lib/game-catalog";

type PlatformOption = { value: string; label: string };

type DiscoverFiltersProps = {
  games: CatalogGameForSelector[];
  selectedSlugs: string[];
  q?: string;
  platform?: string;
  sort?: string;
  platforms: PlatformOption[];
};

export function DiscoverFilters({ games, selectedSlugs, q, platform, sort, platforms }: DiscoverFiltersProps) {
  const selected = new Set(selectedSlugs);
  const totalActive = games.reduce((sum, game) => sum + (game._count?.posts ?? 0), 0);

  function updateGames(slug?: string) {
    const form = document.getElementById("discover-search-form") as HTMLFormElement | null;
    const params = new URLSearchParams();

    if (form) {
      const formData = new FormData(form);
      for (const [key, value] of formData.entries()) {
        if (key === "game") continue;
        if (typeof value === "string" && value.trim()) params.set(key, value.trim());
      }
    }

    const next = new Set(selectedSlugs);
    if (!slug) next.clear();
    else if (next.has(slug)) next.delete(slug);
    else next.add(slug);

    for (const nextSlug of next) params.append("game", nextSlug);
    window.location.href = `/discover${params.size ? `?${params.toString()}` : ""}`;
  }

  return (
    <div className="border-b border-[var(--line)] bg-[#0b1018]/90">
      <form id="discover-search-form" className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(18rem,1fr)_13rem_13rem_auto] lg:items-end">
        {selectedSlugs.map((slug) => (
          <input key={slug} name="game" type="hidden" value={slug} />
        ))}
        <label className="field">
          <span>Search open groups</span>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[var(--muted)]" size={16} aria-hidden />
            <input className="input pl-9" name="q" defaultValue={q ?? ""} placeholder="Title, description, modpack, game" />
          </div>
        </label>
        <label className="field">
          <span>Platform</span>
          <select className="input" name="platform" defaultValue={platform ?? ""}>
            <option value="">Any platform</option>
            {platforms.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Sort</span>
          <select className="input" name="sort" defaultValue={sort ?? ""}>
            <option value="">Recently refreshed</option>
            <option value="starting-soon">Starting soon</option>
            <option value="open-slots">Most open spots</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button className="btn" type="submit">
            <Search size={18} aria-hidden />
            Search
          </button>
          <a className="btn secondary" href="/discover">Reset</a>
        </div>
      </form>
      <div className="flex gap-3 overflow-x-auto px-4 pb-4" aria-label="Filter by games">
        <button
          aria-pressed={selected.size === 0}
          className={`min-w-[10rem] rounded-lg border p-2 text-left text-sm ${selected.size === 0 ? "border-[var(--accent)] bg-[rgba(45,212,191,0.16)]" : "border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--panel-strong)]"}`}
          onClick={() => updateGames()}
          type="button"
        >
          <strong className="block">All games</strong>
          <span className="text-[var(--muted)]">{totalActive} active</span>
        </button>
        {games.map((game) => {
          const isSelected = selected.has(game.slug);
          return (
            <button
              aria-pressed={isSelected}
              className={`grid min-w-[14rem] grid-cols-[3.25rem_1fr] items-center gap-3 rounded-lg border p-2 text-left text-sm ${isSelected ? "border-[var(--accent)] bg-[rgba(45,212,191,0.16)]" : "border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--panel-strong)]"}`}
              key={game.id}
              onClick={() => updateGames(game.slug)}
              type="button"
            >
              <GameCover game={game} className="size-12 rounded-lg" imageSizes="48px" initialsClassName="text-xs" />
              <span className="min-w-0">
                <strong className="block truncate">{game.name}</strong>
                <span className="text-[var(--muted)]">{game._count?.posts ?? 0} active</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}