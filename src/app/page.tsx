export const dynamic = "force-dynamic";
import { ArrowRight, Search, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PostCard } from "@/components/PostCard";

export default async function HomePage() {
  const posts = await prisma.lfgPost.findMany({
    where: { status: "ACTIVE" },
    include: { game: true, owner: { include: { profile: true } } },
    orderBy: [{ refreshedAt: "desc" }],
    take: 3
  });

  return (
    <div className="container grid gap-10 py-10">
      <section className="grid gap-7 py-8 lg:grid-cols-[1fr_0.85fr] lg:items-end">
        <div className="grid gap-5">
          <p className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">ReadyLobby</p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">
            Find the right players before you ready up.
          </h1>
          <p className="max-w-2xl text-lg text-[var(--muted)]">
            Pick a game, scan open groups, and move the actual conversation to Discord
            only after the group makes sense.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn" href="/discover">
              <Search size={18} aria-hidden />
              Discover groups
            </Link>
            <Link className="btn secondary" href="/lfg/new">
              Create a post
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </div>
        <div className="panel grid gap-4 p-5">
          {[
            ["Rule-based matches", "Games, platforms, play styles, languages, hosting, and availability."],
            ["Fresh listings", "Posts expire after seven days unless refreshed by the owner."],
            ["Private Discord links", "Invites stay hidden until approval when owners choose private access."]
          ].map(([title, body]) => (
            <div className="flex gap-3" key={title}>
              <ShieldCheck className="mt-1 text-[var(--accent)]" size={20} aria-hidden />
              <div>
                <h2 className="font-black">{title}</h2>
                <p className="text-sm text-[var(--muted)]">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black">Fresh groups</h2>
          <Link href="/discover" className="text-sm font-bold text-[var(--accent)]">
            View all
          </Link>
        </div>
        {posts.length ? (
          <div className="grid-auto">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="panel flex items-center gap-3 p-6">
            <Users className="text-[var(--accent)]" aria-hidden />
            <p className="muted">Seed the database to see ready-to-join groups here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
