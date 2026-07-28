export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export default async function OwnedGroupsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const params = await searchParams;
  const posts = await prisma.lfgPost.findMany({
    where: { ownerId: session.user.id, status: params.status as never },
    include: { game: true },
    orderBy: { updatedAt: "desc" }
  });
  return <GroupList title="Groups I own" posts={posts} empty="You do not own posts in this section." />;
}

function GroupList({ title, posts, empty }: { title: string; posts: Array<{ id: string; title: string; status: string; game: { name: string } }>; empty: string }) {
  return (
    <div className="container grid gap-6 py-8">
      <h1 className="text-3xl font-black">{title}</h1>
      <div className="panel grid gap-2 p-5">
        {posts.length ? (
          posts.map((post) => (
            <Link className="rounded-lg p-3 hover:bg-[var(--panel-strong)]" href={`/lfg/${post.id}`} key={post.id}>
              <strong>{post.title}</strong>
              <p className="muted text-sm">{post.game.name} · {post.status}</p>
            </Link>
          ))
        ) : (
          <p className="muted">{empty}</p>
        )}
      </div>
    </div>
  );
}
