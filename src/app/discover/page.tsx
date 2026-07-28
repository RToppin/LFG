import { Platform } from "@prisma/client";
import { Search } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { calculateMatchScore } from "@/lib/matching";

export default async function DiscoverPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; game?: string; platform?: string; style?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const q = params.q?.trim();
  const posts = await prisma.lfgPost.findMany({
    where: {
      status: "ACTIVE",
      game: params.game ? { slug: params.game } : undefined,
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
          <h1 className="text-3xl font-black">Discover</h1>
          <p className="muted">Filter fresh LFG posts and inspect why recommendations fit.</p>
        </div>
        <form className="flex flex-wrap gap-2">
          <input className="input w-64" name="q" defaultValue={q} placeholder="Search games, tags, titles" />
          <select className="input w-44" name="platform" defaultValue={params.platform ?? ""}>
            <option value="">Any platform</option>
            {Object.values(Platform).map((platform) => (
              <option key={platform} value={platform}>
                {platform.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <select className="input w-44" name="sort" defaultValue={params.sort ?? ""}>
            <option value="">Recently refreshed</option>
            <option value="starting-soon">Starting soon</option>
            <option value="open-slots">Most open spots</option>
          </select>
          <button className="btn" type="submit">
            <Search size={18} aria-hidden />
            Search
          </button>
          <a className="btn secondary" href="/discover">
            Reset
          </a>
        </form>
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
          <p className="font-black">No active posts match those filters.</p>
          <p className="muted">Reset filters or create the first group for your game.</p>
        </div>
      )}
    </div>
  );
}
