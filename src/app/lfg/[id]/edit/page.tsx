import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { closePost, refreshPost } from "@/app/actions";

export default async function EditLfgPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  const post = await prisma.lfgPost.findUnique({ where: { id }, include: { game: true } });
  if (!post) redirect("/discover");
  if (post.ownerId !== session.user.id && !["ADMIN", "MODERATOR"].includes(session.user.role)) redirect(`/lfg/${id}`);
  return (
    <div className="container grid gap-6 py-8">
      <section className="panel grid gap-4 p-6">
        <h1 className="text-3xl font-black">Manage post</h1>
        <p className="muted">
          Full field editing is intentionally handled through the create flow in this version. Owners can refresh or close
          active listings here without changing campaign dates.
        </p>
        <div className="card p-4">
          <h2 className="font-black">{post.title}</h2>
          <p className="muted">{post.game.name}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={async () => {
            "use server";
            await refreshPost(id);
          }}>
            <button className="btn" type="submit">
              Refresh listing
            </button>
          </form>
          <form action={async () => {
            "use server";
            await closePost(id);
          }}>
            <button className="btn danger" type="submit">
              Close group
            </button>
          </form>
          <Link className="btn secondary" href={`/lfg/${id}`}>
            Back to post
          </Link>
        </div>
      </section>
    </div>
  );
}
