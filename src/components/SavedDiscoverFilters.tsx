"use client";

import Link from "next/link";
import { RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

const STORAGE_KEY = "lfg.discover.filters";

export function SavedDiscoverFilters({ hasFilters }: { hasFilters: boolean }) {
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const current = window.location.search.slice(1);
    if (current) {
      window.localStorage.setItem(STORAGE_KEY, current);
      return;
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) window.location.replace(`/discover?${saved}`);
  }, []);

  const resetHref = useMemo(() => "/discover", []);

  function saveFilters(event: React.FormEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    const params = new URLSearchParams();
    new FormData(form).forEach((value, key) => {
      if (typeof value === "string" && value.trim()) params.append(key, value.trim());
    });
    if (params.size) window.localStorage.setItem(STORAGE_KEY, params.toString());
    else window.localStorage.removeItem(STORAGE_KEY);
  }

  function resetFilters() {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn" onClick={saveFilters} type="submit">
        <Search size={18} aria-hidden />
        Update feed
      </button>
      <Link className="btn secondary" href={resetHref} onClick={resetFilters}>
        <RotateCcw size={16} aria-hidden />
        Reset
      </Link>
      {hasFilters ? <span className="self-center text-xs font-bold text-[var(--muted)]">Saved for next visit</span> : null}
    </div>
  );
}

