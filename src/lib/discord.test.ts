import { describe, expect, it } from "vitest";
import { isDiscordInvite, parseDiscordInvite } from "@/lib/discord";

describe("Discord invitation validation", () => {
  it("accepts supported invite formats and normalizes them", () => {
    expect(parseDiscordInvite("https://discord.gg/abc-123")).toEqual({
      code: "abc-123",
      url: "https://discord.gg/abc-123"
    });
    expect(isDiscordInvite("https://discord.com/invite/valheim")).toBe(true);
    expect(isDiscordInvite("discordapp.com/invite/minecraft")).toBe(true);
  });

  it("rejects unsafe or unrelated URLs", () => {
    expect(isDiscordInvite("https://example.com/invite/nope")).toBe(false);
    expect(isDiscordInvite("javascript:alert(1)")).toBe(false);
    expect(isDiscordInvite("https://discord.gg/")).toBe(false);
  });
});
