export const dynamic = "force-dynamic";
import { Platform } from "@prisma/client";
import { Search } from "lucide-react";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { DiscoverGameFilter } from "@/components/DiscoverGameFilter";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { calculateMatchScore } from "@/lib/matching";
import { getApprovedGamesForSelection } from "@/lib/game-catalog";

export default async function DiscoverPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; game?: string; platform?: string; style?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const q = params.q?.trim();
  const approvedGames = await getApprovedGamesForSelection({ withCounts: true });
  const selectedGame = params.game ? approvedGames.find((game) => game.slug === params.game) : null;
  const posts = await prisma.lfgPost.findMany({
    where: {
      status: "ACTIVE",
      game: params.game
        ? { slug: params.game, approvalStatus: "APPROVED", isActive: true, listingEnabled: true }
        : { approvalStatus: "APPROVED", isActive: true, listingEnabled: true },
      platform: params.platform ? (params.platform as Platform) : undefined,
      playStyles: params.style ? { has: params.style } : undefined,
      OR: q
        ? [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { modpackName: { contains: q, mode: "insensitive" } },
            { game: { name: { contains: q, mode: "insensitive" } } }
          ]
        : undefined
    },
    include: { game: true, owner: { include: { profile: true } } },
    orderBy:
      params.sort === "starting-soon"
        ? [{ campaignStartsAt: "asc" }]
        : params.sort === "open-slots"
          ? [{ maxPlayers: "desc" }]
          : [{ refreshedAt: "desc" }],
    take: 60
  });
  const profile = session?.user.id
    ? await prisma.profile.findUnique({
        where: { userId: session.user.id },
        include: { games: true, availabilitySlots: true }
      })
    : null;
  const blocks = session?.user.id
    ? await prisma.block.findMany({
        where: { OR: [{ blockerId: session.user.id }, { blockedId: session.user.id }] }
      })
    : [];

  return (
    <div className="container grid gap-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">Live feed</p>
          <h1 className="text-3xl font-black">Find a group</h1>
          <p className="muted">Choose a game and scan the open groups available right now.</p>
        </div>
        <Link className="btn" href="/lfg/new">Create a group</Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[22rem_1fr] lg:items-start">
        <form className="panel grid gap-4 p-4">
          <DiscoverGameFilter games={approvedGames} selectedSlug={params.game} />
          <div className="grid gap-3 border-t border-[var(--line)] pt-4">
            <label className="field">
              <span>Search open groups</span>
              <input className="input" name="q" defaultValue={q} placeholder="Title, description, modpack" />
            </label>
            <label className="field">
              <span>Platform</span>
              <select className="input" name="platform" defaultValue={params.platform ?? ""}>
                <option value="">Any platform</option>
                {Object.values(Platform).map((platform) => (
                  <option key={platform} value={platform}>
                    {platform.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Sort</span>
              <select className="input" name="sort" defaultValue={params.sort ?? ""}>
                <option value="">Recently refreshed</option>
                <option value="starting-soon">Starting soon</option>
                <option value="open-slots">Most open spots</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button className="btn" type="submit">
                <Search size={18} aria-hidden />
                Update feed
              </button>
              <Link className="btn secondary" href="/discover">Reset</Link>
            </div>
          </div>
        </form>

        <section className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">{selectedGame ? `${selectedGame.name} groups` : "Open groups"}</h2>
              <p className="muted">{posts.length} active {posts.length === 1 ? "group" : "groups"}</p>
            </div>
            {selectedGame ? <Link className="btn secondary" href={`/games/${selectedGame.slug}`}>Game page</Link> : null}
          </div>
          {posts.length ? (
            <div className="grid-auto">
              {posts.map((post) => {
                const match =
                  profile && session?.user.id
                    ? calculateMatchScore(
                        {
                          games: profile.games,
                          languages: profile.languages,
                          playStyles: profile.playStyles,
                          availability: profile.availabilitySlots,
                          blockedUserIds: blocks.map((block) =>
                            block.blockerId === session.user.id ? block.blockedId : block.blockerId
                          )
                        },
                        post,
                        session.user.id
                      )
                    : undefined;
                return <PostCard key={post.id} post={post} match={match} />;
              })}
            </div>
          ) : (
            <div className="panel p-8 text-center">
              <p className="font-black">No open groups match those filters.</p>
              <p className="muted">Start the first group for this game or reset the feed.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
