import { MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { createProjectZomboidSocialPost, createSocialComment } from "@/app/actions";
import { auth } from "@/auth";
import { ActionForm } from "@/components/ActionForm";
import { GameCover } from "@/components/GameCover";
import { prisma } from "@/lib/db";
import { isMissingPrismaTableError } from "@/lib/prisma-errors";

export default async function ProjectZomboidSocialPage() {
  const session = await auth();
  const game = await prisma.game.findFirst({
    where: { slug: "project-zomboid", approvalStatus: "APPROVED", isActive: true }
  });
  if (!game) notFound();
  const feed = await loadProjectZomboidFeed(game.id);

  return (
    <div className="container grid max-w-5xl gap-0 py-8">
      <header className="sticky top-0 z-10 border-x border-t border-[var(--line)] bg-[#0b1018]/95 p-4 backdrop-blur">
        <div className="grid grid-cols-[4rem_1fr] gap-3">
          <GameCover game={game} className="size-16 rounded-lg" initialsClassName="text-lg" />
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">Project Zomboid</p>
            <h1 className="text-3xl font-black">Run feed</h1>
            <p className="muted">Share survival progress, approved screenshots, settings, and comments.</p>
          </div>
        </div>
      </header>

      {feed.unavailable ? (
        <section className="border-x border-t border-[var(--line)] p-4 text-[var(--muted)]">Social is finishing setup. Check back after the current deployment finishes.</section>
      ) : session?.user && session.user.status === "ACTIVE" ? (
        <section className="border-x border-t border-[var(--line)] bg-[#0d131c] p-4">
          <ActionForm action={createProjectZomboidSocialPost} className="grid gap-4" submitLabel="Post">
            <label className="field">
              <span>Progress note</span>
              <textarea className="input min-h-24 resize-y border-0 bg-[#0b1018] text-base" name="body" placeholder="What happened on this run?" required />
            </label>
            <div className="grid-auto">
              <label className="field"><span>Character</span><input className="input" name="characterName" required /></label>
              <label className="field"><span>Kills</span><input className="input" min="0" name="zombieKills" type="number" defaultValue="0" required /></label>
              <label className="field"><span>Days survived</span><input className="input" min="0" name="daysSurvived" type="number" defaultValue="0" required /></label>
            </div>
            <label className="field"><span>Game settings</span><input className="input" name="gameSettings" placeholder="Apocalypse, no mods, Muldraugh start" required /></label>
            <div className="rounded-lg border border-[var(--line)] bg-[#0b1018] p-3 text-sm text-[var(--muted)]">
              Pictures are coming soon. For now, share your run with text and stats only.
            </div>
          </ActionForm>
        </section>
      ) : (
        <section className="border-x border-t border-[var(--line)] p-4 text-[var(--muted)]">Sign in to post a Project Zomboid run.</section>
      )}

      <section className="border border-[var(--line)]">
        {feed.posts.length ? feed.posts.map((post) => {
          const run = post.projectZomboidRun;
          return (
            <article className="grid grid-cols-[3rem_1fr] gap-3 border-b border-[var(--line)] p-4 last:border-b-0" key={post.id}>
              <div className="grid size-12 place-items-center rounded-lg bg-[var(--panel-strong)] text-sm font-black text-white">
                {(post.author.profile?.displayName ?? post.author.name ?? "P").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <strong>{post.author.profile?.displayName ?? post.author.name ?? "Player"}</strong>
                    <span className="text-sm text-[var(--muted)]">{post.createdAt.toLocaleString()}</span>
                  </div>
                  {run ? <span className="tag">{run.verificationStatus.replaceAll("_", " ")}</span> : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[var(--muted)]">{post.body}</p>
                {run ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="tag">{run.characterName}</span>
                    <span className="tag">{run.zombieKills.toLocaleString()} kills</span>
                    <span className="tag">{run.daysSurvived.toLocaleString()} days survived</span>
                    <span className="tag">{run.gameSettings}</span>
                  </div>
                ) : null}
                {post.imageUrl && post.imageStatus === "APPROVED" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="Approved Project Zomboid progress screenshot" className="mt-4 max-h-[30rem] w-full rounded-lg border border-[var(--line)] object-cover" src={post.imageUrl} />
                ) : post.imageUrl && post.imageStatus === "PENDING" ? (
                  <p className="tag mt-4 w-fit">Screenshot pending review</p>
                ) : null}
                <div className="mt-4 grid gap-3 border-t border-[var(--line)] pt-4">
                  <h2 className="flex items-center gap-2 text-sm font-black text-[var(--muted)]"><MessageSquare size={16} aria-hidden /> Replies</h2>
                  {post.comments.length ? post.comments.map((comment) => (
                    <div className="grid grid-cols-[2rem_1fr] gap-2" key={comment.id}>
                      <div className="grid size-8 place-items-center rounded-full bg-[#121b28] text-xs font-black">
                        {(comment.author.profile?.displayName ?? comment.author.name ?? "P").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="rounded-lg bg-[#0d131c] p-3">
                        <p className="text-sm font-bold">{comment.author.profile?.displayName ?? comment.author.name ?? "Player"}</p>
                        <p className="text-sm text-[var(--muted)]">{comment.body}</p>
                      </div>
                    </div>
                  )) : <p className="muted text-sm">No replies yet.</p>}
                  {session?.user && session.user.status === "ACTIVE" ? (
                    <ActionForm action={createSocialComment} className="grid gap-2" submitLabel="Reply">
                      <input name="postId" type="hidden" value={post.id} />
                      <label className="field"><span>Add reply</span><input className="input" name="body" maxLength={500} required /></label>
                    </ActionForm>
                  ) : null}
                </div>
              </div>
            </article>
          );
        }) : <div className="p-6 text-[var(--muted)]">No Project Zomboid runs have been posted yet.</div>}
      </section>
    </div>
  );
}

async function loadProjectZomboidFeed(gameId: string) {
  try {
    const posts = await prisma.socialPost.findMany({
      where: { gameId, status: "ACTIVE" },
      include: {
        author: { include: { profile: true } },
        comments: { where: { deletedAt: null }, include: { author: { include: { profile: true } } }, orderBy: { createdAt: "asc" }, take: 8 },
        projectZomboidRun: true
      },
      orderBy: { createdAt: "desc" },
      take: 30
    });
    return { unavailable: false, posts };
  } catch (error) {
    if (!isMissingPrismaTableError(error)) throw error;
    return { unavailable: true, posts: [] };
  }
}
