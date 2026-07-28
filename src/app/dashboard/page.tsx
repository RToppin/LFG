import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PostCard } from "@/components/PostCard";
import { prisma } from "@/lib/db";
import { calculateMatchScore } from "@/lib/matching";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.onboarded) redirect("/onboarding");
  const [profile, posts, owned, requests, notifications] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id }, include: { games: true, availabilitySlots: true } }),
    prisma.lfgPost.findMany({
      where: { status: "ACTIVE", ownerId: { not: session.user.id } },
      include: { game: true, owner: { include: { profile: true } } },
      orderBy: { refreshedAt: "desc" },
      take: 6
    }),
    prisma.lfgPost.findMany({
      where: { ownerId: session.user.id, status: { in: ["ACTIVE", "DRAFT", "EXPIRED"] } },
      include: { game: true },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    prisma.joinRequest.findMany({
      where: { requesterId: session.user.id, status: "PENDING" },
      include: { post: { include: { game: true } } },
      take: 5
    }),
    prisma.notification.findMany({ where: { userId: session.user.id, archivedAt: null }, orderBy: { createdAt: "desc" }, take: 5 })
  ]);

  return (
    <div className="container grid gap-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Dashboard</h1>
          <p className="muted">Recommendations, owned posts, pending requests, and recent notifications.</p>
        </div>
        <Link className="btn" href="/lfg/new">
          Quick create
        </Link>
      </div>
      <section className="grid gap-4">
        <h2 className="text-2xl font-black">Recommended posts</h2>
        <div className="grid-auto">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              match={
                profile
                  ? calculateMatchScore(
                      {
                        games: profile.games,
                        languages: profile.languages,
                        playStyles: profile.playStyles,
                        availability: profile.availabilitySlots
                      },
                      post,
                      session.user.id
                    )
                  : undefined
              }
            />
          ))}
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <Panel title="My active work">
          {owned.length ? (
            owned.map((post) => (
              <Link href={`/lfg/${post.id}`} className="block border-b border-[var(--line)] py-2" key={post.id}>
                <strong>{post.title}</strong>
                <p className="muted text-sm">{post.game.name} · {post.status}</p>
              </Link>
            ))
          ) : (
            <p className="muted">No owned posts yet.</p>
          )}
        </Panel>
        <Panel title="Pending requests">
          {requests.length ? (
            requests.map((request) => (
              <Link href={`/lfg/${request.postId}`} className="block border-b border-[var(--line)] py-2" key={request.id}>
                <strong>{request.post.title}</strong>
                <p className="muted text-sm">{request.post.game.name}</p>
              </Link>
            ))
          ) : (
            <p className="muted">No pending requests.</p>
          )}
        </Panel>
        <Panel title="Recent notifications">
          {notifications.length ? (
            notifications.map((notification) => (
              <Link href={notification.link ?? "/notifications"} className="block border-b border-[var(--line)] py-2" key={notification.id}>
                <strong>{notification.title}</strong>
                <p className="muted text-sm">{notification.body}</p>
              </Link>
            ))
          ) : (
            <p className="muted">All quiet.</p>
          )}
        </Panel>
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel grid content-start gap-3 p-5">
      <h2 className="text-xl font-black">{title}</h2>
      {children}
    </section>
  );
}
