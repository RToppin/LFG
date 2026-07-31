export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { reviewSocialImage } from "@/app/actions";
import { auth } from "@/auth";
import { canModerate } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export default async function AdminSocialPage() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE" || !canModerate(session.user.role as never)) redirect("/dashboard");
  const posts = await prisma.socialPost.findMany({
    where: { imageStatus: "PENDING", imageUrl: { not: null } },
    include: { game: true, author: { include: { profile: true } }, projectZomboidRun: true },
    orderBy: { createdAt: "asc" },
    take: 50
  });

  return (
    <div className="container grid gap-6 py-8">
      <section className="panel grid gap-3 p-6">
        <h1 className="text-3xl font-black">Social moderation</h1>
        <p className="muted">Review submitted screenshot URLs before they render in public social feeds.</p>
      </section>
      <section className="panel grid gap-3 p-6">
        <h2 className="text-xl font-black">Pending screenshots</h2>
        {posts.length ? posts.map((post) => (
          <div className="grid gap-3 border-b border-[var(--line)] py-3" key={post.id}>
            <div>
              <strong>{post.game.name}: {post.projectZomboidRun?.characterName ?? "Progress post"}</strong>
              <p className="muted text-sm">by {post.author.profile?.displayName ?? post.author.name ?? "Player"}</p>
              <p className="text-sm text-[var(--muted)]">{post.body}</p>
              {post.imageUrl ? <a className="text-sm font-bold text-[var(--accent)]" href={post.imageUrl} rel="noreferrer" target="_blank">Open screenshot URL</a> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={async () => { "use server"; await reviewSocialImage(post.id, "approve"); }}>
                <button className="btn" type="submit">Approve image</button>
              </form>
              <form action={async () => { "use server"; await reviewSocialImage(post.id, "reject"); }}>
                <button className="btn danger" type="submit">Reject image</button>
              </form>
            </div>
          </div>
        )) : <p className="muted">No pending screenshots.</p>}
      </section>
    </div>
  );
}
