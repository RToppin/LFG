import Link from "next/link";
import { GameCover } from "@/components/GameCover";
import { prisma } from "@/lib/db";

export default async function SocialPage() {
  const projectZomboid = await prisma.game.findFirst({
    where: { slug: "project-zomboid", approvalStatus: "APPROVED", isActive: true },
    include: { _count: { select: { socialPosts: { where: { status: "ACTIVE" } } } } }
  });
  const recentPosts = await prisma.socialPost.findMany({
    where: { status: "ACTIVE" },
    include: { game: true, author: { include: { profile: true } }, projectZomboidRun: true, _count: { select: { comments: true } } },
    orderBy: { createdAt: "desc" },
    take: 12
  });

  return (
    <div className="container grid max-w-5xl gap-0 py-8">
      <header className="sticky top-0 z-10 border-x border-t border-[var(--line)] bg-[#0b1018]/95 p-4 backdrop-blur">
        <p className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">Social</p>
        <h1 className="text-3xl font-black">Live game feed</h1>
        <p className="muted">Runs, screenshots, progression, and comments by game.</p>
      </header>

      {projectZomboid ? (
        <Link className="grid border-x border-t border-[var(--line)] bg-[#0d131c] transition hover:bg-[#101824] md:grid-cols-[9rem_1fr]" href="/social/project-zomboid">
          <GameCover game={projectZomboid} className="h-32 md:h-full" initialsClassName="text-3xl" />
          <div className="grid gap-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">Project Zomboid</h2>
              <span className="tag">{projectZomboid._count.socialPosts} posts</span>
            </div>
            <p className="text-sm text-[var(--muted)]">Survival run stats, character stories, approved screenshots, and future leaderboard verification.</p>
          </div>
        </Link>
      ) : null}

      <section className="border border-[var(--line)]">
        {recentPosts.length ? recentPosts.map((post) => (
          <Link className="grid grid-cols-[3rem_1fr] gap-3 border-b border-[var(--line)] p-4 transition last:border-b-0 hover:bg-[#101824]" href={`/social/${post.game.slug}`} key={post.id}>
            <GameCover game={post.game} className="size-12 rounded-lg" initialsClassName="text-sm" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <strong>{post.author.profile?.displayName ?? post.author.name ?? "Player"}</strong>
                <span className="text-sm text-[var(--muted)]">{post.game.name}</span>
                <span className="text-sm text-[var(--muted)]">{post.createdAt.toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-[var(--muted)]">{post.body}</p>
              {post.projectZomboidRun ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[var(--muted)]">
                  <span className="tag">{post.projectZomboidRun.characterName}</span>
                  <span className="tag">{post.projectZomboidRun.zombieKills.toLocaleString()} kills</span>
                  <span className="tag">{post.projectZomboidRun.daysSurvived.toLocaleString()} days</span>
                </div>
              ) : null}
              <p className="mt-3 text-sm text-[var(--muted)]">{post._count.comments} comments</p>
            </div>
          </Link>
        )) : (
          <div className="p-6 text-[var(--muted)]">No social posts yet.</div>
        )}
      </section>
    </div>
  );
}
