import { describe, expect, it } from "vitest";

function shouldNotify(preferences: { inApp: boolean; recommendations: boolean }, type: string) {
  if (!preferences.inApp) return false;
  if (type === "RECOMMENDED_POST" && !preferences.recommendations) return false;
  return true;
}

describe("notification preferences", () => {
  it("suppresses disabled in-app and recommendation notifications", () => {
    expect(shouldNotify({ inApp: false, recommendations: true }, "NEW_JOIN_REQUEST")).toBe(false);
    expect(shouldNotify({ inApp: true, recommendations: false }, "RECOMMENDED_POST")).toBe(false);
    expect(shouldNotify({ inApp: true, recommendations: true }, "POST_EXPIRED")).toBe(true);
  });
});
