"use server";

import { CampaignDurationType, Platform, Prisma, ReportType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { assertOwnerOrModerator, canAdmin, canModerate } from "@/lib/authorization";
import { LISTING_FRESHNESS_DAYS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { parseDiscordInvite } from "@/lib/discord";
import { checkRateLimit } from "@/lib/rate-limit";
import { cleanText } from "@/lib/sanitize";
import { calculateExpirationDate } from "@/lib/time";
import { joinRequestSchema, lfgPostSchema, profileSchema, reportSchema, userGameSchema, gameRequestSchema, adminGameSchema } from "@/lib/validation";
import { createNotification } from "@/lib/notifications";
import { APPROVED_GAME_ERROR, findProbableGameMatch, mergeGames, normalizeGameSlug, requireApprovedListingGame, stableGameGradient, uniqueAliases } from "@/lib/game-catalog";

type ActionState = { ok: boolean; message: string };

export async function signInWithDiscord() {
  await signIn("discord", { redirectTo: "/dashboard" });
}

export async function signInWithDevUser(formData: FormData) {
  const credentials = new FormData();
  credentials.set("email", String(formData.get("email") ?? ""));
  credentials.set("name", String(formData.get("name") ?? ""));
  credentials.set("redirectTo", "/dashboard");
  await signIn("credentials", credentials);
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

function formList(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function optionalFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function safeAppRedirectPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "");
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/api/")) return null;
  return path;
}

function deriveServerRegion(timeZone: string) {
  const area = timeZone.split("/")[0]?.replaceAll("_", " ") || "Global";
  if (area === "America") return "North America";
  if (area === "Europe") return "Europe";
  if (area === "Asia") return "Asia";
  if (area === "Australia" || area === "Pacific") return "Oceania";
  return area;
}

function campaignEndFromDuration(durationType: CampaignDurationType, startsAt: Date) {
  const days =
    durationType === "ONE_SESSION"
      ? 1
      : durationType === "WEEKEND"
        ? 3
        : durationType === "ONE_WEEK"
          ? 7
          : durationType === "TWO_WEEKS"
            ? 14
            : durationType === "SEVERAL_SESSIONS"
              ? 30
              : null;
  return days ? new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000) : null;
}

function primaryPlatform(platforms: Platform[]) {
  if (platforms.includes("CROSS_PLATFORM")) return "CROSS_PLATFORM";
  return platforms[0] ?? "PC";
}

export async function saveProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    timeZone: formData.get("timeZone"),
    region: formData.get("region"),
    languages: formList(formData, "languages"),
    platforms: formList(formData, "platforms"),
    playStyles: formList(formData, "playStyles"),
    availability: formData.get("availability"),
    visibility: formData.get("visibility")
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid profile." };

  try {
    await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        username: parsed.data.username,
        displayName: parsed.data.displayName,
        bio: cleanText(parsed.data.bio ?? "", 500),
        timeZone: parsed.data.timeZone,
        region: parsed.data.region,
        languages: parsed.data.languages,
        platforms: parsed.data.platforms,
        playStyles: parsed.data.playStyles,
        availability: cleanText(parsed.data.availability ?? "", 300),
        visibility: parsed.data.visibility
      },
      update: {
        username: parsed.data.username,
        displayName: parsed.data.displayName,
        bio: cleanText(parsed.data.bio ?? "", 500),
        timeZone: parsed.data.timeZone,
        region: parsed.data.region,
        languages: parsed.data.languages,
        platforms: parsed.data.platforms,
        playStyles: parsed.data.playStyles,
        availability: cleanText(parsed.data.availability ?? "", 300),
        visibility: parsed.data.visibility
      }
    });
    revalidatePath("/dashboard");
    const redirectTo = safeAppRedirectPath(formData.get("redirectTo"));
    if (redirectTo) redirect(redirectTo);
    return { ok: true, message: "Profile saved." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "That username is already taken." };
    }
    throw error;
  }
}

export async function addUserGame(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/onboarding");
  const parsed = userGameSchema.safeParse({
    gameId: formData.get("gameId"),
    platform: formData.get("platform"),
    experience: formData.get("experience"),
    playStyles: formList(formData, "playStyles"),
    canHost: checkbox(formData, "canHost"),
    usesMods: checkbox(formData, "usesMods"),
    edition: formData.get("edition"),
    notifications: !checkbox(formData, "notificationsOff")
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid game." };
  try {
    await requireApprovedListingGame(parsed.data.gameId);
  } catch {
    return { ok: false, message: APPROVED_GAME_ERROR };
  }

  await prisma.userGame.upsert({
    where: {
      profileId_gameId_platform: {
        profileId: profile.id,
        gameId: parsed.data.gameId,
        platform: parsed.data.platform
      }
    },
    create: { userId: user.id, profileId: profile.id, ...parsed.data },
    update: parsed.data
  });
  revalidatePath("/settings/games");
  return { ok: true, message: "Game preferences saved." };
}

export async function createLfgPost(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const rate = checkRateLimit(`post:${user.id}`, 10, 60 * 60 * 1000);
  if (!rate.ok) return { ok: false, message: "You are creating posts too quickly. Try again later." };
  const rawGameId = String(formData.get("gameId") ?? "");
  try {
    await requireApprovedListingGame(rawGameId);
  } catch {
    return { ok: false, message: APPROVED_GAME_ERROR };
  }
  const game = await prisma.game.findUniqueOrThrow({ where: { id: rawGameId }, select: { name: true } });
  const rawPlatforms = formList(formData, "platforms");
  const parsed = lfgPostSchema.safeParse({
    gameId: rawGameId,
    title: formData.get("title") || game.name,
    description: formData.get("description") || "",
    platforms: rawPlatforms.length ? rawPlatforms : ["PC"],
    timeZone: formData.get("timeZone") || "America/New_York",
    flexibleTime: checkbox(formData, "flexibleTime"),
    currentGroupSize: "1",
    maxPlayers: formData.get("maxPlayers"),
    playStyles: formList(formData, "playStyles"),
    hostingStatus: formData.get("hostingStatus"),
    durationType: formData.get("durationType"),
    joinMode: "OPEN",
    edition: "",
    serverRegion: optionalFormString(formData, "serverRegion"),
    recurringSchedule: optionalFormString(formData, "recurringSchedule"),
    daysOfWeek: formList(formData, "daysOfWeek"),
    sessionLength: optionalFormString(formData, "sessionLength"),
    modded: checkbox(formData, "modded"),
    modpackName: optionalFormString(formData, "modpackName"),
    difficulty: optionalFormString(formData, "difficulty"),
    progressionStage: optionalFormString(formData, "progressionStage"),
    requestedExperience: formData.get("requestedExperience"),
    microphoneRequired: checkbox(formData, "microphoneRequired"),
    preferredLanguage: optionalFormString(formData, "preferredLanguage"),
    minimumAge: "13",
    serverRules: optionalFormString(formData, "serverRules"),
    existingWorld: checkbox(formData, "existingWorld"),
    waitlistEnabled: checkbox(formData, "waitlistEnabled"),
    autoCloseWhenFull: checkbox(formData, "autoCloseWhenFull"),
    discordInvite: optionalFormString(formData, "discordInvite"),
    discordInviteVisibility: formData.get("discordInviteVisibility") || "PUBLIC",
    publish: formData.get("intent") !== "draft"
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid post." };
  const now = new Date();
  const status = parsed.data.publish ? "ACTIVE" : "DRAFT";
  const title = cleanText(parsed.data.title || game.name, 90);
  const description = cleanText(parsed.data.description || `${game.name} gaming`);
  const campaignEndsAt = campaignEndFromDuration(parsed.data.durationType, now);
  const selectedPlatforms = parsed.data.platforms;
  const invite = parseDiscordInvite(parsed.data.discordInvite);

  const post = await prisma.lfgPost.create({
    data: {
      ownerId: user.id,
      gameId: parsed.data.gameId,
      title,
      description,
      platform: primaryPlatform(selectedPlatforms),
      platforms: selectedPlatforms,
      timeZone: parsed.data.timeZone,
      campaignStartsAt: now,
      campaignEndsAt,
      flexibleTime: parsed.data.flexibleTime,
      playersNeeded: Math.max(1, parsed.data.maxPlayers - parsed.data.currentGroupSize),
      currentGroupSize: parsed.data.currentGroupSize,
      maxPlayers: parsed.data.maxPlayers,
      playStyles: parsed.data.playStyles,
      hostingStatus: parsed.data.hostingStatus,
      durationType: parsed.data.durationType,
      joinMode: parsed.data.joinMode,
      status,
      edition: parsed.data.edition || null,
      serverRegion: parsed.data.serverRegion || deriveServerRegion(parsed.data.timeZone),
      recurringSchedule: parsed.data.recurringSchedule || null,
      daysOfWeek: parsed.data.daysOfWeek,
      sessionLength: parsed.data.sessionLength || null,
      modded: parsed.data.modded,
      modpackName: parsed.data.modpackName || null,
      difficulty: parsed.data.difficulty || null,
      progressionStage: parsed.data.progressionStage || null,
      requestedExperience: parsed.data.requestedExperience,
      microphoneRequired: parsed.data.microphoneRequired,
      preferredLanguage: parsed.data.preferredLanguage || null,
      minimumAge: parsed.data.minimumAge,
      serverRules: cleanText(parsed.data.serverRules ?? "", 1000) || null,
      existingWorld: parsed.data.existingWorld,
      waitlistEnabled: parsed.data.waitlistEnabled,
      autoCloseWhenFull: parsed.data.autoCloseWhenFull,
      publishedAt: parsed.data.publish ? now : null,
      refreshedAt: parsed.data.publish ? now : null,
      expiresAt: parsed.data.publish ? calculateExpirationDate(now, LISTING_FRESHNESS_DAYS) : null,
      members: { create: { userId: user.id, role: "OWNER" } },
      playStyleRows: { create: parsed.data.playStyles.map((tag) => ({ tag })) },
      invitation: invite
        ? {
            create: {
              url: invite.url,
              code: invite.code,
              visibility: parsed.data.discordInviteVisibility
            }
          }
        : undefined
    }
  });

  redirect(`/lfg/${post.id}`);
}

export async function refreshPost(postId: string) {
  const user = await requireUser();
  const post = await prisma.lfgPost.findUnique({ where: { id: postId } });
  if (!post) return;
  assertOwnerOrModerator(post.ownerId, { id: user.id, role: user.role as never });
  if (post.status === "DRAFT") {
    try {
      await requireApprovedListingGame(post.gameId);
    } catch {
      return;
    }
  }
  const now = new Date();
  await prisma.lfgPost.update({
    where: { id: postId },
    data: { status: "ACTIVE", refreshedAt: now, expiresAt: calculateExpirationDate(now) }
  });
  revalidatePath(`/lfg/${postId}`);
}

export async function closePost(postId: string) {
  const user = await requireUser();
  const post = await prisma.lfgPost.findUnique({ where: { id: postId } });
  if (!post) return;
  assertOwnerOrModerator(post.ownerId, { id: user.id, role: user.role as never });
  await prisma.lfgPost.update({ where: { id: postId }, data: { status: "CLOSED", closedAt: new Date() } });
  revalidatePath(`/lfg/${postId}`);
}

export async function joinOrRequestPost(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = joinRequestSchema.safeParse({
    postId: formData.get("postId"),
    message: formData.get("message")
  });
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const rate = checkRateLimit(`join:${user.id}`, 20, 60 * 60 * 1000);
  if (!rate.ok) return { ok: false, message: "You are sending requests too quickly." };

  const post = await prisma.lfgPost.findUnique({
    where: { id: parsed.data.postId },
    include: { members: true, joinRequests: { where: { requesterId: user.id, status: "PENDING" } } }
  });
  if (!post || post.status !== "ACTIVE") return { ok: false, message: "This group is not open." };
  if (post.ownerId === user.id) return { ok: false, message: "You cannot join your own group." };
  if (post.members.some((member) => member.userId === user.id && !member.removedAt)) {
    return { ok: false, message: "You are already a member." };
  }
  if (post.joinRequests.length > 0) return { ok: false, message: "You already have a pending request." };
  if (post.maxPlayers - post.currentGroupSize <= 0 && !post.waitlistEnabled) {
    return { ok: false, message: "This group is full." };
  }
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedId: post.ownerId },
        { blockerId: post.ownerId, blockedId: user.id }
      ]
    }
  });
  if (blocked) return { ok: false, message: "This action is not available." };

  if (post.joinMode === "OPEN") {
    await prisma.$transaction([
      prisma.groupMember.create({ data: { postId: post.id, userId: user.id } }),
      prisma.lfgPost.update({
        where: { id: post.id },
        data: {
          currentGroupSize: { increment: 1 },
          status:
            post.autoCloseWhenFull && post.currentGroupSize + 1 >= post.maxPlayers ? "FULL" : post.status
        }
      })
    ]);
    await createNotification({
      userId: post.ownerId,
      postId: post.id,
      type: "USER_JOINED_GROUP",
      title: "New group member",
      body: `${user.name ?? "A player"} joined ${post.title}.`,
      link: `/lfg/${post.id}`,
      dedupeKey: `joined:${post.id}:${user.id}`
    });
    revalidatePath(`/lfg/${post.id}`);
    return { ok: true, message: "You joined the group." };
  }

  await prisma.joinRequest.create({
    data: {
      postId: post.id,
      requesterId: user.id,
      message: cleanText(parsed.data.message ?? "", 500)
    }
  });
  await createNotification({
    userId: post.ownerId,
    postId: post.id,
    type: "NEW_JOIN_REQUEST",
    title: "New join request",
    body: `${user.name ?? "A player"} wants to join ${post.title}.`,
    link: `/groups/pending`,
    dedupeKey: `request:${post.id}:${user.id}`
  });
  return { ok: true, message: "Join request sent." };
}

export async function decideJoinRequest(requestId: string, decision: "approve" | "reject") {
  const user = await requireUser();
  const request = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: { post: true, requester: true }
  });
  if (!request) return;
  assertOwnerOrModerator(request.post.ownerId, { id: user.id, role: user.role as never });
  if (request.status !== "PENDING") return;
  if (decision === "reject") {
    await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", decidedAt: new Date() }
    });
    await createNotification({
      userId: request.requesterId,
      postId: request.postId,
      type: "JOIN_REQUEST_REJECTED",
      title: "Request declined",
      body: `Your request to join ${request.post.title} was declined.`,
      link: `/lfg/${request.postId}`,
      dedupeKey: `reject:${requestId}`
    });
  } else {
    await prisma.$transaction([
      prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED", decidedAt: new Date() }
      }),
      prisma.groupMember.upsert({
        where: { postId_userId: { postId: request.postId, userId: request.requesterId } },
        create: { postId: request.postId, userId: request.requesterId },
        update: { removedAt: null }
      }),
      prisma.lfgPost.update({
        where: { id: request.postId },
        data: {
          currentGroupSize: { increment: 1 },
          status:
            request.post.autoCloseWhenFull && request.post.currentGroupSize + 1 >= request.post.maxPlayers
              ? "FULL"
              : request.post.status
        }
      })
    ]);
    await createNotification({
      userId: request.requesterId,
      postId: request.postId,
      type: "JOIN_REQUEST_APPROVED",
      title: "Request approved",
      body: `You are now a member of ${request.post.title}.`,
      link: `/lfg/${request.postId}`,
      dedupeKey: `approve:${requestId}`
    });
  }
  revalidatePath("/groups/pending");
}

export async function toggleSavePost(postId: string) {
  const user = await requireUser();
  const existing = await prisma.savedPost.findUnique({ where: { userId_postId: { userId: user.id, postId } } });
  if (existing) {
    await prisma.savedPost.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedPost.create({ data: { userId: user.id, postId } });
  }
  revalidatePath(`/lfg/${postId}`);
}

export async function markNotificationRead(notificationId: string) {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { readAt: new Date() }
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
}

export async function submitReport(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = reportSchema.safeParse({
    postId: formData.get("postId") || undefined,
    reportedUserId: formData.get("reportedUserId") || undefined,
    type: formData.get("type"),
    details: formData.get("details")
  });
  if (!parsed.success) return { ok: false, message: "Invalid report." };
  const rate = checkRateLimit(`report:${user.id}`, 10, 60 * 60 * 1000);
  if (!rate.ok) return { ok: false, message: "You are reporting too quickly." };
  await prisma.report.create({
    data: {
      reporterId: user.id,
      postId: parsed.data.postId,
      reportedUserId: parsed.data.reportedUserId,
      type: parsed.data.type as ReportType,
      details: cleanText(parsed.data.details ?? "", 1000)
    }
  });
  return { ok: true, message: "Report submitted for moderator review." };
}

export async function blockUser(blockedId: string) {
  const user = await requireUser();
  if (blockedId === user.id) return;
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
    create: { blockerId: user.id, blockedId },
    update: {}
  });
  revalidatePath("/settings/privacy");
}

export async function moderateReport(reportId: string, action: "dismiss" | "remove-post") {
  const user = await requireUser();
  if (!canModerate(user.role as never)) redirect("/dashboard");
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return;
  await prisma.$transaction(async (tx) => {
    if (action === "remove-post" && report.postId) {
      await tx.lfgPost.update({
        where: { id: report.postId },
        data: { status: "REMOVED_BY_MODERATION", closedAt: new Date() }
      });
    }
    await tx.report.update({
      where: { id: reportId },
      data: { status: action === "dismiss" ? "DISMISSED" : "ACTIONED", resolvedAt: new Date() }
    });
    await tx.moderationAction.create({
      data: {
        actorId: user.id,
        reportId,
        type: action === "dismiss" ? "DISMISS_REPORT" : "REMOVE_POST"
      }
    });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action,
        targetType: "Report",
        targetId: reportId
      }
    });
  });
  revalidatePath("/admin/reports");
}

export async function removeUserGame(userGameId: string) {
  const user = await requireUser();
  await prisma.userGame.deleteMany({ where: { id: userGameId, userId: user.id } });
  revalidatePath("/settings/games");
}

export async function requestGame(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const rate = checkRateLimit(`game-request:${user.id}`, 5, 60 * 60 * 1000);
  if (!rate.ok) return { ok: false, message: "You are requesting games too quickly. Try again later." };
  const parsed = gameRequestSchema.safeParse({
    requestedName: formData.get("requestedName"),
    steamStoreUrl: formData.get("steamStoreUrl"),
    notes: formData.get("notes")
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid game request." };
  const probable = await findProbableGameMatch(parsed.data.requestedName);
  if (probable?.type === "game") {
    return { ok: false, message: `That looks like ${probable.name}, which is already in the catalog.` };
  }
  if (probable?.type === "request") {
    return { ok: false, message: `A pending request already exists for ${probable.name}.` };
  }
  await prisma.gameRequest.create({
    data: {
      requestedName: cleanText(parsed.data.requestedName, 120),
      normalizedName: normalizeGameSlug(parsed.data.requestedName),
      steamStoreUrl: parsed.data.steamStoreUrl || null,
      notes: cleanText(parsed.data.notes ?? "", 1000) || null,
      requestedById: user.id
    }
  });
  revalidatePath("/games/request");
  return { ok: true, message: "Game request submitted for admin review." };
}

export async function upsertAdminGame(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!canAdmin(user.role as never)) return { ok: false, message: "Only administrators can manage games." };
  const parsed = adminGameSchema.safeParse({
    name: formData.get("name"),
    shortName: formData.get("shortName"),
    description: formData.get("description"),
    coverImageUrl: formData.get("coverImageUrl"),
    aliases: formList(formData, "aliases"),
    platforms: formList(formData, "platforms"),
    categories: formList(formData, "categories"),
    listingEnabled: checkbox(formData, "listingEnabled"),
    isActive: checkbox(formData, "isActive"),
    supportsOnlineCoop: checkbox(formData, "supportsOnlineCoop"),
    supportsLocalCoop: checkbox(formData, "supportsLocalCoop"),
    supportsDedicatedServers: checkbox(formData, "supportsDedicatedServers"),
    supportsCrossplay: checkbox(formData, "supportsCrossplay"),
    minimumPlayers: formData.get("minimumPlayers") || null,
    maximumPlayers: formData.get("maximumPlayers") || null
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid game." };
  const id = String(formData.get("gameId") ?? "");
  const slug = normalizeGameSlug(parsed.data.name);
  const existing = id
    ? await prisma.game.findUnique({ where: { id }, select: { id: true } })
    : await prisma.game.findFirst({
        where: { OR: [{ slug }, { aliases: { hasSome: uniqueAliases(parsed.data.name, parsed.data.aliases) } }] },
        select: { id: true }
      });
  const saved = existing
    ? await prisma.game.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name,
          shortName: parsed.data.shortName || null,
          slug,
          description: cleanText(parsed.data.description, 1000),
          coverImageUrl: parsed.data.coverImageUrl || null,
          fallbackGradient: stableGameGradient(slug),
          source: "ADMIN",
          approvalStatus: "APPROVED",
          approvedAt: new Date(),
          approvedById: user.id,
          aliases: uniqueAliases(parsed.data.name, parsed.data.aliases),
          isActive: parsed.data.isActive,
          active: parsed.data.isActive,
          listingEnabled: parsed.data.listingEnabled,
          supportsOnlineCoop: parsed.data.supportsOnlineCoop,
          supportsLocalCoop: parsed.data.supportsLocalCoop,
          supportsDedicatedServers: parsed.data.supportsDedicatedServers,
          supportsCrossplay: parsed.data.supportsCrossplay,
          crossPlatform: parsed.data.supportsCrossplay,
          minimumPlayers: parsed.data.minimumPlayers,
          maximumPlayers: parsed.data.maximumPlayers
        }
      })
    : await prisma.game.create({
        data: {
          name: parsed.data.name,
          shortName: parsed.data.shortName || null,
          slug,
          description: cleanText(parsed.data.description, 1000),
          coverImageUrl: parsed.data.coverImageUrl || null,
          fallbackGradient: stableGameGradient(slug),
          source: "ADMIN",
          approvalStatus: "APPROVED",
          approvedAt: new Date(),
          approvedById: user.id,
          aliases: uniqueAliases(parsed.data.name, parsed.data.aliases),
          isActive: parsed.data.isActive,
          active: parsed.data.isActive,
          listingEnabled: parsed.data.listingEnabled,
          supportsOnlineCoop: parsed.data.supportsOnlineCoop,
          supportsLocalCoop: parsed.data.supportsLocalCoop,
          supportsDedicatedServers: parsed.data.supportsDedicatedServers,
          supportsCrossplay: parsed.data.supportsCrossplay,
          crossPlatform: parsed.data.supportsCrossplay,
          minimumPlayers: parsed.data.minimumPlayers,
          maximumPlayers: parsed.data.maximumPlayers
        }
      });
  await prisma.gamePlatform.deleteMany({ where: { gameId: saved.id } });
  await prisma.gamePlatform.createMany({ data: parsed.data.platforms.map((platform) => ({ gameId: saved.id, platform })), skipDuplicates: true });
  await prisma.gameCategoryOnGame.deleteMany({ where: { gameId: saved.id } });
  for (const categorySlug of parsed.data.categories) {
    const category = await prisma.gameCategory.findUnique({ where: { slug: categorySlug } });
    if (category) await prisma.gameCategoryOnGame.create({ data: { gameId: saved.id, categoryId: category.id } });
  }
  await prisma.auditLog.create({ data: { actorId: user.id, action: existing ? "edit-game" : "add-game", targetType: "Game", targetId: saved.id } });
  revalidatePath("/admin/games");
  return { ok: true, message: existing ? "Game updated." : "Game added." };
}

export async function setGameCatalogState(gameId: string, action: "disable-listings" | "reactivate" | "archive") {
  const user = await requireUser();
  if (!canAdmin(user.role as never)) return;
  const data =
    action === "archive"
      ? { approvalStatus: "ARCHIVED" as const, isActive: false, active: false, listingEnabled: false }
      : action === "reactivate"
        ? { approvalStatus: "APPROVED" as const, isActive: true, active: true, listingEnabled: true }
        : { listingEnabled: false };
  await prisma.game.update({ where: { id: gameId }, data });
  await prisma.auditLog.create({ data: { actorId: user.id, action, targetType: "Game", targetId: gameId } });
  revalidatePath("/admin/games");
}

export async function reviewGameRequest(requestId: string, status: "APPROVED" | "REJECTED" | "DUPLICATE") {
  const user = await requireUser();
  if (!canAdmin(user.role as never)) return;
  const request = await prisma.gameRequest.findUnique({ where: { id: requestId } });
  if (!request) return;
  let probableGameId = request.probableGameId;
  if (status === "APPROVED") {
    const slug = normalizeGameSlug(request.requestedName);
    const game = await prisma.game.upsert({
      where: { slug },
      create: {
        name: request.requestedName,
        slug,
        description: request.notes || "User-requested game awaiting richer catalog metadata.",
        fallbackGradient: stableGameGradient(slug),
        source: "USER_REQUEST",
        approvalStatus: "APPROVED",
        isActive: true,
        active: true,
        listingEnabled: true,
        aliases: uniqueAliases(request.requestedName),
        approvedAt: new Date(),
        approvedById: user.id,
        platforms: { create: [{ platform: "PC" }] }
      },
      update: { approvalStatus: "APPROVED", isActive: true, active: true, listingEnabled: true, approvedAt: new Date(), approvedById: user.id }
    });
    probableGameId = game.id;
  }
  await prisma.gameRequest.update({ where: { id: requestId }, data: { status, reviewedById: user.id, reviewedAt: new Date(), probableGameId } });
  await prisma.auditLog.create({ data: { actorId: user.id, action: `game-request-${status.toLowerCase()}`, targetType: "GameRequest", targetId: requestId } });
  revalidatePath("/admin/games");
}

export async function mergeGamesAction(formData: FormData) {
  const user = await requireUser();
  if (!canAdmin(user.role as never)) return;
  await mergeGames(String(formData.get("sourceGameId")), String(formData.get("targetGameId")), user.id);
  revalidatePath("/admin/games");
}

