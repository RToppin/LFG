export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export default async function JoinedGroupsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id, removedAt: null, role: { not: "OWNER" } },
    include: { post: { include: { game: true } } },
    orderBy: { joinedAt: "desc" }
  });
  return (
    <div className="container grid gap-6 py-8">
      <h1 className="text-3xl font-black">Groups I joined</h1>
      <div className="panel grid gap-2 p-5">
        {memberships.length ? (
          memberships.map((membership) => (
            <Link className="rounded-lg p-3 hover:bg-[var(--panel-strong)]" href={`/lfg/${membership.postId}`} key={membership.id}>
              <strong>{membership.post.title}</strong>
              <p className="muted text-sm">{membership.post.game.name} · {membership.post.status}</p>
            </Link>
          ))
        ) : (
          <p className="muted">You have not joined a group yet.</p>
        )}
      </div>
    </div>
  );
}
