import {
  CampaignDurationType,
  ExperienceLevel,
  HostingStatus,
  JoinMode,
  Platform,
  ProfileVisibility
} from "@prisma/client";
import { z } from "zod";
import { isDiscordInvite } from "@/lib/discord";

const enumValues = <T extends Record<string, string>>(value: T) => Object.values(value) as [T[keyof T], ...T[keyof T][]];

export const profileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only."),
  displayName: z.string().min(2).max(60),
  bio: z.string().max(500).optional().or(z.literal("")),
  timeZone: z.string().min(3),
  region: z.string().min(2).max(80),
  languages: z.array(z.string().min(2)).min(1),
  platforms: z.array(z.enum(enumValues(Platform))).min(1),
  playStyles: z.array(z.string()).default([]),
  availability: z.string().max(300).optional().or(z.literal("")),
  visibility: z.enum(enumValues(ProfileVisibility))
});

export const userGameSchema = z.object({
  gameId: z.string().min(1),
  platform: z.enum(enumValues(Platform)),
  experience: z.enum(enumValues(ExperienceLevel)),
  playStyles: z.array(z.string()).default([]),
  canHost: z.boolean().default(false),
  usesMods: z.boolean().default(false),
  edition: z.string().max(80).optional().or(z.literal("")),
  notifications: z.boolean().default(true)
});

export const lfgPostSchema = z
  .object({
    gameId: z.string().min(1),
    title: z.string().min(5).max(90),
    description: z.string().min(20).max(2000),
    platform: z.enum(enumValues(Platform)),
    timeZone: z.string().min(3),
    campaignStartsAt: z.coerce.date(),
    campaignEndsAt: z.coerce.date().optional().nullable(),
    flexibleTime: z.boolean().default(false),
    playersNeeded: z.coerce.number().int().min(1).max(99),
    currentGroupSize: z.coerce.number().int().min(1).max(100),
    maxPlayers: z.coerce.number().int().min(2).max(100),
    playStyles: z.array(z.string()).default([]),
    hostingStatus: z.enum(enumValues(HostingStatus)),
    durationType: z.enum(enumValues(CampaignDurationType)),
    joinMode: z.enum(enumValues(JoinMode)),
    edition: z.string().max(80).optional().or(z.literal("")),
    serverRegion: z.string().max(80).optional().or(z.literal("")),
    recurringSchedule: z.string().max(300).optional().or(z.literal("")),
    daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)).default([]),
    sessionLength: z.string().max(80).optional().or(z.literal("")),
    modded: z.boolean().default(false),
    modpackName: z.string().max(120).optional().or(z.literal("")),
    difficulty: z.string().max(80).optional().or(z.literal("")),
    progressionStage: z.string().max(120).optional().or(z.literal("")),
    requestedExperience: z.enum(enumValues(ExperienceLevel)),
    microphoneRequired: z.boolean().default(false),
    preferredLanguage: z.string().max(40).optional().or(z.literal("")),
    minimumAge: z.coerce.number().int().min(13).max(99).optional().nullable(),
    serverRules: z.string().max(1000).optional().or(z.literal("")),
    existingWorld: z.boolean().default(false),
    waitlistEnabled: z.boolean().default(false),
    autoCloseWhenFull: z.boolean().default(false),
    discordInvite: z.string().optional().or(z.literal("")),
    discordInviteVisibility: z.enum(["PUBLIC", "APPROVED_MEMBERS"]).default("APPROVED_MEMBERS"),
    publish: z.boolean().default(true)
  })
  .refine((data) => data.maxPlayers >= data.currentGroupSize + data.playersNeeded, {
    message: "Max players must fit current members plus requested slots.",
    path: ["maxPlayers"]
  })
  .refine((data) => !data.discordInvite || isDiscordInvite(data.discordInvite), {
    message: "Enter a supported Discord invitation URL.",
    path: ["discordInvite"]
  });

export const joinRequestSchema = z.object({
  postId: z.string().min(1),
  message: z.string().max(500).optional().or(z.literal(""))
});

export const reportSchema = z.object({
  postId: z.string().optional(),
  reportedUserId: z.string().optional(),
  type: z.string().min(1),
  details: z.string().max(1000).optional().or(z.literal(""))
});
