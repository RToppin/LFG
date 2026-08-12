export const dynamic = "force-dynamic";
import { Platform } from "@prisma/client";
import Link from "next/link";
import { DiscoverGameFilter } from "@/components/DiscoverGameFilter";
import { ExpandableLfgCard } from "@/components/ExpandableLfgCard";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { calculateMatchScore } from "@/lib/matching";
import { getApprovedGamesForSelection } from "@/lib/game-catalog";

type DiscoverSearchParams = {
  q?: string;
  game?: string | string[];
  platform?: string | string[];
  style?: string;
  sort?: string;
};

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<DiscoverSearchParams> }) {
  const params = await searchParams;
  const session = await auth();
  const q = params.q?.trim();
  const approvedGames = await getApprovedGamesForSelection({ withCounts: true });
  const selectedGameSlugs = valuesFromParam(params.game).filter((slug) => approvedGames.some((game) => game.slug === slug));
  const selectedPlatforms = valuesFromParam(params.platform).filter(isPlatform);
  const selectedGames = approvedGames.filter((game) => selectedGameSlugs.includes(game.slug));

  const posts = await prisma.lfgPost.findMany({
    where: {
      status: "ACTIVE",
      game: {
        slug: selectedGameSlugs.length ? { in: selectedGameSlugs } : undefined,
        approvalStatus: "APPROVED",
        isActive: true,
        listingEnabled: true
      },
      playStyles: params.style ? { has: params.style } : undefined,
      AND: [
        selectedPlatforms.length
          ? { OR: [{ platform: { in: selectedPlatforms } }, { platforms: { hasSome: selectedPlatforms } }] }
          : {},
        q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { modpackName: { contains: q, mode: "insensitive" } },
                { game: { name: { contains: q, mode: "insensitive" } } }
              ]
            }
          : {}
      ]
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
  const blockedUserIds = session?.user.id
    ? blocks.map((block) => (block.blockerId === session.user.id ? block.blockedId : block.blockerId))
    : [];

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">Live feed</p>
            <h1 className="text-3xl font-black">Find a group</h1>
            <p className="muted">Search open groups, choose several games, or narrow by platform.</p>
          </div>
          <Link className="btn" href="/lfg/new">
            Create a group
          </Link>
        </div>

        <DiscoverGameFilter
          games={approvedGames}
          q={q}
          selectedPlatforms={selectedPlatforms}
          selectedSlugs={selectedGameSlugs}
          sort={params.sort}
        />

        <section className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">
                {selectedGames.length === 1 ? `${selectedGames[0].name} groups` : selectedGames.length ? `${selectedGames.length} selected games` : "Open groups"}
              </h2>
              <p className="muted">
                {posts.length} active {posts.length === 1 ? "group" : "groups"}
              </p>
            </div>
            {selectedGames.length === 1 ? (
              <Link className="btn secondary" href={`/games/${selectedGames[0].slug}`}>
                Game page
              </Link>
            ) : null}
          </div>
          {posts.length ? (
            <div className="grid gap-3">
              {posts.map((post) => {
                const match =
                  profile && session?.user.id
                    ? calculateMatchScore(
                        {
                          games: profile.games,
                          languages: profile.languages,
                          playStyles: profile.playStyles,
                          availability: profile.availabilitySlots,
                          blockedUserIds
                        },
                        post,
                        session.user.id
                      )
                    : undefined;
                return <ExpandableLfgCard key={post.id} post={post} match={match} context={post.game.name} />;
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

function valuesFromParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);
}

function isPlatform(value: string): value is Platform {
  return Object.values(Platform).includes(value as Platform);
}
