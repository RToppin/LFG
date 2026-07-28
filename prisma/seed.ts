import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Platform } from "@prisma/client";
import { calculateExpirationDate } from "../src/lib/time";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://lfg:lfg@localhost:5432/lfg?schema=public" });
const prisma = new PrismaClient({ adapter });

const games = [
  {
    name: "Valheim",
    slug: "valheim",
    description: "Viking survival crafting with co-op boss progression and long-term worlds.",
    crossPlatform: true,
    modSupport: true,
    fallbackGradient: "bg-gradient-to-br from-cyan-500 to-slate-950",
    platforms: [Platform.PC, Platform.XBOX, Platform.CROSS_PLATFORM]
  },
  {
    name: "Minecraft Java Edition",
    slug: "minecraft-java-edition",
    description: "Mod-friendly sandbox survival for servers, realms, builders, and progression groups.",
    crossPlatform: false,
    modSupport: true,
    fallbackGradient: "bg-gradient-to-br from-emerald-500 to-stone-900",
    platforms: [Platform.PC]
  },
  {
    name: "Minecraft Bedrock Edition",
    slug: "minecraft-bedrock-edition",
    description: "Cross-platform Minecraft for console, mobile, PC, and realm-based play.",
    crossPlatform: true,
    modSupport: false,
    fallbackGradient: "bg-gradient-to-br from-green-500 to-sky-950",
    platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.NINTENDO_SWITCH, Platform.CROSS_PLATFORM]
  },
  {
    name: "ARK: Survival Evolved",
    slug: "ark-survival-evolved",
    description: "Dinosaur survival, base building, taming, and tribe progression.",
    crossPlatform: false,
    modSupport: true,
    fallbackGradient: "bg-gradient-to-br from-amber-500 to-zinc-950",
    platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION]
  },
  {
    name: "ARK: Survival Ascended",
    slug: "ark-survival-ascended",
    description: "Modern ARK survival with fresh servers and new long-term tribe starts.",
    crossPlatform: true,
    modSupport: true,
    fallbackGradient: "bg-gradient-to-br from-orange-500 to-neutral-950",
    platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.CROSS_PLATFORM]
  },
  {
    name: "Palworld",
    slug: "palworld",
    description: "Creature collecting, base automation, exploration, and co-op progression.",
    crossPlatform: true,
    modSupport: true,
    fallbackGradient: "bg-gradient-to-br from-sky-400 to-indigo-950",
    platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.CROSS_PLATFORM]
  },
  {
    name: "Terraria",
    slug: "terraria",
    description: "2D survival, bosses, building, and campaign-style progression.",
    crossPlatform: false,
    modSupport: true,
    fallbackGradient: "bg-gradient-to-br from-lime-500 to-fuchsia-950",
    platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.NINTENDO_SWITCH]
  },
  {
    name: "Project Zomboid",
    slug: "project-zomboid",
    description: "Hardcore zombie survival with roleplay, modded servers, and long campaigns.",
    crossPlatform: false,
    modSupport: true,
    fallbackGradient: "bg-gradient-to-br from-red-500 to-stone-950",
    platforms: [Platform.PC]
  }
];

async function main() {
  for (const game of games) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      create: {
        name: game.name,
        slug: game.slug,
        description: game.description,
        crossPlatform: game.crossPlatform,
        modSupport: game.modSupport,
        fallbackGradient: game.fallbackGradient,
        aliases: [],
        platforms: { create: game.platforms.map((platform) => ({ platform })) },
        editions: { create: [{ name: "Standard" }] }
      },
      update: {
        description: game.description,
        crossPlatform: game.crossPlatform,
        modSupport: game.modSupport,
        fallbackGradient: game.fallbackGradient,
        active: true
      }
    });
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

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
