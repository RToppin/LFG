"use client";

import { Platform } from "@prisma/client";
import { Gamepad2, Globe2, Monitor, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { GameCover } from "@/components/GameCover";
import { PLATFORM_LABELS } from "@/lib/constants";
import type { CatalogGameForSelector } from "@/lib/game-catalog";

const platformIcons = {
  PC: Monitor,
  XBOX: Gamepad2,
  PLAYSTATION: Gamepad2,
  NINTENDO_SWITCH: Gamepad2,
  CROSS_PLATFORM: Globe2,
  OTHER: Gamepad2
} satisfies Record<Platform, ComponentType<{ size?: number; "aria-hidden"?: boolean }>>;

export function DiscoverGameFilter({
  games,
  q,
  selectedSlugs,
  selectedPlatforms,
  sort
}: {
  games: CatalogGameForSelector[];
  q?: string;
  selectedSlugs: string[];
  selectedPlatforms: Platform[];
  sort?: string;
}) {
  const [gameQuery, setGameQuery] = useState("");
  const results = useMemo(() => {
    const needle = gameQuery.trim().toLowerCase();
    const selected = new Set(selectedSlugs);
    const matches = games
      .filter((game) => !needle || [game.name, game.slug, ...game.aliases].some((value) => value.toLowerCase().includes(needle)))
      .sort((a, b) => (b._count?.posts ?? 0) - (a._count?.posts ?? 0) || a.name.localeCompare(b.name))
      .slice(0, 80);
    const missingSelected = games.filter((game) => selected.has(game.slug) && !matches.some((match) => match.id === game.id));
    return [...missingSelected, ...matches];
  }, [games, gameQuery, selectedSlugs]);

  return (
    <form className="panel discover-filter-bar grid gap-4 p-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(18rem,1fr)_14rem_auto] xl:items-end">
        <label className="field">
          <span>Search open groups</span>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[var(--muted)]" size={16} aria-hidden />
            <input className="input pl-9" name="q" defaultValue={q} placeholder="Title, description, modpack, game" />
          </div>
        </label>
        <label className="field">
          <span>Sort</span>
          <select className="input" name="sort" defaultValue={sort ?? ""}>
            <option value="">Recently refreshed</option>
            <option value="starting-soon">Starting soon</option>
            <option value="open-slots">Most open spots</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="btn" type="submit">
            <SlidersHorizontal size={18} aria-hidden />
            Search
          </button>
          <Link className="btn secondary" href="/discover">
            Reset
          </Link>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="field min-w-64">
            <span>Games</span>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-[var(--muted)]" size={16} aria-hidden />
              <input
                aria-label="Filter game choices"
                className="input pl-9"
                onChange={(event) => setGameQuery(event.target.value)}
                placeholder="Find a game to select"
                value={gameQuery}
              />
            </div>
          </label>
          <p className="muted text-sm">{selectedSlugs.length ? `${selectedSlugs.length} selected` : "No game selected shows every game"}</p>
        </div>
        <div className="horizontal-scroll" aria-label="Game filters">
          <div className={`game-filter-card ${selectedSlugs.length ? "" : "is-active"}`} aria-hidden>
            <div className="grid size-14 place-items-center rounded-lg bg-[var(--panel-strong)]">
              <Gamepad2 size={24} aria-hidden />
            </div>
            <span>
              <strong>All games</strong>
              <small>{games.reduce((sum, game) => sum + (game._count?.posts ?? 0), 0)} active</small>
            </span>
          </div>
          {results.map((game) => (
            <label className="game-filter-card" key={game.id}>
              <input defaultChecked={selectedSlugs.includes(game.slug)} name="game" type="checkbox" value={game.slug} />
              <GameCover game={game} className="size-14 rounded-lg" initialsClassName="text-sm" />
              <span className="min-w-0">
                <strong>{game.name}</strong>
                <small>{game._count?.posts ?? 0} active</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      <fieldset className="grid gap-2">
        <legend className="label">Platform</legend>
        <div className="horizontal-scroll compact" aria-label="Platform filters">
          {Object.values(Platform).map((platform) => {
            const Icon = platformIcons[platform];
            return (
              <label className="platform-filter-card" key={platform}>
                <input defaultChecked={selectedPlatforms.includes(platform)} name="platform" type="checkbox" value={platform} />
                <Icon size={18} aria-hidden />
                <span>{PLATFORM_LABELS[platform]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </form>
  );
}
