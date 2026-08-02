import { SocialLinkKind } from "@prisma/client";

export const SOCIAL_LINK_OPTIONS = [
  SocialLinkKind.WEBSITE,
  SocialLinkKind.TWITCH,
  SocialLinkKind.YOUTUBE,
  SocialLinkKind.STEAM,
  SocialLinkKind.X,
  SocialLinkKind.INSTAGRAM,
  SocialLinkKind.TIKTOK,
  SocialLinkKind.XBOX,
  SocialLinkKind.PLAYSTATION,
  SocialLinkKind.NINTENDO,
  SocialLinkKind.OTHER
] as const;

export const SOCIAL_LINK_LABELS = {
  WEBSITE: "Website",
  TWITCH: "Twitch",
  YOUTUBE: "YouTube",
  STEAM: "Steam",
  X: "X",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  XBOX: "Xbox",
  PLAYSTATION: "PlayStation",
  NINTENDO: "Nintendo",
  OTHER: "Other"
} satisfies Record<SocialLinkKind, string>;

export type NormalizedSocialLink = {
  kind: SocialLinkKind;
  url: string;
};

export type SocialLinkParseResult =
  | { ok: true; links: NormalizedSocialLink[] }
  | { ok: false; message: string };

export function parseSocialLinks(entries: Array<{ kind: string; url: string }>): SocialLinkParseResult {
  const seen = new Set<SocialLinkKind>();
  const links: NormalizedSocialLink[] = [];

  for (const entry of entries.slice(0, SOCIAL_LINK_OPTIONS.length)) {
    const kind = SOCIAL_LINK_OPTIONS.find((option) => option === entry.kind);
    const rawUrl = entry.url.trim();
    if (!rawUrl) continue;
    if (!kind) return { ok: false, message: "Choose a supported social link type." };
    if (seen.has(kind)) return { ok: false, message: "Each social link type can only be saved once." };

    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      return { ok: false, message: `${SOCIAL_LINK_LABELS[kind]} must be a valid URL.` };
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, message: `${SOCIAL_LINK_LABELS[kind]} must start with http:// or https://.` };
    }

    seen.add(kind);
    links.push({ kind, url: url.toString().slice(0, 300) });
  }

  return { ok: true, links };
}