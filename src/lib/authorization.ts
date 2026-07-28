import { UserRole } from "@prisma/client";

export function canModerate(role: UserRole | undefined | null) {
  return role === "MODERATOR" || role === "ADMIN";
}

export function canAdmin(role: UserRole | undefined | null) {
  return role === "ADMIN";
}

export function assertOwnerOrModerator(resourceOwnerId: string, actor: { id: string; role: UserRole }) {
  if (resourceOwnerId !== actor.id && !canModerate(actor.role)) {
    throw new Error("You are not authorized to perform this action.");
  }
}

export function canDisconnectDiscord(hasDiscord: boolean, authProviderCount: number) {
  return hasDiscord && authProviderCount > 1;
}
