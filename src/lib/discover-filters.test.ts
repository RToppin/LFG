import { describe, expect, it } from "vitest";
import { parseSelectedGameSlugs, selectedGameNames } from "@/lib/discover-filters";

describe("discover filters", () => {
  it("parses repeated and comma-separated game slugs without duplicates", () => {
    expect(parseSelectedGameSlugs(["valheim", "minecraft-java"], "valheim,project-zomboid")).toEqual([
      "valheim",
      "minecraft-java",
      "project-zomboid"
    ]);
  });

  it("rejects malformed game slug input", () => {
    expect(parseSelectedGameSlugs(["Valheim", "bad/value", "minecraft-java"]).sort()).toEqual(["minecraft-java", "valheim"]);
  });

  it("returns selected game names from the approved game list", () => {
    const games = [
      { name: "Minecraft", slug: "minecraft" },
      { name: "Valheim", slug: "valheim" }
    ];
    expect(selectedGameNames(games, ["valheim"])).toEqual(["Valheim"]);
  });
});