export const dynamic = "force-dynamic";
import { Platform } from "@prisma/client";
import { PendingLink } from "@/components/PendingLink";
import { DiscoverGameFilter } from "@/components/DiscoverGameFilter";
import { ExpandablePostRows } from "@/components/ExpandablePostRows";
import { SavedDiscoverFilters } from "@/components/SavedDiscoverFilters";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { calculateMatchScore } from "@/lib/matching";
import { getApprovedGamesForSelection, TEST_FIXTURE_GAME_NAME_FILTER } from "@/lib/game-catalog";

type DiscoverParams = { q?: string; game?: string | string[]; platform?: string; style?: string; sort?: string };

export default async function DiscoverPage({
  searchParams
}: {
  searchParams: Promise<DiscoverParams>;
}) {
  const params = await searchParams;
  const session = await auth();
  const q = params.q?.trim();
  const approvedGames = await getApprovedGamesForSelection({ withCounts: true, excludeTestFixtures: true });
  const selectedGameSlugs = uniqueValues(Array.isArray(params.game) ? params.game : params.game ? [params.game] : []).filter((slug) =>
    approvedGames.some((game) => game.slug === slug)
  );
  const selectedGames = approvedGames.filter((game) => selectedGameSlugs.includes(game.slug));
  const hasFilters = Boolean(q || selectedGameSlugs.length || params.platform || params.style || params.sort);
  const gameWhere = {
    approvalStatus: "APPROVED" as const,
    isActive: true,
    listingEnabled: true,
    NOT: TEST_FIXTURE_GAME_NAME_FILTER,
    ...(selectedGameSlugs.length ? { slug: { in: selectedGameSlugs } } : {})
  };
  const posts = await prisma.lfgPost.findMany({
    where: {
      status: "ACTIVE",
      game: gameWhere,
      playStyles: params.style ? { has: params.style } : undefined,
      AND: [
        params.platform ? { OR: [{ platform: params.platform as Platform }, { platforms: { has: params.platform as Platform } }] } : {},
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
      params.sort === "starting-soon"
        ? [{ campaignStartsAt: "asc" }]
        : params.sort === "open-slots"
          ? [{ maxPlayers: "desc" }]
          : [{ refreshedAt: "desc" }],
    take: 80
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
  const matchById = new Map(
    posts.map((post) => [
      post.id,
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
        : undefined
    ])
  );

  return (
    <div className="container grid gap-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">Live feed</p>
          <h1 className="text-3xl font-black">Find a group</h1>
          <p className="muted">Select one game, several games, or scan every open group at once.</p>
        </div>
        <PendingLink className="btn" href="/lfg/new" pendingLabel="Opening form...">Create a group</PendingLink>
      </div>

      <form className="panel grid gap-4 p-4">
        <DiscoverGameFilter games={approvedGames} selectedSlugs={selectedGameSlugs} />
        <div className="grid gap-3 border-t border-[var(--line)] pt-4 md:grid-cols-[1fr_14rem_14rem_auto] md:items-end">
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
          <SavedDiscoverFilters hasFilters={hasFilters} />
        </div>
      </form>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">{selectedGames.length ? `${selectedGames.map((game) => game.name).join(", ")} groups` : "Open groups"}</h2>
            <p className="muted">{posts.length} active {posts.length === 1 ? "group" : "groups"}</p>
          </div>
        </div>
        {posts.length ? (
          <ExpandablePostRows posts={posts} matchById={matchById} />
        ) : (
          <div className="panel p-8 text-center">
            <p className="font-black">No open groups match those filters.</p>
            <p className="muted">Start the first group for this game or reset the feed.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
