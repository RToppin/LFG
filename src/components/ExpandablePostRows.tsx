import { Clock, Gamepad2, Users } from "lucide-react";
import { PendingLink } from "@/components/PendingLink";
import { DURATION_LABELS, HOSTING_LABELS, PLATFORM_LABELS } from "@/lib/constants";
import { freshnessLabel } from "@/lib/time";

type ExpandablePost = {
  id: string;
  title: string;
  description: string | null;
  playStyles: string[];
  platform: string;
  platforms?: string[];
  hostingStatus: string;
  durationType: string;
  currentGroupSize: number;
  maxPlayers: number;
  expiresAt: Date | null;
  game: { name: string };
  owner: { profile: { username: string; displayName: string } | null; name: string | null };
};

export function ExpandablePostRows({ posts, matchById = new Map() }: { posts: ExpandablePost[]; matchById?: Map<string, { score: number; reasons: string[] } | undefined> }) {
  return (
    <div className="grid gap-3">
      {posts.map((post) => (
        <ExpandablePostRow key={post.id} post={post} match={matchById.get(post.id)} />
      ))}
    </div>
  );
}

function ExpandablePostRow({ post, match }: { post: ExpandablePost; match?: { score: number; reasons: string[] } }) {
  const openSlots = Math.max(0, post.maxPlayers - post.currentGroupSize);
  const platformText = (post.platforms?.length ? post.platforms : [post.platform])
    .map((platform) => PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] ?? platform)
    .join(", ");
  const owner = post.owner.profile?.displayName ?? post.owner.name ?? "Player";

  return (
    <details className="expand-row group">
      <summary className="expand-summary">
        <span className="min-w-0">
          <span className="block truncate text-base font-black">{post.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-1"><Gamepad2 size={15} aria-hidden />{post.game.name}</span>
            <span className="inline-flex items-center gap-1"><Users size={15} aria-hidden />{post.currentGroupSize}/{post.maxPlayers}, {openSlots} open</span>
            <span className="inline-flex items-center gap-1"><Clock size={15} aria-hidden />{freshnessLabel(post.expiresAt)}</span>
          </span>
        </span>
        <span className="expand-toggle" aria-hidden>
          <span className="expand-plus">+</span>
          <span className="expand-minus">-</span>
        </span>
      </summary>
      <div className="expand-body">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="grid gap-3">
            <p className="text-sm text-[var(--muted)]">Hosted by {owner} | {platformText} | {HOSTING_LABELS[post.hostingStatus as keyof typeof HOSTING_LABELS]} | {DURATION_LABELS[post.durationType as keyof typeof DURATION_LABELS]}</p>
            {post.description ? <p className="max-w-4xl whitespace-pre-wrap text-sm text-[var(--muted)]">{post.description}</p> : null}
            <div className="flex flex-wrap gap-2">
              {post.playStyles.slice(0, 8).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
            {match ? (
              <p className="rounded-lg border border-[var(--line)] bg-[#0d131c] p-3 text-sm text-[var(--muted)]">
                <strong className="text-[var(--accent)]">{match.score}% match.</strong> {match.reasons.join(" ")}
              </p>
            ) : null}
          </div>
          <PendingLink className="btn whitespace-nowrap" href={`/lfg/${post.id}`} pendingLabel="Opening group...">
            View group
          </PendingLink>
        </div>
      </div>
    </details>
  );
}
