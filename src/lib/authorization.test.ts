import { describe, expect, it } from "vitest";
import { assertOwnerOrModerator, canAdmin, canDisconnectDiscord, canModerate } from "@/lib/authorization";

describe("authorization helpers", () => {
  it("checks moderator and administrator powers", () => {
    expect(canModerate("USER")).toBe(false);
    expect(canModerate("MODERATOR")).toBe(true);
    expect(canAdmin("ADMIN")).toBe(true);
  });

  it("requires ownership or staff role for protected changes", () => {
    expect(() => assertOwnerOrModerator("owner", { id: "owner", role: "USER" })).not.toThrow();
    expect(() => assertOwnerOrModerator("owner", { id: "mod", role: "MODERATOR" })).not.toThrow();
    expect(() => assertOwnerOrModerator("owner", { id: "other", role: "USER" })).toThrow();
  });

  it("allows Discord disconnect only when another auth method remains", () => {
    expect(canDisconnectDiscord(true, 2)).toBe(true);
    expect(canDisconnectDiscord(true, 1)).toBe(false);
    expect(canDisconnectDiscord(false, 2)).toBe(false);
  });
});
