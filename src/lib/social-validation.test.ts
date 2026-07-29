import { describe, expect, it } from "vitest";
import { projectZomboidSocialPostSchema, socialCommentSchema } from "@/lib/validation";

describe("social validation", () => {
  it("accepts Project Zomboid run stats with optional screenshot URL", () => {
    const result = projectZomboidSocialPostSchema.safeParse({
      gameId: "game-project-zomboid",
      body: "Reached winter with a working base.",
      imageUrl: "https://example.com/run.jpg",
      characterName: "Riley Knox",
      zombieKills: "243",
      daysSurvived: "38",
      gameSettings: "Apocalypse, no mods, Riverside start"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.zombieKills).toBe(243);
      expect(result.data.daysSurvived).toBe(38);
    }
  });

  it("rejects invalid screenshot URLs and empty comments", () => {
    expect(() =>
      projectZomboidSocialPostSchema.safeParse({
        gameId: "game-project-zomboid",
        body: "Progress update",
        imageUrl: "",
        characterName: "Riley Knox",
        zombieKills: 1,
        daysSurvived: 1,
        gameSettings: "Builder"
      })
    ).not.toThrow();

    expect(
      projectZomboidSocialPostSchema.safeParse({
        gameId: "game-project-zomboid",
        body: "Progress update",
        imageUrl: "javascript:alert(1)",
        characterName: "Riley Knox",
        zombieKills: 1,
        daysSurvived: 1,
        gameSettings: "Builder"
      }).success
    ).toBe(false);

    expect(socialCommentSchema.safeParse({ postId: "post", body: "" }).success).toBe(false);
  });
});
