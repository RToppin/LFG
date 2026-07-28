import { describe, expect, it } from "vitest";
import { calculateMatchScore, canRecommend, getOpenSlots, type MatchPost, type MatchProfile } from "@/lib/matching";

const profile: MatchProfile = {
  games: [
    {
      gameId: "minecraft",
      platform: "PC",
      playStyles: ["Casual", "Building", "Vanilla"],
      canHost: true,
      usesMods: false,
      experience: "CASUAL",
      recommendationsEnabled: true
    }
  ],
  languages: ["English"],
  playStyles: ["Relaxed"],
  availability: [{ dayOfWeek: 2, startTime: "18:00", endTime: "23:00" }]
};

const post: MatchPost = {
  id: "post",
  ownerId: "owner",
  gameId: "minecraft",
  platform: "PC",
  playStyles: ["Casual", "Building"],
  hostingStatus: "NEED_HOST",
  modded: false,
  requestedExperience: "CASUAL",
  preferredLanguage: "English",
  campaignStartsAt: new Date("2026-07-28T20:00:00Z"),
  refreshedAt: new Date(),
  expiresAt: new Date("2026-08-01T12:00:00Z"),
  maxPlayers: 4,
  currentGroupSize: 2,
  status: "ACTIVE",
  waitlistEnabled: false
};

describe("matching", () => {
  it("calculates open slots", () => {
    expect(getOpenSlots(post)).toBe(2);
    expect(getOpenSlots({ maxPlayers: 4, currentGroupSize: 8 })).toBe(0);
  });

  it("scores compatible posts and explains the score", () => {
    const result = calculateMatchScore(profile, post, "viewer");
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.reasons.join(" ")).toContain("play");
  });

  it("excludes owners, closed posts, full posts, disabled games, and blocked users", () => {
    expect(canRecommend(profile, post, "owner")).toBe(false);
    expect(canRecommend(profile, { ...post, status: "CLOSED" }, "viewer")).toBe(false);
    expect(canRecommend(profile, { ...post, currentGroupSize: 4 }, "viewer")).toBe(false);
    expect(canRecommend({ ...profile, blockedUserIds: ["owner"] }, post, "viewer")).toBe(false);
    expect(canRecommend({ ...profile, games: [{ ...profile.games[0], recommendationsEnabled: false }] }, post, "viewer")).toBe(false);
  });
});
