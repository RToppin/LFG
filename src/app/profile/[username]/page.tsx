export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { PostCard } from "@/components/PostCard";
import { prisma } from "@/lib/db";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await auth();
  const profile = await prisma.profile.findUnique({
    where: { username },
    include: {
      user: true,
      games: { include: { game: true }, orderBy: { favoriteOrder: "asc" } },
      availabilitySlots: true
    }
  });
  if (!profile) notFound();
  if (profile.visibility === "SIGNED_IN" && !session?.user) redirect("/login");
  const posts = await prisma.lfgPost.findMany({
    where: {
      ownerId: profile.userId,
      status: profile.showPastGroups ? undefined : "ACTIVE"
    },
    include: { game: true, owner: { include: { profile: true } } },
    orderBy: { updatedAt: "desc" },
    take: 12
  });
  return (
    <div className="container grid gap-6 py-8">
      <section className="panel grid gap-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">{profile.displayName}</h1>
            <p className="muted">@{profile.username}</p>
          </div>
          {profile.discordConnected ? <span className="tag">Discord connected</span> : null}
        </div>
        <p className="max-w-3xl whitespace-pre-wrap text-[var(--muted)]">{profile.bio || "No biography yet."}</p>
        <div className="grid-auto">
          <Info label="Region" value={profile.region} />
          <Info label="Time zone" value={profile.timeZone} />
          <Info label="Languages" value={profile.languages.join(", ")} />
          <Info label="Member since" value={profile.createdAt.toLocaleDateString()} />
        </div>
      </section>
      <section className="grid gap-4">
        <h2 className="text-2xl font-black">Games</h2>
        <div className="grid-auto">
          {profile.games.map((entry) => (
            <Link className="card p-4" href={`/games/${entry.game.slug}`} key={entry.id}>
              <h3 className="font-black">{entry.game.name}</h3>
              <p className="muted text-sm">
                {entry.platform.replaceAll("_", " ")} · {entry.experience} · {entry.canHost ? "Can host" : "Cannot host"}
              </p>
            </Link>
          ))}
        </div>
      </section>
      <section className="grid gap-4">
        <h2 className="text-2xl font-black">LFG posts</h2>
        {posts.length ? (
          <div className="grid-auto">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="panel p-6 text-[var(--muted)]">No visible posts.</div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <p className="text-xs font-black uppercase text-[var(--muted)]">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
