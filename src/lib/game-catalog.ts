import { GameApprovalStatus, GameSource, Platform, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

export const APPROVED_GAME_ERROR = "This game is not currently approved for LFG listings.";

export const TEST_FIXTURE_GAME_NAME_FILTER: Prisma.GameWhereInput[] = [
  { name: { contains: "Integration Game", mode: "insensitive" } },
  { name: { contains: "Duplicate Match Game", mode: "insensitive" } }
];

export type CatalogGameForSelector = {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  coverImageUrl: string | null;
  fallbackGradient: string;
  aliases: string[];
  platforms: Array<{ platform: Platform }>;
  categories: Array<{ category: { name: string; slug: string } }>;
  _count?: { posts: number; userGames?: number };
};

export function normalizeGameName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u2122\u00ae\u00a9]/g, "")
    .replace(/tm(?=\s|\d|$)/gi, "")
    .replace(/[^\w\s:&.'+-]/g, "")
    .replace(/\b(tm|the)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeGameSlug(value: string) {
  return normalizeGameName(value)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueAliases(name: string, aliases: string[] = []) {
  const values = [name, ...aliases].map((alias) => alias.trim()).filter(Boolean);
  const seen = new Set<string>();
  return values.filter((alias) => {
    const key = normalizeGameSlug(alias);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function stableGameGradient(slug: string) {
  const gradients = [
    "bg-gradient-to-br from-cyan-500 to-slate-950",
    "bg-gradient-to-br from-emerald-500 to-stone-950",
    "bg-gradient-to-br from-amber-500 to-zinc-950",
    "bg-gradient-to-br from-rose-500 to-neutral-950",
    "bg-gradient-to-br from-sky-500 to-indigo-950",
    "bg-gradient-to-br from-lime-500 to-fuchsia-950",
    "bg-gradient-to-br from-red-500 to-stone-950",
    "bg-gradient-to-br from-teal-500 to-gray-950"
  ];
  const index = [...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
}

export function isGameListingAvailable(game: {
  approvalStatus: GameApprovalStatus | string;
  isActive: boolean;
  listingEnabled: boolean;
}) {
  return game.approvalStatus === "APPROVED" && game.isActive && game.listingEnabled;
}

export function assertGameListingAvailable(game: {
  approvalStatus: GameApprovalStatus | string;
  isActive: boolean;
  listingEnabled: boolean;
} | null) {
  if (!game || !isGameListingAvailable(game)) {
    throw new Error(APPROVED_GAME_ERROR);
  }
}

export async function getApprovedGamesForSelection(
  options: { withCounts?: boolean; onlyWithActiveListings?: boolean; excludeTestFixtures?: boolean } = {}
) {
  const where: Prisma.GameWhereInput = {
    approvalStatus: "APPROVED",
    isActive: true,
    listingEnabled: true,
    posts: options.onlyWithActiveListings ? { some: { status: "ACTIVE" } } : undefined,
    NOT: options.excludeTestFixtures ? TEST_FIXTURE_GAME_NAME_FILTER : undefined
  };
  const games = await prisma.game.findMany({
    where,
    include: {
      platforms: { orderBy: { platform: "asc" } },
      categories: { include: { category: true } },
      _count: options.withCounts ? { select: { posts: { where: { status: "ACTIVE" } }, userGames: true } } : false
    },
    orderBy: [{ sourceRank: "asc" }, { name: "asc" }]
  });
  return games as CatalogGameForSelector[];
}

export async function requireApprovedListingGame(gameId: string, client: Pick<PrismaClient, "game"> = prisma) {
  const game = await client.game.findUnique({
    where: { id: gameId },
    select: { id: true, approvalStatus: true, isActive: true, listingEnabled: true }
  });
  assertGameListingAvailable(game);
  return game;
}

export async function findProbableGameMatch(requestedName: string, client: Pick<PrismaClient, "game" | "gameRequest"> = prisma) {
  const normalized = normalizeGameSlug(requestedName);
  if (!normalized) return null;
  const games = await client.game.findMany({
    where: {
      OR: [
        { slug: normalized },
        { name: { equals: requestedName, mode: "insensitive" } },
        { aliases: { hasSome: uniqueAliases(requestedName) } }
      ]
    },
    take: 1
  });
  if (games[0]) return { type: "game" as const, id: games[0].id, name: games[0].name };
  const pending = await client.gameRequest.findFirst({
    where: { normalizedName: normalized, status: "PENDING" },
    select: { id: true, requestedName: true }
  });
  return pending ? { type: "request" as const, id: pending.id, name: pending.requestedName } : null;
}

export function buildGameMergePlan(sourceGameId: string, targetGameId: string) {
  if (sourceGameId === targetGameId) {
    throw new Error("Choose two different games to merge.");
  }
  return [
    { model: "UserGame", action: "move unique profile game preferences" },
    { model: "LfgPost", action: "move LFG posts" },
    { model: "SavedPost", action: "preserve through moved posts" },
    { model: "DismissedRecommendation", action: "preserve through moved posts" },
    { model: "GameRequest", action: "attach requests to canonical game" },
    { model: "Game", action: "archive duplicate source game" }
  ];
}

export async function mergeGames(sourceGameId: string, targetGameId: string, actorId: string) {
  buildGameMergePlan(sourceGameId, targetGameId);
  await prisma.$transaction(async (tx) => {
    const [source, target] = await Promise.all([
      tx.game.findUnique({ where: { id: sourceGameId }, include: { categories: true, platforms: true } }),
      tx.game.findUnique({ where: { id: targetGameId } })
    ]);
    if (!source || !target) throw new Error("Both games must exist before merging.");

    const userGames = await tx.userGame.findMany({ where: { gameId: sourceGameId } });
    for (const userGame of userGames) {
      await tx.userGame.upsert({
        where: {
          profileId_gameId_platform: {
            profileId: userGame.profileId,
            gameId: targetGameId,
            platform: userGame.platform
          }
        },
        create: {
          userId: userGame.userId,
          profileId: userGame.profileId,
          gameId: targetGameId,
          platform: userGame.platform,
          experience: userGame.experience,
          playStyles: userGame.playStyles,
          canHost: userGame.canHost,
          usesMods: userGame.usesMods,
          edition: userGame.edition,
          notifications: userGame.notifications,
          favoriteOrder: userGame.favoriteOrder,
          recommendationsEnabled: userGame.recommendationsEnabled
        },
        update: {
          playStyles: Array.from(new Set(userGame.playStyles)),
          canHost: userGame.canHost,
          usesMods: userGame.usesMods,
          notifications: userGame.notifications
        }
      });
      await tx.userGame.delete({ where: { id: userGame.id } });
    }

    await tx.lfgPost.updateMany({ where: { gameId: sourceGameId }, data: { gameId: targetGameId } });
    await tx.gameRequest.updateMany({ where: { probableGameId: sourceGameId }, data: { probableGameId: targetGameId } });
    for (const platform of source.platforms) {
      await tx.gamePlatform.upsert({
        where: { gameId_platform: { gameId: targetGameId, platform: platform.platform } },
        create: { gameId: targetGameId, platform: platform.platform },
        update: {}
      });
    }
    for (const category of source.categories) {
      await tx.gameCategoryOnGame.upsert({
        where: { gameId_categoryId: { gameId: targetGameId, categoryId: category.categoryId } },
        create: { gameId: targetGameId, categoryId: category.categoryId },
        update: {}
      });
    }
    await tx.game.update({
      where: { id: sourceGameId },
      data: {
        approvalStatus: "ARCHIVED",
        isActive: false,
        active: false,
        listingEnabled: false,
        aliases: uniqueAliases(target.name, source.aliases.concat(target.aliases))
      }
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "merge-games",
        targetType: "Game",
        targetId: targetGameId,
        metadata: { sourceGameId }
      }
    });
  });
}

export function gameSourceLabel(source: GameSource | string) {
  return source === "STEAM" ? "Steam-ranked seed" : source.toString().replace("_", " ").toLowerCase();
}
