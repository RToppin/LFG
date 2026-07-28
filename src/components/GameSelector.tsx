"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { GameCover } from "@/components/GameCover";
import { useMemo, useState } from "react";
import type { CatalogGameForSelector } from "@/lib/game-catalog";

export function GameSelector({
  games,
  name = "gameId",
  label = "Game",
  initialGameId
}: {
  games: CatalogGameForSelector[];
  name?: string;
  label?: string;
  initialGameId?: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialGameId ?? games[0]?.id ?? "");
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = games.find((game) => game.id === selectedId);
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return games.slice(0, 80);
    return games
      .filter((game) =>
        [game.name, game.shortName ?? "", game.slug, ...game.aliases].some((value) =>
          value.toLowerCase().includes(needle)
        )
      )
      .slice(0, 80);
  }, [games, query]);

  function pick(index: number) {
    const game = results[index];
    if (!game) return;
    setSelectedId(game.id);
    setQuery(game.name);
    setActiveIndex(index);
  }

  return (
    <div className="grid gap-3">
      <input name={name} type="hidden" value={selectedId} />
      <label className="field">
        <span>{label}</span>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-[var(--muted)]" size={16} aria-hidden />
          <input
            aria-activedescendant={results[activeIndex] ? `${name}-${results[activeIndex].id}` : undefined}
            aria-autocomplete="list"
            aria-controls={`${name}-results`}
            aria-expanded={results.length > 0}
            aria-label={`${label} search`}
            className="input pl-9 pr-10"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, results.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                pick(activeIndex);
              }
            }}
            placeholder="Search approved games"
            role="combobox"
            value={query}
          />
          {selected ? (
            <button
              aria-label="Clear selected game"
              className="absolute right-2 top-2 rounded-lg p-2 text-[var(--muted)] hover:text-white"
              onClick={() => {
                setSelectedId("");
                setQuery("");
              }}
              type="button"
            >
              <X size={16} aria-hidden />
            </button>
          ) : null}
        </div>
      </label>
      <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-[var(--line)] p-2" id={`${name}-results`} role="listbox">
        {results.length ? (
          results.map((game, index) => (
            <button
              aria-selected={selectedId === game.id}
              className={`grid grid-cols-[3.25rem_1fr] gap-3 rounded-lg p-2 text-left hover:bg-[var(--panel-strong)] ${
                index === activeIndex || selectedId === game.id ? "bg-[var(--panel-strong)]" : ""
              }`}
              id={`${name}-${game.id}`}
              key={game.id}
              onClick={() => pick(index)}
              role="option"
              type="button"
            >
              <GameCover game={game} className="size-12 rounded-lg" imageSizes="48px" initialsClassName="text-sm" />
              <span className="grid gap-1">
                <span className="font-black">{game.name}</span>
                <span className="text-xs text-[var(--muted)]">
                  {game.platforms.map((entry) => entry.platform.replaceAll("_", " ")).join(", ")}
                </span>
                <span className="flex flex-wrap gap-1">
                  {game.categories.slice(0, 3).map(({ category }) => (
                    <span className="tag" key={category.slug}>
                      {category.name}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          ))
        ) : (
          <div className="grid gap-2 p-3 text-sm text-[var(--muted)]">
            <p>No approved games match that search.</p>
            <Link className="font-bold text-[var(--accent)]" href="/games/request">
              Can&apos;t find your game? Request it.
            </Link>
          </div>
        )}
      </div>
      {selected ? (
        <p className="text-sm text-[var(--muted)]">
          Selected: <strong className="text-white">{selected.name}</strong>
        </p>
      ) : (
        <p className="text-sm font-bold text-[var(--danger)]">Select an approved game before submitting.</p>
      )}
    </div>
  );
}

