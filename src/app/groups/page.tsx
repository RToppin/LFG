export const dynamic = "force-dynamic";
import type { PostStatus, Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ExpandableLfgCard } from "@/components/ExpandableLfgCard";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type GroupsSearchParams = { tab?: string };

const tabs = [
  { id: "owned", label: "Groups I own" },
  { id: "joined", label: "Groups I joined" },
  { id: "pending", label: "Pending requests" },
  { id: "closed", label: "Closed groups" },
  { id: "expired", label: "Expired posts" },
  { id: "draft", label: "Draft posts" }
] as const;

const ownedStatusByTab: Record<string, PostStatus | undefined> = {
  owned: undefined,
  closed: "CLOSED",
  expired: "EXPIRED",
  draft: "DRAFT"
};

export default async function GroupsPage({ searchParams }: { searchParams: Promise<GroupsSearchParams> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const params = await searchParams;
  const activeTab = tabs.some((tab) => tab.id === params.tab) ? params.tab ?? "owned" : "owned";
  const ownedStatus = ownedStatusByTab[activeTab];

  const [ownedPosts, joinedMemberships, sentRequests, receivedRequests] = await Promise.all([
    prisma.lfgPost.findMany({
      where: { ownerId: session.user.id, status: ownedStatus },
      include: groupPostInclude(),
      orderBy: { updatedAt: "desc" },
      take: 80
    }),
    prisma.groupMember.findMany({
      where: { userId: session.user.id, removedAt: null, role: { not: "OWNER" } },
      include: { post: { include: groupPostInclude() } },
      orderBy: { joinedAt: "desc" },
      take: 80
    }),
    prisma.joinRequest.findMany({
      where: { requesterId: session.user.id, status: "PENDING" },
      include: { post: { include: groupPostInclude() }, requester: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
      take: 80
    }),
    prisma.joinRequest.findMany({
      where: { post: { ownerId: session.user.id }, status: "PENDING" },
      include: { post: { include: groupPostInclude() }, requester: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
      take: 80
    })
  ]);

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="grid gap-5">
        <div>
          <h1 className="text-3xl font-black">My Groups</h1>
          <p className="muted">Open any row to review the full group details. Multiple rows can stay expanded.</p>
        </div>

        <nav className="settings-tabs" aria-label="Group sections">
          {tabs.map((tab) => (
            <Link className={activeTab === tab.id ? "active" : ""} href={`/groups?tab=${tab.id}`} key={tab.id}>
              {tab.label}
            </Link>
          ))}
        </nav>

        {activeTab === "joined" ? (
          <GroupCards
            empty="You have not joined a group yet."
            posts={joinedMemberships.map((membership) => membership.post)}
            context={(post) => `${post.game.name} | Joined`}
          />
        ) : activeTab === "pending" ? (
          <div className="grid gap-4">
            <RequestCards empty="No pending sent requests." requests={sentRequests} title="Requests I sent" />
            <RequestCards empty="No pending received requests." requests={receivedRequests} title="Requests to my groups" received />
          </div>
        ) : (
          <GroupCards
            actions={(post) => (
              <Link className="btn secondary" href={`/lfg/${post.id}/edit`}>
                Edit post
              </Link>
            )}
            empty={ownedStatus ? `You do not have ${activeTab} groups.` : "You do not own any groups yet."}
            posts={ownedPosts}
            context={(post) => `${post.game.name} | ${post.status}`}
            showOwnerTools
          />
        )}
      </div>
    </div>
  );
}

function GroupCards({
  posts,
  empty,
  context,
  actions,
  showOwnerTools = false
}: {
  posts: Array<GroupPost>;
  empty: string;
  context: (post: GroupPost) => string;
  actions?: (post: GroupPost) => ReactNode;
  showOwnerTools?: boolean;
}) {
  if (!posts.length) {
    return (
      <div className="panel p-8 text-center">
        <p className="muted">{empty}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {posts.map((post) => (
        <ExpandableLfgCard actions={actions?.(post)} context={context(post)} key={post.id} post={post}>
          <GroupDetailPanel post={post} showOwnerTools={showOwnerTools} />
        </ExpandableLfgCard>
      ))}
    </div>
  );
}

function RequestCards({
  requests,
  empty,
  title,
  received = false
}: {
  requests: Array<RequestWithPost>;
  empty: string;
  title: string;
  received?: boolean;
}) {
  return (
    <section className="grid gap-3">
      <h2 className="text-2xl font-black">{title}</h2>
      {requests.length ? (
        requests.map((request) => (
          <ExpandableLfgCard context={`${request.post.game.name} | Pending`} key={request.id} post={request.post}>
            <div className="rounded-lg border border-[var(--line)] p-3">
              <p className="font-black">{received ? "Requester" : "Request status"}</p>
              <p className="muted text-sm">
                {received
                  ? request.requester?.profile?.displayName ?? request.requester?.name ?? "Player"
                  : `Sent ${formatDate(request.createdAt)}`}
              </p>
              {request.message ? <p className="mt-2 text-sm text-[var(--muted)]">{request.message}</p> : null}
            </div>
          </ExpandableLfgCard>
        ))
      ) : (
        <div className="panel p-6">
          <p className="muted">{empty}</p>
        </div>
      )}
    </section>
  );
}

function GroupDetailPanel({ post, showOwnerTools }: { post: GroupPost; showOwnerTools?: boolean }) {
  const activeMembers = post.members.filter((member) => !member.removedAt);
  const pendingRequests = post.joinRequests.filter((request) => request.status === "PENDING");
  return (
    <div className="grid gap-4">
      <div className="detail-grid">
        <span>Status: {post.status}</span>
        <span>Join mode: {post.joinMode.replaceAll("_", " ")}</span>
        <span>Timezone: {post.timeZone}</span>
        <span>Region: {post.serverRegion ?? "Auto-assigned"}</span>
        <span>Starts: {formatDate(post.campaignStartsAt)}</span>
        <span>Ends: {post.campaignEndsAt ? formatDate(post.campaignEndsAt) : "Open ended"}</span>
        <span>Discord: {post.invitation?.visibility.replaceAll("_", " ") ?? "No invite"}</span>
        <span>Waitlist: {post.waitlistEnabled ? "Enabled" : "Off"}</span>
        <span>Auto-close: {post.autoCloseWhenFull ? "On" : "Off"}</span>
        <span>Modded: {post.modded ? post.modpackName || "Yes" : "No"}</span>
      </div>
      {post.serverRules ? (
        <div className="rounded-lg border border-[var(--line)] p-3">
          <p className="font-black">Server rules</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{post.serverRules}</p>
        </div>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-[var(--line)] p-3">
          <h3 className="font-black">Members</h3>
          {activeMembers.length ? (
            <div className="mt-2 grid gap-2">
              {activeMembers.map((member) => (
                <p className="text-sm" key={member.id}>
                  {member.user.profile?.displayName ?? member.user.name ?? "Player"}{" "}
                  <span className="muted">| {member.role.replaceAll("_", " ")}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="muted mt-2 text-sm">No active members.</p>
          )}
        </section>
        {showOwnerTools ? (
          <section className="rounded-lg border border-[var(--line)] p-3">
            <h3 className="font-black">Pending requests</h3>
            {pendingRequests.length ? (
              <div className="mt-2 grid gap-2">
                {pendingRequests.map((request) => (
                  <p className="text-sm" key={request.id}>
                    {request.requester.profile?.displayName ?? request.requester.name ?? "Player"}{" "}
                    <span className="muted">| {formatDate(request.createdAt)}</span>
                  </p>
                ))}
              </div>
            ) : (
              <p className="muted mt-2 text-sm">No pending requests.</p>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function groupPostInclude() {
  return {
    game: true,
    owner: { include: { profile: true } },
    invitation: true,
    members: {
      include: { user: { include: { profile: true } } },
      orderBy: { joinedAt: "asc" as const }
    },
    joinRequests: {
      include: { requester: { include: { profile: true } } },
      orderBy: { createdAt: "desc" as const }
    }
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

type GroupPost = Prisma.LfgPostGetPayload<{ include: ReturnType<typeof groupPostInclude> }>;
type RequestWithPost = Prisma.JoinRequestGetPayload<{
  include: {
    post: { include: ReturnType<typeof groupPostInclude> };
    requester: { include: { profile: true } };
  };
}>;
