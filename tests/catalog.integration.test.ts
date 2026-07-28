import { Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findProbableGameMatch, normalizeGameSlug, requireApprovedListingGame, stableGameGradient } from "@/lib/game-catalog";
import { prisma } from "@/lib/db";

const suffix = Math.random().toString(36).slice(2);
let userId = "";
let profileId = "";

describe("approved game catalog integration", () => {
  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `catalog-${suffix}@example.com`,
        name: "Catalog Tester",
        preferences: { create: {} },
        profile: {
          create: {
            username: `catalog_${suffix}`,
            displayName: "Catalog Tester",
            timeZone: "America/New_York",
            region: "United States",
            languages: ["English"],
            platforms: ["PC"],
            playStyles: []
          }
        }
      },
      include: { profile: true }
    });
    userId = user.id;
    profileId = user.profile!.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.game.deleteMany({ where: { slug: { endsWith: `-${suffix}` } } });
  });

  it("creates a post only after approved-game validation succeeds", async () => {
    const game = await createGame("Approved Integration Game", "APPROVED", true, true);
    await expect(requireApprovedListingGame(game.id)).resolves.toMatchObject({ id: game.id });
    const post = await prisma.lfgPost.create({
      data: {
        ownerId: userId,
        gameId: game.id,
        title: "Approved catalog integration post",
        description: "This post proves approved games can be used in integration tests.",
        platform: "PC",
        timeZone: "America/New_York",
        campaignStartsAt: new Date(Date.now() + 86_400_000),
        playersNeeded: 1,
        currentGroupSize: 1,
        maxPlayers: 2,
        playStyles: ["Casual"],
        hostingStatus: "OWNER_HOSTING",
        durationType: "ONE_SESSION",
        status: "DRAFT"
      }
    });
    expect(post.gameId).toBe(game.id);
  });

  it("rejects unknown, pending, rejected, and disabled games", async () => {
    await expect(requireApprovedListingGame(`missing-${suffix}`)).rejects.toThrow();
    const pending = await createGame("Pending Integration Game", "PENDING", true, true);
    const rejected = await createGame("Rejected Integration Game", "REJECTED", true, true);
    const disabled = await createGame("Disabled Integration Game", "APPROVED", false, true);
    const listingDisabled = await createGame("Listing Disabled Integration Game", "APPROVED", true, false);
    await expect(requireApprovedListingGame(pending.id)).rejects.toThrow();
    await expect(requireApprovedListingGame(rejected.id)).rejects.toThrow();
    await expect(requireApprovedListingGame(disabled.id)).rejects.toThrow();
    await expect(requireApprovedListingGame(listingDisabled.id)).rejects.toThrow();
  });

  it("adds approved games to profiles and prevents duplicate profile games", async () => {
    const game = await createGame("Profile Integration Game", "APPROVED", true, true);
    await prisma.userGame.create({
      data: {
        userId,
        profileId,
        gameId: game.id,
        platform: "PC",
        playStyles: ["Casual"]
      }
    });
    await expect(
      prisma.userGame.create({
        data: {
          userId,
          profileId,
          gameId: game.id,
          platform: "PC",
          playStyles: []
        }
      })
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("detects duplicate pending game requests and existing games", async () => {
    const alias = `Duplicate Match ${suffix}`;
    const existing = await createGame("Duplicate Match Game", "APPROVED", true, true, [alias]);
    await expect(findProbableGameMatch(alias)).resolves.toMatchObject({ type: "game", id: existing.id });
    await prisma.gameRequest.create({
      data: {
        requestedName: `Pending Request ${suffix}`,
        normalizedName: normalizeGameSlug(`Pending Request ${suffix}`),
        requestedById: userId
      }
    });
    await expect(findProbableGameMatch(`Pending Request ${suffix}`)).resolves.toMatchObject({ type: "request" });
  });
});

async function createGame(
  name: string,
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED",
  isActive: boolean,
  listingEnabled: boolean,
  aliases: string[] = []
) {
  const slug = `${normalizeGameSlug(name)}-${suffix}`;
  return prisma.game.create({
    data: {
      name: `${name} ${suffix}`,
      slug,
      description: "Integration test game.",
      fallbackGradient: stableGameGradient(slug),
      source: "ADMIN",
      approvalStatus,
      isActive,
      active: isActive,
      listingEnabled,
      aliases,
      platforms: { create: [{ platform: "PC" }] }
    }
  });
}
