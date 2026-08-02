import { Calendar, Clock, Mic, Users } from "lucide-react";
import type { ReactNode } from "react";
import { GameCover } from "@/components/GameCover";
import { DURATION_LABELS, EXPERIENCE_LABELS, HOSTING_LABELS, PLATFORM_LABELS } from "@/lib/constants";
import { freshnessLabel } from "@/lib/time";

type ExpandablePost = {
  id: string;
  title: string;
  description: string;
  status?: string;
  playStyles: string[];
  platform: string;
  platforms?: string[];
  hostingStatus: string;
  durationType: string;
  currentGroupSize: number;
  maxPlayers: number;
  expiresAt: Date | null;
  campaignStartsAt: Date;
  timeZone: string;
  joinMode: string;
  serverRegion?: string | null;
  sessionLength?: string | null;
  modded?: boolean;
  modpackName?: string | null;
  difficulty?: string | null;
  requestedExperience?: string;
  microphoneRequired?: boolean;
  preferredLanguage?: string | null;
  minimumAge?: number | null;
  existingWorld?: boolean;
  waitlistEnabled?: boolean;
  game: { name: string; coverImage?: string | null; coverImageUrl?: string | null; fallbackGradient: string };
  owner?: { profile: { username: string; displayName: string } | null; name: string | null };
  members?: Array<{ id: string; role: string; user: { profile: { displayName: string } | null; name: string | null } }>;
};

export function ExpandablePostCard({
  post,
  match,
  eyebrow,
  defaultOpen = false,
  children
}: {
  post: ExpandablePost;
  match?: { score: number; reasons: string[] };
  eyebrow?: string;
  defaultOpen?: boolean;
  children?: ReactNode;
}) {
  const openSlots = Math.max(0, post.maxPlayers - post.currentGroupSize);
  const platformText = (post.platforms?.length ? post.platforms : [post.platform])
    .map((platform) => PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] ?? platform)
    .join(", ");
  const startText = formatDate(post.campaignStartsAt, post.timeZone);
  const ownerName = post.owner?.profile?.displayName ?? post.owner?.name ?? "Player";

  return (
    <details className="expandable-card" open={defaultOpen}>
      <summary className="card grid cursor-pointer overflow-hidden sm:grid-cols-[9rem_1fr]">
        <GameCover game={post.game} className="h-24 sm:h-full" imageSizes="(max-width: 768px) 100vw, 180px" initialsClassName="text-xl" />
        <div className="grid gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="muted text-sm">{eyebrow ?? post.game.name}</p>
              <h3 className="truncate text-lg font-black">{post.title}</h3>
              <p className="muted text-sm">{post.status ? `${post.status.replaceAll("_", " ")} | ` : ""}by {ownerName}</p>
            </div>
            <span className="toggle-control" aria-hidden>
              <span className="toggle-mark" />
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.playStyles.slice(0, 4).map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <Users size={16} aria-hidden />
              {post.currentGroupSize}/{post.maxPlayers} players, {openSlots} open
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} aria-hidden />
              {freshnessLabel(post.expiresAt)}
            </span>
          </div>
          {match ? <p className="text-sm font-black text-[var(--accent)]">{match.score}% match</p> : null}
        </div>
      </summary>
      <div className="expandable-card-body">
        <p className="whitespace-pre-wrap text-[var(--muted)]">{post.description || "No description provided."}</p>
        <div className="grid-auto">
          <Info label="Start" value={startText} />
          <Info label="Platform" value={platformText} />
          <Info label="Hosting" value={HOSTING_LABELS[post.hostingStatus as keyof typeof HOSTING_LABELS] ?? post.hostingStatus} />
          <Info label="Duration" value={DURATION_LABELS[post.durationType as keyof typeof DURATION_LABELS] ?? post.durationType} />
          <Info label="Join mode" value={post.joinMode === "OPEN" ? "Open join" : "Approval required"} />
          <Info label="Experience" value={EXPERIENCE_LABELS[post.requestedExperience as keyof typeof EXPERIENCE_LABELS] ?? "Any experience"} />
          {post.serverRegion ? <Info label="Server region" value={post.serverRegion} /> : null}
          {post.sessionLength ? <Info label="Session length" value={post.sessionLength} /> : null}
          {post.preferredLanguage ? <Info label="Language" value={post.preferredLanguage} /> : null}
          {post.minimumAge ? <Info label="Minimum age" value={`${post.minimumAge}+`} /> : null}
          {post.difficulty ? <Info label="Difficulty" value={post.difficulty} /> : null}
          {post.modpackName ? <Info label="Modpack" value={post.modpackName} /> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {post.modded ? <span className="tag">Modded</span> : null}
          {post.microphoneRequired ? (
            <span className="tag">
              <Mic size={14} aria-hidden /> Mic required
            </span>
          ) : null}
          {post.existingWorld ? <span className="tag">Existing world</span> : null}
          {post.waitlistEnabled ? <span className="tag">Waitlist open</span> : null}
          {post.playStyles.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        {post.members?.length ? (
          <div className="grid gap-2">
            <h4 className="font-black">Members</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {post.members.map((member) => (
                <div className="rounded-lg border border-[var(--line)] p-3" key={member.id}>
                  <p className="font-bold">{member.user.profile?.displayName ?? member.user.name ?? "Player"}</p>
                  <p className="muted text-sm">{member.role.replaceAll("_", " ")}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {match?.reasons.length ? (
          <div className="rounded-lg border border-[var(--line)] p-3">
            <p className="font-black text-[var(--accent)]">Why this matches</p>
            <p className="muted text-sm">{match.reasons.join(" ")}</p>
          </div>
        ) : null}
        {children ? <div className="grid gap-3 border-t border-[var(--line)] pt-4">{children}</div> : null}
      </div>
    </details>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] p-3">
      <p className="text-xs font-black uppercase text-[var(--muted)]">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function formatDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone
  }).format(date);
}