export const dynamic = "force-dynamic";
import { Platform } from "@prisma/client";
import Link from "next/link";
import { DiscoverFilters } from "@/components/DiscoverFilters";
import { ExpandablePostCard } from "@/components/ExpandablePostCard";
import { auth } from "@/auth";
import { PLATFORM_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { firstSearchParam, parseSelectedGameSlugs, selectedGameNames, type SearchParamValue } from "@/lib/discover-filters";
import { calculateMatchScore } from "@/lib/matching";
import { getApprovedGamesForSelection } from "@/lib/game-catalog";

type DiscoverSearchParams = {
  q?: SearchParamValue;
  game?: SearchParamValue;
  games?: SearchParamValue;
  platform?: SearchParamValue;
  style?: SearchParamValue;
  sort?: SearchParamValue;
};

export default async function DiscoverPage({
  searchParams
}: {
  searchParams: Promise<DiscoverSearchParams>;
}) {
  const params = await searchParams;
  const session = await auth();
  const q = firstSearchParam(params.q)?.trim();
  const selectedPlatform = toPlatform(firstSearchParam(params.platform));
  const selectedStyle = firstSearchParam(params.style)?.trim();
  const sort = firstSearchParam(params.sort);
  const approvedGames = (await getApprovedGamesForSelection({ withCounts: true })).sort((a, b) => a.name.localeCompare(b.name));
  const approvedSlugs = new Set(approvedGames.map((game) => game.slug));
  const selectedSlugs = parseSelectedGameSlugs(params.game, params.games).filter((slug) => approvedSlugs.has(slug));
  const selectedNames = selectedGameNames(approvedGames, selectedSlugs);

  const posts = await prisma.lfgPost.findMany({
    where: {
      status: "ACTIVE",
      game: selectedSlugs.length
        ? { slug: { in: selectedSlugs }, approvalStatus: "APPROVED", isActive: true, listingEnabled: true }
        : { approvalStatus: "APPROVED", isActive: true, listingEnabled: true },
      playStyles: selectedStyle ? { has: selectedStyle } : undefined,
      AND: [
        selectedPlatform ? { OR: [{ platform: selectedPlatform }, { platforms: { has: selectedPlatform } }] } : {},
        q
          ? { OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { modpackName: { contains: q, mode: "insensitive" } },
            { game: { name: { contains: q, mode: "insensitive" } } }
          ] }
          : {}
      ]
    },
    include: { game: true, owner: { include: { profile: true } } },
    orderBy:
      sort === "starting-soon"
        ? [{ campaignStartsAt: "asc" }]
        : sort === "open-slots"
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
    <>
      <DiscoverFilters
        games={approvedGames}
        platform={selectedPlatform}
        platforms={Object.values(Platform).map((value) => ({ value, label: PLATFORM_LABELS[value] }))}
        q={q}
        selectedSlugs={selectedSlugs}
        sort={sort}
      />
      <div className="container grid gap-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">Live feed</p>
            <h1 className="text-3xl font-black">Find a group</h1>
            <p className="muted">
              {selectedNames.length ? `${selectedNames.join(", ")} selected.` : "No games selected, showing all games."}
            </p>
          </div>
          <Link className="btn" href="/lfg/new">Create a group</Link>
        </div>

        <section className="grid gap-4">
          <div>
            <h2 className="text-2xl font-black">{selectedNames.length ? "Selected game groups" : "Open groups"}</h2>
            <p className="muted">{posts.length} active {posts.length === 1 ? "group" : "groups"}</p>
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
                return <ExpandablePostCard key={post.id} post={post} match={match} />;
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
    </>
  );
}

function toPlatform(value?: string) {
  return Object.values(Platform).includes(value as Platform) ? (value as Platform) : undefined;
}