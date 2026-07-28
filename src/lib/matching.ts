import { ExperienceLevel, HostingStatus, Platform } from "@prisma/client";
import { availabilityOverlaps } from "@/lib/time";

export type MatchProfile = {
  games: Array<{
    gameId: string;
    platform: Platform;
    playStyles: string[];
    canHost: boolean;
    usesMods: boolean;
    experience: ExperienceLevel;
    recommendationsEnabled: boolean;
  }>;
  languages: string[];
  playStyles: string[];
  availability: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
  blockedUserIds?: string[];
};

export type MatchPost = {
  id: string;
  ownerId: string;
  gameId: string;
  platform: Platform;
  playStyles: string[];
  hostingStatus: HostingStatus;
  modded: boolean;
  requestedExperience: ExperienceLevel;
  preferredLanguage: string | null;
  campaignStartsAt: Date;
  refreshedAt: Date | null;
  expiresAt: Date | null;
  maxPlayers: number;
  currentGroupSize: number;
  status: string;
  waitlistEnabled: boolean;
};

export function getOpenSlots(post: Pick<MatchPost, "maxPlayers" | "currentGroupSize">) {
  return Math.max(0, post.maxPlayers - post.currentGroupSize);
}

export function canRecommend(profile: MatchProfile, post: MatchPost, viewerId?: string) {
  if (viewerId && post.ownerId === viewerId) return false;
  if (profile.blockedUserIds?.includes(post.ownerId)) return false;
  if (!["ACTIVE"].includes(post.status)) return false;
  if (!post.waitlistEnabled && getOpenSlots(post) <= 0) return false;
  return profile.games.some((game) => game.gameId === post.gameId && game.recommendationsEnabled);
}

export function calculateMatchScore(profile: MatchProfile, post: MatchPost, viewerId?: string) {
  if (!canRecommend(profile, post, viewerId)) {
    return { score: 0, reasons: ["Not eligible for recommendations."] };
  }

  const reasons: string[] = [];
  let score = 25;
  const userGame = profile.games.find((game) => game.gameId === post.gameId);

  if (userGame) {
    reasons.push("You both play this game.");
    if (userGame.platform === post.platform || post.platform === "CROSS_PLATFORM") {
      score += 18;
      reasons.push(`Platform compatible on ${post.platform.replace("_", " ").toLowerCase()}.`);
    }
    const sharedStyles = intersection(userGame.playStyles.concat(profile.playStyles), post.playStyles);
    if (sharedStyles.length > 0) {
      score += Math.min(18, sharedStyles.length * 6);
      reasons.push(`Shared play styles: ${sharedStyles.slice(0, 3).join(", ")}.`);
    }
    if ((userGame.canHost && post.hostingStatus === "NEED_HOST") || post.hostingStatus !== "NEED_HOST") {
      score += 8;
      reasons.push("Hosting needs are compatible.");
    }
    if (userGame.usesMods === post.modded) {
      score += 7;
      reasons.push(post.modded ? "You are both open to mods." : "You both prefer vanilla-friendly play.");
    }
    if (post.requestedExperience === "ANY" || userGame.experience === post.requestedExperience) {
      score += 8;
      reasons.push("Experience preference fits.");
    }
  }

  if (post.preferredLanguage && profile.languages.includes(post.preferredLanguage)) {
    score += 8;
    reasons.push(`Language match: ${post.preferredLanguage}.`);
  }

  if (profile.availability.some((slot) => postStartsInSlot(post.campaignStartsAt, slot))) {
    score += 8;
    reasons.push("The planned start overlaps your usual availability.");
  } else if (profile.availability.length === 0) {
    score += 3;
  }

  if (post.refreshedAt) {
    const ageHours = (Date.now() - post.refreshedAt.getTime()) / 3_600_000;
    if (ageHours <= 72) {
      score += 5;
      reasons.push("The listing was refreshed recently.");
    }
  }

  if (getOpenSlots(post) > 0) {
    score += 3;
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    reasons: reasons.slice(0, 5)
  };
}

function intersection(a: string[], b: string[]) {
  const bSet = new Set(b.map((item) => item.toLowerCase()));
  return [...new Set(a)].filter((item) => bSet.has(item.toLowerCase()));
}

function postStartsInSlot(date: Date, slot: { dayOfWeek: number; startTime: string; endTime: string }) {
  const day = date.getUTCDay();
  const time = `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
  return availabilityOverlaps(
    { dayOfWeek: day, startTime: time, endTime: addMinutes(time, 120) },
    slot
  );
}

function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
