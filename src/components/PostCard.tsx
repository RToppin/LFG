import { Clock, Users } from "lucide-react";
import Link from "next/link";
import { GameCover } from "@/components/GameCover";
import { DURATION_LABELS, HOSTING_LABELS, PLATFORM_LABELS } from "@/lib/constants";
import { freshnessLabel } from "@/lib/time";

type PostCardPost = {
  id: string;
  title: string;
  playStyles: string[];
  platform: string;
  hostingStatus: string;
  durationType: string;
  currentGroupSize: number;
  maxPlayers: number;
  expiresAt: Date | null;
  game: { name: string; coverImageUrl?: string | null; fallbackGradient: string };
  owner: { profile: { username: string; displayName: string } | null; name: string | null };
};

export function PostCard({
  post,
  match
}: {
  post: PostCardPost;
  match?: { score: number; reasons: string[] };
}) {
  const openSlots = Math.max(0, post.maxPlayers - post.currentGroupSize);
  return (
    <article className="card overflow-hidden">
      <GameCover game={post.game} className="h-20" imageSizes="(max-width: 768px) 100vw, 360px" initialsClassName="text-xl" />
      <div className="grid gap-3 p-4">
        <div>
          <p className="muted text-sm">{post.game.name}</p>
          <Link href={`/lfg/${post.id}`} className="text-lg font-black hover:text-[var(--accent)]">
            {post.title}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {post.playStyles.slice(0, 4).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className="grid gap-2 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2">
            <Users size={16} aria-hidden />
            {post.currentGroupSize}/{post.maxPlayers} players, {openSlots} open
          </span>
          <span className="flex items-center gap-2">
            <Clock size={16} aria-hidden />
            {freshnessLabel(post.expiresAt)}
          </span>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {PLATFORM_LABELS[post.platform as keyof typeof PLATFORM_LABELS]} |{" "}
          {HOSTING_LABELS[post.hostingStatus as keyof typeof HOSTING_LABELS]} |{" "}
          {DURATION_LABELS[post.durationType as keyof typeof DURATION_LABELS]}
        </p>
        {match ? (
          <details className="rounded-lg border border-[var(--line)] p-3">
            <summary className="cursor-pointer font-black text-[var(--accent)]">{match.score}% match</summary>
            <p className="mt-2 text-sm text-[var(--muted)]">{match.reasons.join(" ")}</p>
          </details>
        ) : null}
      </div>
    </article>
  );
}
