export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PostCard } from "@/components/PostCard";
import { prisma } from "@/lib/db";

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const saved = await prisma.savedPost.findMany({
    where: { userId: session.user.id },
    include: { post: { include: { game: true, owner: { include: { profile: true } } } } },
    orderBy: { createdAt: "desc" }
  });
  return (
    <div className="container grid gap-6 py-8">
      <h1 className="text-3xl font-black">Saved posts</h1>
      {saved.length ? (
        <div className="grid-auto">
          {saved.map((entry) => (
            <PostCard key={entry.id} post={entry.post} />
          ))}
        </div>
      ) : (
        <div className="panel p-6 text-[var(--muted)]">Saved groups will appear here.</div>
      )}
    </div>
  );
}
