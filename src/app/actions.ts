"use server";

import { Prisma, ReportType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { assertOwnerOrModerator, canModerate } from "@/lib/authorization";
import { LISTING_FRESHNESS_DAYS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { parseDiscordInvite } from "@/lib/discord";
import { checkRateLimit } from "@/lib/rate-limit";
import { cleanText } from "@/lib/sanitize";
import { calculateExpirationDate } from "@/lib/time";
import { joinRequestSchema, lfgPostSchema, profileSchema, reportSchema, userGameSchema } from "@/lib/validation";
import { createNotification } from "@/lib/notifications";

type ActionState = { ok: boolean; message: string };

export async function signInWithDiscord() {
  await signIn("discord", { redirectTo: "/dashboard" });
}

export async function signInWithDevUser(formData: FormData) {
  await signIn("credentials", {
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    redirectTo: "/dashboard"
  });
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
  const parsed = lfgPostSchema.safeParse({
    gameId: formData.get("gameId"),
    title: formData.get("title"),
    description: formData.get("description"),
    platform: formData.get("platform"),
    timeZone: formData.get("timeZone"),
    campaignStartsAt: formData.get("campaignStartsAt"),
    campaignEndsAt: formData.get("campaignEndsAt") || null,
    flexibleTime: checkbox(formData, "flexibleTime"),
    playersNeeded: formData.get("playersNeeded"),
    currentGroupSize: formData.get("currentGroupSize"),
    maxPlayers: formData.get("maxPlayers"),
    playStyles: formList(formData, "playStyles"),
    hostingStatus: formData.get("hostingStatus"),
    durationType: formData.get("durationType"),
    joinMode: formData.get("joinMode"),
    edition: formData.get("edition"),
    serverRegion: formData.get("serverRegion"),
    recurringSchedule: formData.get("recurringSchedule"),
    daysOfWeek: formList(formData, "daysOfWeek"),
    sessionLength: formData.get("sessionLength"),
    modded: checkbox(formData, "modded"),
    modpackName: formData.get("modpackName"),
    difficulty: formData.get("difficulty"),
    progressionStage: formData.get("progressionStage"),
    requestedExperience: formData.get("requestedExperience"),
    microphoneRequired: checkbox(formData, "microphoneRequired"),
    preferredLanguage: formData.get("preferredLanguage"),
    minimumAge: formData.get("minimumAge") || null,
    serverRules: formData.get("serverRules"),
    existingWorld: checkbox(formData, "existingWorld"),
    waitlistEnabled: checkbox(formData, "waitlistEnabled"),
    autoCloseWhenFull: checkbox(formData, "autoCloseWhenFull"),
    discordInvite: formData.get("discordInvite"),
    discordInviteVisibility: formData.get("discordInviteVisibility") || "APPROVED_MEMBERS",
    publish: formData.get("intent") !== "draft"
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid post." };
  const now = new Date();
  const status = parsed.data.publish ? "ACTIVE" : "DRAFT";
  const invite = parseDiscordInvite(parsed.data.discordInvite);

  const post = await prisma.lfgPost.create({
    data: {
      ownerId: user.id,
      gameId: parsed.data.gameId,
      title: cleanText(parsed.data.title, 90),
      description: cleanText(parsed.data.description),
      platform: parsed.data.platform,
      timeZone: parsed.data.timeZone,
      campaignStartsAt: parsed.data.campaignStartsAt,
      campaignEndsAt: parsed.data.campaignEndsAt,
      flexibleTime: parsed.data.flexibleTime,
      playersNeeded: parsed.data.playersNeeded,
      currentGroupSize: parsed.data.currentGroupSize,
      maxPlayers: parsed.data.maxPlayers,
      playStyles: parsed.data.playStyles,
      hostingStatus: parsed.data.hostingStatus,
      durationType: parsed.data.durationType,
      joinMode: parsed.data.joinMode,
      status,
      edition: parsed.data.edition || null,
      serverRegion: parsed.data.serverRegion || null,
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
