import { PrismaPg } from "@prisma/adapter-pg";
import { GameSource, Platform, PrismaClient } from "@prisma/client";
import { calculateExpirationDate } from "../src/lib/time";
import { CATALOG_SOURCE_DATE, GAME_CATEGORIES, STEAM_COOP_CATALOG, type SeedCatalogGame } from "../src/lib/steam-catalog";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://lfg:lfg@localhost:5432/lfg?schema=public" });
const prisma = new PrismaClient({ adapter });

const curatedGames: Array<Omit<SeedCatalogGame, "sourceRank"> & { source: GameSource }> = [
  {
    name: "Minecraft Java Edition",
    description: "Mod-friendly sandbox survival for servers, realms, builders, and progression groups.",
    source: "CURATED",
    aliases: ["Minecraft Java", "MC Java"],
    categories: ["Sandbox", "Survival crafting", "Dedicated-server game"],
    platforms: [Platform.PC],
    supportsDedicatedServers: true,
    minimumPlayers: 2
  },
  {
    name: "Minecraft Bedrock Edition",
    description: "Cross-platform Minecraft for console, mobile, PC, and realm-based play.",
    source: "CURATED",
    aliases: ["Minecraft Bedrock", "MC Bedrock"],
    categories: ["Sandbox", "Survival crafting"],
    platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.NINTENDO_SWITCH, Platform.CROSS_PLATFORM],
    supportsCrossplay: true,
    minimumPlayers: 2
  },
  {
    name: "ARK: Survival Ascended",
    description: "Modern ARK survival with fresh servers and new long-term tribe starts.",
    source: "CURATED",
    aliases: ["ARK Ascended", "ASA"],
    categories: ["Survival crafting", "Dedicated-server game"],
    platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.CROSS_PLATFORM],
    supportsCrossplay: true,
    supportsDedicatedServers: true,
    minimumPlayers: 2
  }
];

async function main() {
  const summary = {
    approvedGamesCreated: 0,
    approvedGamesUpdated: 0,
    existingCuratedGamesPreserved: 0,
    duplicatesSkipped: 0
  };

  for (const category of GAME_CATEGORIES) {
    await prisma.gameCategory.upsert({
      where: { slug: normalizeGameSlug(category) },
      create: { name: category, slug: normalizeGameSlug(category) },
      update: { name: category }
    });
  }

  for (const game of curatedGames) {
    const existed = await upsertCatalogGame({ ...game, sourceRank: undefined }, "CURATED");
    if (existed) summary.existingCuratedGamesPreserved += 1;
    else summary.approvedGamesCreated += 1;
  }

  for (const game of STEAM_COOP_CATALOG) {
    const existed = await upsertCatalogGame(game, "STEAM");
    if (existed) summary.approvedGamesUpdated += 1;
    else summary.approvedGamesCreated += 1;
  }

  const alex = await upsertPlayer("alex@example.com", "Alex", "alex", "Alex", "USER");
  const sam = await upsertPlayer("sam@example.com", "Sam", "sam", "Sam", "USER");
  const mod = await upsertPlayer("mod@example.com", "Morgan Mod", "morganmod", "Morgan", "MODERATOR");
  await upsertPlayer("admin@example.com", "Ada Admin", "adaadmin", "Ada", "ADMIN");

  const minecraft = await prisma.game.findUniqueOrThrow({ where: { slug: "minecraft-java-edition" } });
  const valheim = await prisma.game.findUniqueOrThrow({ where: { slug: "valheim" } });
  const zomboid = await prisma.game.findUniqueOrThrow({ where: { slug: "project-zomboid" } });

  await addUserGame(alex.id, minecraft.id, ["Casual", "Building", "Vanilla"]);
  await addUserGame(alex.id, valheim.id, ["Exploration", "Progression", "PvE"]);
  await addUserGame(sam.id, minecraft.id, ["Casual", "Building", "Beginner-friendly"]);
  await addUserGame(sam.id, zomboid.id, ["Roleplay", "Modded", "Long-term world"]);

  const now = new Date();
  await createPost({
    ownerId: alex.id,
    gameId: minecraft.id,
    title: "Two-week vanilla realm, relaxed evening builders",
    description:
      "Starting a small survival world for adults who like building, light progression, and no pressure. Discord invite is private until approval.",
    playStyles: ["Casual", "Building", "Vanilla", "Beginner-friendly"],
    platform: Platform.PC,
    startsAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
    inviteUrl: "https://discord.gg/minecraft"
  });
  await createPost({
    ownerId: sam.id,
    gameId: valheim.id,
    title: "Fresh Valheim world, boss progression twice a week",
    description:
      "Looking for players who want a long-term world with shared bases, exploration nights, and steady boss progression.",
    playStyles: ["Exploration", "Progression", "PvE", "Long-term world"],
    platform: Platform.CROSS_PLATFORM,
    startsAt: new Date(now.getTime() + 72 * 60 * 60 * 1000),
    inviteUrl: "https://discord.gg/valheim",
    publicInvite: true
  });
  await createPost({
    ownerId: mod.id,
    gameId: zomboid.id,
    title: "Project Zomboid RP safehouse weekend start",
    description:
      "Light roleplay, modded server, shared safehouse, and new-character friendly survival planning.",
    playStyles: ["Roleplay", "Modded", "Long-term world"],
    platform: Platform.PC,
    startsAt: new Date(now.getTime() + 96 * 60 * 60 * 1000),
    inviteUrl: "https://discord.gg/zomboid"
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: alex.id,
        type: "RECOMMENDED_POST",
        title: "New Valheim recommendation",
        body: "A fresh Valheim world matches your exploration and PvE preferences.",
        link: "/discover"
      },
      {
        userId: sam.id,
        type: "POST_EXPIRING_SOON",
        title: "Post expiring soon",
        body: "Refresh your active post to keep it in Discover.",
        link: "/groups/owned"
      }
    ],
    skipDuplicates: true
  });

  console.log(`Approved game catalog source date: ${CATALOG_SOURCE_DATE}`);
  console.log(`Approved games created: ${summary.approvedGamesCreated}`);
  console.log(`Approved games updated: ${summary.approvedGamesUpdated}`);
  console.log(`Existing curated games preserved: ${summary.existingCuratedGamesPreserved}`);
  console.log(`Duplicates skipped: ${summary.duplicatesSkipped}`);
}

async function upsertCatalogGame(game: Omit<SeedCatalogGame, "sourceRank"> & { sourceRank?: number }, source: GameSource) {
  const slug = game.slug ?? normalizeGameSlug(game.name);
  const existing = await prisma.game.findFirst({
    where: {
      OR: [
        { slug },
        { name: { equals: game.name, mode: "insensitive" } },
        { aliases: { hasSome: aliasesFor(game.name, game.aliases) } }
      ]
    },
    select: { id: true, aliases: true }
  });
  const data = {
    name: game.name,
    slug,
    shortName: game.shortName ?? null,
    description: game.description,
    fallbackGradient: stableGameGradient(slug),
    source,
    sourceRank: game.sourceRank ?? null,
    approvalStatus: "APPROVED" as const,
    active: true,
    isActive: true,
    listingEnabled: true,
    crossPlatform: Boolean(game.supportsCrossplay),
    supportsCrossplay: Boolean(game.supportsCrossplay),
    supportsOnlineCoop: game.supportsOnlineCoop ?? true,
    supportsLocalCoop: Boolean(game.supportsLocalCoop),
    supportsDedicatedServers: Boolean(game.supportsDedicatedServers),
    minimumPlayers: game.minimumPlayers ?? 2,
    maximumPlayers: game.maximumPlayers ?? null,
    aliases: aliasesFor(game.name, game.aliases).concat(existing?.aliases ?? []).filter(uniqueBySlug),
    approvedAt: new Date()
  };

  const saved = existing
    ? await prisma.game.update({ where: { id: existing.id }, data })
    : await prisma.game.create({ data });

  for (const platform of game.platforms ?? [Platform.PC]) {
    await prisma.gamePlatform.upsert({
      where: { gameId_platform: { gameId: saved.id, platform } },
      create: { gameId: saved.id, platform },
      update: {}
    });
  }
  for (const categoryName of game.categories ?? []) {
    const category = await prisma.gameCategory.upsert({
      where: { slug: normalizeGameSlug(categoryName) },
      create: { name: categoryName, slug: normalizeGameSlug(categoryName) },
      update: { name: categoryName }
    });
    await prisma.gameCategoryOnGame.upsert({
      where: { gameId_categoryId: { gameId: saved.id, categoryId: category.id } },
      create: { gameId: saved.id, categoryId: category.id },
      update: {}
    });
  }
  return Boolean(existing);
}

async function upsertPlayer(email: string, name: string, username: string, displayName: string, role: "USER" | "MODERATOR" | "ADMIN") {
  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      role,
      preferences: { create: {} },
      profile: {
        create: {
          username,
          displayName,
          bio: "Co-op focused player looking for reliable groups.",
          timeZone: "America/New_York",
          region: "United States",
          languages: ["English"],
          platforms: [Platform.PC],
          playStyles: ["Casual", "Building", "Exploration"],
          availability: "Weeknights after 8 PM and Sunday afternoons",
          discordConnected: true,
          discordUsername: `${username}#0001`
        }
      }
    },
    update: { name, role }
  });
}

async function addUserGame(userId: string, gameId: string, playStyles: string[]) {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  await prisma.userGame.upsert({
    where: { profileId_gameId_platform: { profileId: profile.id, gameId, platform: Platform.PC } },
    create: {
      userId,
      profileId: profile.id,
      gameId,
      platform: Platform.PC,
      playStyles,
      experience: "CASUAL",
      canHost: true,
      usesMods: playStyles.includes("Modded")
    },
    update: { playStyles }
  });
}

async function createPost(input: {
  ownerId: string;
  gameId: string;
  title: string;
  description: string;
  playStyles: string[];
  platform: Platform;
  startsAt: Date;
  inviteUrl: string;
  publicInvite?: boolean;
}) {
  const game = await prisma.game.findUniqueOrThrow({ where: { id: input.gameId } });
  if (game.approvalStatus !== "APPROVED" || !game.isActive || !game.listingEnabled) {
    throw new Error(`Seed post game is not approved for listings: ${game.name}`);
  }
  const refreshedAt = new Date();
  const postId = `${input.ownerId}-${input.gameId}`;
  const post = await prisma.lfgPost.upsert({
    where: { id: postId },
    create: {
      id: postId,
      ownerId: input.ownerId,
      gameId: input.gameId,
      title: input.title,
      description: input.description,
      platform: input.platform,
      timeZone: "America/New_York",
      campaignStartsAt: input.startsAt,
      campaignEndsAt: new Date(input.startsAt.getTime() + 14 * 24 * 60 * 60 * 1000),
      playersNeeded: 3,
      currentGroupSize: 1,
      maxPlayers: 4,
      playStyles: input.playStyles,
      hostingStatus: "OWNER_HOSTING",
      durationType: "TWO_WEEKS",
      joinMode: "APPROVAL_REQUIRED",
      status: "ACTIVE",
      requestedExperience: "ANY",
      preferredLanguage: "English",
      publishedAt: refreshedAt,
      refreshedAt,
      expiresAt: calculateExpirationDate(refreshedAt),
      members: { create: { userId: input.ownerId, role: "OWNER" } },
      playStyleRows: { create: input.playStyles.map((tag) => ({ tag })) }
    },
    update: {
      title: input.title,
      description: input.description,
      status: "ACTIVE",
      refreshedAt,
      expiresAt: calculateExpirationDate(refreshedAt)
    }
  });
  const code = input.inviteUrl.split("/").pop() ?? "invite";
  await prisma.discordInvitation.upsert({
    where: { postId: post.id },
    create: {
      postId: post.id,
      url: input.inviteUrl,
      code,
      visibility: input.publicInvite ? "PUBLIC" : "APPROVED_MEMBERS"
    },
    update: {
      url: input.inviteUrl,
      code,
      visibility: input.publicInvite ? "PUBLIC" : "APPROVED_MEMBERS"
    }
  });
}

function normalizeGameName(value: string) {
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

function normalizeGameSlug(value: string) {
  return normalizeGameName(value)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function aliasesFor(name: string, aliases: string[] = []) {
  return [name, ...aliases].map((alias) => alias.trim()).filter(Boolean).filter(uniqueBySlug);
}

function uniqueBySlug(value: string, index: number, values: string[]) {
  const slug = normalizeGameSlug(value);
  return slug.length > 0 && values.findIndex((candidate) => normalizeGameSlug(candidate) === slug) === index;
}

function stableGameGradient(slug: string) {
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

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });