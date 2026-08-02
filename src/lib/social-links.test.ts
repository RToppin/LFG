import { SocialLinkKind } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { parseSocialLinks } from "@/lib/social-links";

describe("social links", () => {
  it("normalizes valid account-owned social links", () => {
    expect(parseSocialLinks([{ kind: SocialLinkKind.TWITCH, url: "https://twitch.tv/example" }])).toEqual({
      ok: true,
      links: [{ kind: SocialLinkKind.TWITCH, url: "https://twitch.tv/example" }]
    });
  });

  it("ignores blank links and rejects invalid URLs", () => {
    expect(parseSocialLinks([{ kind: SocialLinkKind.WEBSITE, url: "" }])).toEqual({ ok: true, links: [] });
    expect(parseSocialLinks([{ kind: SocialLinkKind.WEBSITE, url: "not-a-url" }])).toMatchObject({ ok: false });
    expect(parseSocialLinks([{ kind: SocialLinkKind.WEBSITE, url: "ftp://example.com" }])).toMatchObject({ ok: false });
  });

  it("rejects duplicate link kinds", () => {
    expect(
      parseSocialLinks([
        { kind: SocialLinkKind.STEAM, url: "https://steamcommunity.com/id/one" },
        { kind: SocialLinkKind.STEAM, url: "https://steamcommunity.com/id/two" }
      ])
    ).toMatchObject({ ok: false });
  });
});