import { addDays, differenceInCalendarDays, isBefore } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { LISTING_FRESHNESS_DAYS } from "@/lib/constants";

export function calculateExpirationDate(refreshedAt: Date, freshnessDays = LISTING_FRESHNESS_DAYS) {
  return addDays(refreshedAt, freshnessDays);
}

export function shouldExpirePost(post: {
  status: string;
  expiresAt: Date | null;
  campaignEndsAt: Date | null;
}, now = new Date()) {
  if (!["ACTIVE", "PAUSED", "FULL"].includes(post.status)) return false;
  if (post.expiresAt && isBefore(post.expiresAt, now)) return true;
  if (post.campaignEndsAt && isBefore(post.campaignEndsAt, now)) return true;
  return false;
}

export function isExpiringSoon(expiresAt: Date | null, now = new Date()) {
  if (!expiresAt) return false;
  const hours = (expiresAt.getTime() - now.getTime()) / 3_600_000;
  return hours > 0 && hours <= 24;
}

export function formatViewerTime(date: Date, viewerTimeZone: string, ownerTimeZone: string) {
  return {
    viewer: formatInTimeZone(date, viewerTimeZone, "EEE, MMM d, yyyy h:mm a zzz"),
    original: formatInTimeZone(date, ownerTimeZone, "EEE, MMM d, yyyy h:mm a zzz")
  };
}

export function availabilityOverlaps(
  a: { dayOfWeek: number; startTime: string; endTime: string },
  b: { dayOfWeek: number; startTime: string; endTime: string }
) {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

export function freshnessLabel(expiresAt: Date | null, now = new Date()) {
  if (!expiresAt) return "Draft";
  const days = differenceInCalendarDays(expiresAt, now);
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `${days} days fresh`;
}
