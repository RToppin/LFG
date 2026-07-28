export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/PostCard";
import { prisma } from "@/lib/db";

export default async function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
      platforms: true,
      editions: true,
      posts: {
        where: { status: "ACTIVE" },
        include: { game: true, owner: { include: { profile: true } } },
        orderBy: { refreshedAt: "desc" },
        take: 12
      }
    }
  });
  if (!game) notFound();
  return (
    <div className="container grid gap-6 py-8">
      <section className="panel overflow-hidden">
        <div className={`h-44 ${game.fallbackGradient}`} aria-hidden />
        <div className="grid gap-3 p-6">
          <h1 className="text-4xl font-black">{game.name}</h1>
          <p className="max-w-3xl text-[var(--muted)]">{game.description}</p>
          <div className="flex flex-wrap gap-2">
            {game.platforms.map((entry) => (
              <span className="tag" key={entry.id}>
                {entry.platform.replaceAll("_", " ")}
              </span>
            ))}
            {game.modSupport ? <span className="tag">Mod support</span> : null}
            {game.crossPlatform ? <span className="tag">Cross-platform</span> : null}
          </div>
          <Link href={`/discover?game=${game.slug}`} className="btn w-fit">
            Find groups
          </Link>
        </div>
      </section>
      <section className="grid gap-4">
        <h2 className="text-2xl font-black">Active posts</h2>
        {game.posts.length ? (
          <div className="grid-auto">
            {game.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="panel p-6 text-[var(--muted)]">No active groups for this game yet.</div>
        )}
      </section>
    </div>
  );
}
