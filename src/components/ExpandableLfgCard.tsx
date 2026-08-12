import { CalendarClock, Clock, Gamepad2, Headphones, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { GameCover } from "@/components/GameCover";
import { DURATION_LABELS, HOSTING_LABELS, PLATFORM_LABELS } from "@/lib/constants";
import { freshnessLabel } from "@/lib/time";

export type ExpandableLfgCardPost = {
  id: string;
  title: string;
  description: string;
  playStyles: string[];
  platform: string;
  platforms?: string[];
  hostingStatus: string;
  durationType: string;
  currentGroupSize: number;
  maxPlayers: number;
  status?: string;
  timeZone?: string;
  campaignStartsAt?: Date;
  campaignEndsAt?: Date | null;
  expiresAt?: Date | null;
  minimumAge?: number | null;
  microphoneRequired?: boolean;
  modded?: boolean;
  serverRegion?: string | null;
  game: { name: string; coverImage?: string | null; coverImageUrl?: string | null; fallbackGradient: string };
  owner?: { profile: { username: string; displayName: string } | null; name: string | null } | null;
};

export function ExpandableLfgCard({
  post,
  match,
  context,
  actions,
  children,
  defaultOpen = false
}: {
  post: ExpandableLfgCardPost;
  match?: { score: number; reasons: string[] };
  context?: string;
  actions?: ReactNode;
  children?: ReactNode;
  defaultOpen?: boolean;
}) {
  const openSlots = Math.max(0, post.maxPlayers - post.currentGroupSize);
  const platformText = (post.platforms?.length ? post.platforms : [post.platform])
    .map((platform) => PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] ?? platform)
    .join(", ");

  return (
    <details className="expandable-card card" open={defaultOpen}>
      <summary>
        <span className="details-toggle" aria-hidden>
          <span className="plus">+</span>
          <span className="minus">-</span>
        </span>
        <GameCover game={post.game} className="size-16 rounded-lg" initialsClassName="text-sm" />
        <span className="min-w-0">
          <span className="muted block text-xs font-bold uppercase tracking-widest">{context ?? post.game.name}</span>
          <strong className="block truncate text-lg">{post.title}</strong>
          <span className="muted block truncate text-sm">{post.game.name}</span>
        </span>
        <span className="player-count">
          <Users size={18} aria-hidden />
          {post.currentGroupSize}/{post.maxPlayers}
          <small>{openSlots} open</small>
        </span>
      </summary>
      <div className="expandable-card-body">
        <div className="grid gap-3">
          <p className="text-sm text-[var(--muted)]">{post.description || "No description provided."}</p>
          <div className="flex flex-wrap gap-2">
            {post.playStyles.length ? post.playStyles.map((tag) => <span className="tag" key={tag}>{tag}</span>) : <span className="tag">Open style</span>}
          </div>
        </div>
        <div className="detail-grid">
          <span>
            <Gamepad2 size={16} aria-hidden />
            {platformText}
          </span>
          <span>
            <ShieldCheck size={16} aria-hidden />
            {HOSTING_LABELS[post.hostingStatus as keyof typeof HOSTING_LABELS] ?? post.hostingStatus}
          </span>
          <span>
            <CalendarClock size={16} aria-hidden />
            {DURATION_LABELS[post.durationType as keyof typeof DURATION_LABELS] ?? post.durationType}
          </span>
          <span>
            <Clock size={16} aria-hidden />
            {post.expiresAt ? freshnessLabel(post.expiresAt) : post.status ?? "Active"}
          </span>
          {post.minimumAge ? (
            <span>
              <Users size={16} aria-hidden />
              {post.minimumAge}+ minimum age
            </span>
          ) : null}
          {post.microphoneRequired ? (
            <span>
              <Headphones size={16} aria-hidden />
              Mic required
            </span>
          ) : null}
        </div>
        {match ? (
          <div className="rounded-lg border border-[var(--line)] p-3">
            <p className="font-black text-[var(--accent)]">{match.score}% match</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{match.reasons.join(" ")}</p>
          </div>
        ) : null}
        {children}
        <div className="flex flex-wrap gap-2">
          <Link className="btn secondary" href={`/lfg/${post.id}`}>
            View post
          </Link>
          {actions}
        </div>
      </div>
    </details>
  );
}
