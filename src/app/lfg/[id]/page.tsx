import { Calendar, Check, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { closePost, joinOrRequestPost, refreshPost, submitReport, toggleSavePost, decideJoinRequest } from "@/app/actions";
import { auth } from "@/auth";
import { ActionForm } from "@/components/ActionForm";
import { DURATION_LABELS, HOSTING_LABELS, PLATFORM_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatViewerTime, freshnessLabel } from "@/lib/time";

export default async function LfgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const post = await prisma.lfgPost.findUnique({
    where: { id },
    include: {
      game: true,
      owner: { include: { profile: true } },
      members: { include: { user: { include: { profile: true } } }, where: { removedAt: null } },
      joinRequests: { where: { status: "PENDING" }, include: { requester: { include: { profile: true } } } },
      invitation: true,
      savedBy: session?.user.id ? { where: { userId: session.user.id } } : false
    }
  });
  if (!post) notFound();
  const isOwner = session?.user.id === post.ownerId;
  const isMember = post.members.some((member) => member.userId === session?.user.id);
  const canSeeInvite =
    post.invitation?.visibility === "PUBLIC" || isOwner || isMember || session?.user.role === "ADMIN" || session?.user.role === "MODERATOR";
  const times = formatViewerTime(
    post.campaignStartsAt,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    post.timeZone
  );

  return (
    <div className="container grid gap-6 py-8">
      <section className="panel overflow-hidden">
        <div className={`h-36 ${post.game.fallbackGradient}`} aria-hidden />
        <div className="grid gap-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-black text-[var(--accent)]">{post.game.name}</p>
              <h1 className="text-4xl font-black">{post.title}</h1>
              <p className="muted">
                by{" "}
                <Link href={`/profile/${post.owner.profile?.username ?? post.ownerId}`} className="text-white">
                  {post.owner.profile?.displayName ?? post.owner.name ?? "Player"}
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {session?.user ? (
                <form action={async () => {
                  "use server";
                  await toggleSavePost(post.id);
                }}>
                  <button className="btn secondary" type="submit">
                    {post.savedBy.length ? "Unsave" : "Save"}
                  </button>
                </form>
              ) : null}
              {isOwner ? (
                <>
                  <Link className="btn secondary" href={`/lfg/${post.id}/edit`}>
                    Edit
                  </Link>
                  <form action={async () => {
                    "use server";
                    await refreshPost(post.id);
                  }}>
                    <button className="btn secondary" type="submit">
                      <RefreshCw size={16} aria-hidden />
                      Refresh
                    </button>
                  </form>
                  <form action={async () => {
                    "use server";
                    await closePost(post.id);
                  }}>
                    <button className="btn danger" type="submit">
                      Close
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          </div>
          <p className="max-w-3xl whitespace-pre-wrap text-[var(--muted)]">{post.description}</p>
          <div className="grid-auto">
            <Info label="Start" value={times.viewer} />
            <Info label="Original time zone" value={times.original} />
            <Info label="Freshness" value={freshnessLabel(post.expiresAt)} />
            <Info label="Slots" value={`${post.currentGroupSize}/${post.maxPlayers} players`} />
            <Info label="Platform" value={PLATFORM_LABELS[post.platform]} />
            <Info label="Hosting" value={HOSTING_LABELS[post.hostingStatus]} />
            <Info label="Duration" value={DURATION_LABELS[post.durationType]} />
            <Info label="Join mode" value={post.joinMode === "OPEN" ? "Open join" : "Approval required"} />
          </div>
          <div className="flex flex-wrap gap-2">
            {post.playStyles.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          {post.invitation ? (
            <div className="card p-4">
              <h2 className="font-black">Discord</h2>
              {canSeeInvite ? (
                <a className="btn mt-3 w-fit" href={post.invitation.url} rel="noreferrer" target="_blank">
                  Open in Discord
                </a>
              ) : (
                <p className="muted mt-2">The Discord invitation is private until you are approved.</p>
              )}
            </div>
          ) : null}
        </div>
      </section>
      {!isOwner && session?.user ? (
        <section className="panel grid gap-4 p-6">
          <h2 className="text-xl font-black">Join this group</h2>
          <ActionForm action={joinOrRequestPost} submitLabel={post.joinMode === "OPEN" ? "Join group" : "Send request"}>
            <input name="postId" type="hidden" value={post.id} />
            <label className="field">
              <span>Message</span>
              <textarea className="input textarea" name="message" placeholder="Share your experience, availability, or Discord handle." />
            </label>
          </ActionForm>
        </section>
      ) : null}
      {isOwner ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="panel grid gap-3 p-6">
            <h2 className="text-xl font-black">Members</h2>
            {post.members.map((member) => (
              <div className="flex items-center justify-between border-b border-[var(--line)] py-2" key={member.id}>
                <span>{member.user.profile?.displayName ?? member.user.name ?? "Player"}</span>
                <span className="tag">{member.role.replaceAll("_", " ")}</span>
              </div>
            ))}
          </div>
          <div className="panel grid gap-3 p-6">
            <h2 className="text-xl font-black">Pending requests</h2>
            {post.joinRequests.length ? (
              post.joinRequests.map((request) => (
                <div className="grid gap-2 border-b border-[var(--line)] py-2" key={request.id}>
                  <p className="font-bold">{request.requester.profile?.displayName ?? request.requester.name ?? "Player"}</p>
                  <p className="muted text-sm">{request.message}</p>
                  <div className="flex gap-2">
                    <form action={async () => {
                      "use server";
                      await decideJoinRequest(request.id, "approve");
                    }}>
                      <button className="btn" type="submit">
                        <Check size={16} aria-hidden />
                        Approve
                      </button>
                    </form>
                    <form action={async () => {
                      "use server";
                      await decideJoinRequest(request.id, "reject");
                    }}>
                      <button className="btn secondary" type="submit">
                        <X size={16} aria-hidden />
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No pending requests.</p>
            )}
          </div>
        </section>
      ) : null}
      {session?.user ? (
        <section className="panel p-6">
          <ActionForm action={submitReport} submitLabel="Submit report">
            <input name="postId" type="hidden" value={post.id} />
            <input name="reportedUserId" type="hidden" value={post.ownerId} />
            <label className="field">
              <span>Report reason</span>
              <select className="input" name="type">
                <option value="SPAM">Spam</option>
                <option value="UNSAFE_DISCORD_INVITATION">Unsafe Discord invitation</option>
                <option value="MISLEADING_POST">Misleading post</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className="field">
              <span>Details</span>
              <textarea className="input" name="details" />
            </label>
          </ActionForm>
        </section>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <p className="text-xs font-black uppercase text-[var(--muted)]">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
