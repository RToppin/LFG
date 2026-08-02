import { SocialLinkKind } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";

const suffix = Math.random().toString(36).slice(2);

describe("user social links", () => {
  it("stores social links on the user account and removes them with the user", async () => {
    const user = await prisma.user.create({
      data: {
        email: `social-${suffix}@example.com`,
        name: "Social Tester"
      }
    });

    await prisma.socialLink.create({
      data: {
        userId: user.id,
        kind: SocialLinkKind.WEBSITE,
        url: "https://example.com/social",
        sortOrder: 0
      }
    });

    const stored = await prisma.user.findUnique({
      where: { id: user.id },
      include: { socialLinks: true }
    });
    expect(stored?.socialLinks).toHaveLength(1);
    expect(stored?.socialLinks[0]).toMatchObject({ userId: user.id, kind: SocialLinkKind.WEBSITE });

    await prisma.user.delete({ where: { id: user.id } });
    await expect(prisma.socialLink.findMany({ where: { userId: user.id } })).resolves.toEqual([]);
  });
});