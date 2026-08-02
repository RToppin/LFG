"use server";

import { ProfileVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cleanText } from "@/lib/sanitize";
import { parseSocialLinks } from "@/lib/social-links";

type ActionState = { ok: boolean; message: string };

async function requireSettingsUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export async function saveNotificationSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireSettingsUser();
  const data = {
    inApp: checkbox(formData, "inApp"),
    email: checkbox(formData, "email"),
    recommendations: checkbox(formData, "recommendations"),
    joinRequests: checkbox(formData, "joinRequests"),
    groupUpdates: checkbox(formData, "groupUpdates"),
    expirationReminders: checkbox(formData, "expirationReminders"),
    productAnnouncements: checkbox(formData, "productAnnouncements")
  };

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data
  });
  revalidatePath("/settings/profile");
  revalidatePath("/settings/notifications");
  return { ok: true, message: "Notification preferences saved." };
}

export async function savePrivacyDisplaySettings(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireSettingsUser();
  const visibility = String(formData.get("visibility") ?? "PUBLIC");
  if (!Object.values(ProfileVisibility).includes(visibility as ProfileVisibility)) {
    return { ok: false, message: "Choose a supported profile visibility." };
  }

  const result = await prisma.profile.updateMany({
    where: { userId: user.id },
    data: {
      visibility: visibility as ProfileVisibility,
      showPastGroups: checkbox(formData, "showPastGroups"),
      timeZone: cleanText(String(formData.get("timeZone") ?? "America/New_York"), 80),
      region: cleanText(String(formData.get("region") ?? "United States"), 80),
      availability: cleanText(String(formData.get("availability") ?? ""), 300)
    }
  });

  if (result.count === 0) return { ok: false, message: "Create your profile before saving display settings." };
  revalidatePath("/settings/profile");
  return { ok: true, message: "Privacy and display settings saved." };
}

export async function saveSocialLinks(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireSettingsUser();
  const kinds = formData.getAll("kind").map(String);
  const urls = formData.getAll("url").map(String);
  const parsed = parseSocialLinks(kinds.map((kind, index) => ({ kind, url: urls[index] ?? "" })));

  if (!parsed.ok) return { ok: false, message: parsed.message };

  await prisma.$transaction(async (tx) => {
    await tx.socialLink.deleteMany({ where: { userId: user.id } });
    if (parsed.links.length) {
      await tx.socialLink.createMany({
        data: parsed.links.map((link, sortOrder) => ({
          userId: user.id,
          kind: link.kind,
          url: link.url,
          sortOrder
        }))
      });
    }
  });

  revalidatePath("/settings/profile");
  revalidatePath(`/profile/${user.username ?? user.id}`);
  return { ok: true, message: "Social links saved." };
}