export const dynamic = "force-dynamic";
import { Check, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { closePost, decideJoinRequest, refreshPost } from "@/app/actions";
import { auth } from "@/auth";
import { ExpandablePostCard } from "@/components/ExpandablePostCard";
import { prisma } from "@/lib/db";

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const postInclude = {
    game: true,
    owner: { include: { profile: true } },
    members: { where: { removedAt: null }, include: { user: { include: { profile: true } } }, orderBy: { joinedAt: "asc" as const } }
  };

  const [owned, joined, sentRequests, receivedRequests] = await Promise.all([
    prisma.lfgPost.findMany({
      where: { ownerId: session.user.id, deletedAt: null },
      include: postInclude,
      orderBy: { updatedAt: "desc" },
      take: 24
    }),
    prisma.groupMember.findMany({
      where: { userId: session.user.id, removedAt: null, role: { not: "OWNER" } },
      include: { post: { include: postInclude } },
      orderBy: { joinedAt: "desc" },
      take: 24
    }),
    prisma.joinRequest.findMany({
      where: { requesterId: session.user.id, status: "PENDING" },
      include: { post: { include: postInclude } },
      orderBy: { createdAt: "desc" },
      take: 24
    }),
    prisma.joinRequest.findMany({
      where: { post: { ownerId: session.user.id }, status: "PENDING" },
      include: { post: { include: postInclude }, requester: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
      take: 24
    })
  ]);

  return (
    <div className="container grid gap-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">My Groups</h1>
          <p className="muted">Review your groups and requests without leaving this tab.</p>
        </div>
        <Link className="btn" href="/lfg/new">Create a group</Link>
      </div>

      <GroupSection title="Groups I own" count={owned.length} empty="You do not own any groups yet.">
        {owned.map((post) => (
          <ExpandablePostCard eyebrow="Owner" key={post.id} post={post}>
            <div className="flex flex-wrap gap-2">
              <Link className="btn secondary" href={`/lfg/${post.id}/edit`}>Edit</Link>
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
                  <X size={16} aria-hidden />
                  Close
                </button>
              </form>
            </div>
          </ExpandablePostCard>
        ))}
      </GroupSection>

      <GroupSection title="Groups I joined" count={joined.length} empty="You have not joined a group yet.">
        {joined.map((membership) => (
          <ExpandablePostCard eyebrow={`Joined as ${membership.role.replaceAll("_", " ")}`} key={membership.id} post={membership.post} />
        ))}
      </GroupSection>

      <GroupSection title="Requests I sent" count={sentRequests.length} empty="No pending sent requests.">
        {sentRequests.map((request) => (
          <ExpandablePostCard defaultOpen eyebrow="Pending request" key={request.id} post={request.post}>
            <p className="muted text-sm">Request sent {request.createdAt.toLocaleDateString()}.</p>
            {request.message ? <p className="text-sm">{request.message}</p> : null}
          </ExpandablePostCard>
        ))}
      </GroupSection>

      <GroupSection title="Requests to my groups" count={receivedRequests.length} empty="No pending received requests.">
        {receivedRequests.map((request) => (
          <ExpandablePostCard defaultOpen eyebrow="Join request" key={request.id} post={request.post}>
            <div>
              <p className="font-black">{request.requester.profile?.displayName ?? request.requester.name ?? "Player"}</p>
              {request.message ? <p className="muted text-sm">{request.message}</p> : <p className="muted text-sm">No message included.</p>}
            </div>
            <div className="flex flex-wrap gap-2">
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
          </ExpandablePostCard>
        ))}
      </GroupSection>
    </div>
  );
}

function GroupSection({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="muted">{count} {count === 1 ? "item" : "items"}</p>
      </div>
      {count ? <div className="grid gap-4">{children}</div> : <div className="panel p-6 text-[var(--muted)]">{empty}</div>}
    </section>
  );
}