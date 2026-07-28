import { describe, expect, it } from "vitest";
import { availabilityOverlaps, calculateExpirationDate, isExpiringSoon, shouldExpirePost } from "@/lib/time";

describe("post expiration and availability", () => {
  it("keeps listing freshness separate from campaign duration", () => {
    const refreshedAt = new Date("2026-07-28T12:00:00Z");
    expect(calculateExpirationDate(refreshedAt).toISOString()).toBe("2026-08-04T12:00:00.000Z");
  });

  it("expires stale or completed active posts", () => {
    const now = new Date("2026-07-28T12:00:00Z");
    expect(shouldExpirePost({ status: "ACTIVE", expiresAt: new Date("2026-07-28T11:00:00Z"), campaignEndsAt: null }, now)).toBe(true);
    expect(shouldExpirePost({ status: "CLOSED", expiresAt: new Date("2026-07-28T11:00:00Z"), campaignEndsAt: null }, now)).toBe(false);
    expect(shouldExpirePost({ status: "ACTIVE", expiresAt: null, campaignEndsAt: new Date("2026-07-27T12:00:00Z") }, now)).toBe(true);
  });

  it("detects 24 hour warnings and overlapping time windows", () => {
    const now = new Date("2026-07-28T12:00:00Z");
    expect(isExpiringSoon(new Date("2026-07-29T11:30:00Z"), now)).toBe(true);
    expect(availabilityOverlaps({ dayOfWeek: 2, startTime: "18:00", endTime: "21:00" }, { dayOfWeek: 2, startTime: "20:00", endTime: "22:00" })).toBe(true);
    expect(availabilityOverlaps({ dayOfWeek: 2, startTime: "18:00", endTime: "19:00" }, { dayOfWeek: 3, startTime: "18:00", endTime: "19:00" })).toBe(false);
  });
});
