export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export default async function PendingGroupsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [sent, received] = await Promise.all([
    prisma.joinRequest.findMany({
      where: { requesterId: session.user.id, status: "PENDING" },
      include: { post: { include: { game: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.joinRequest.findMany({
      where: { post: { ownerId: session.user.id }, status: "PENDING" },
      include: { post: { include: { game: true } }, requester: { include: { profile: true } } },
      orderBy: { createdAt: "desc" }
    })
  ]);
  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-2">
      <section className="panel grid content-start gap-3 p-5">
        <h1 className="text-2xl font-black">Requests I sent</h1>
        {sent.length ? sent.map((request) => (
          <Link href={`/lfg/${request.postId}`} key={request.id} className="border-b border-[var(--line)] py-2">
            <strong>{request.post.title}</strong>
            <p className="muted text-sm">{request.post.game.name}</p>
          </Link>
        )) : <p className="muted">No pending sent requests.</p>}
      </section>
      <section className="panel grid content-start gap-3 p-5">
        <h2 className="text-2xl font-black">Requests to my groups</h2>
        {received.length ? received.map((request) => (
          <Link href={`/lfg/${request.postId}`} key={request.id} className="border-b border-[var(--line)] py-2">
            <strong>{request.requester.profile?.displayName ?? request.requester.name}</strong>
            <p className="muted text-sm">{request.post.title}</p>
          </Link>
        )) : <p className="muted">No pending received requests.</p>}
      </section>
    </div>
  );
}
