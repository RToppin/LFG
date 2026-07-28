import { describe, expect, it } from "vitest";
import {
  APPROVED_GAME_ERROR,
  assertGameListingAvailable,
  buildGameMergePlan,
  normalizeGameSlug,
  uniqueAliases
} from "@/lib/game-catalog";

describe("game catalog rules", () => {
  it("normalizes slugs and aliases for duplicate detection", () => {
    expect(normalizeGameSlug("HELLDIVERS\u2122 2")).toBe("helldivers-2");
    expect(normalizeGameSlug("  HELL DIVERS  2!! ")).toBe("hell-divers-2");
    expect(uniqueAliases("HELLDIVERS 2", ["HELLDIVERS\u2122 2", "Helldivers 2"])).toEqual(["HELLDIVERS 2"]);
  });

  it("accepts only approved active listing-enabled games", () => {
    expect(() =>
      assertGameListingAvailable({ approvalStatus: "APPROVED", isActive: true, listingEnabled: true })
    ).not.toThrow();
    expect(() =>
      assertGameListingAvailable({ approvalStatus: "PENDING", isActive: true, listingEnabled: true })
    ).toThrow(APPROVED_GAME_ERROR);
    expect(() =>
      assertGameListingAvailable({ approvalStatus: "APPROVED", isActive: false, listingEnabled: true })
    ).toThrow(APPROVED_GAME_ERROR);
    expect(() =>
      assertGameListingAvailable({ approvalStatus: "APPROVED", isActive: true, listingEnabled: false })
    ).toThrow(APPROVED_GAME_ERROR);
  });

  it("builds a transactional merge plan and rejects self-merges", () => {
    expect(buildGameMergePlan("source", "target").map((step) => step.model)).toContain("LfgPost");
    expect(() => buildGameMergePlan("same", "same")).toThrow("Choose two different games");
  });
});
