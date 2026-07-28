import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type NotificationInput = {
  userId: string;
  postId?: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  dedupeKey?: string;
};

export async function createNotification(input: NotificationInput) {
  const preference = await prisma.notificationPreference.findUnique({ where: { userId: input.userId } });
  if (preference && !preference.inApp) return null;

  try {
    return await prisma.notification.create({ data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}

export async function markExpiringPosts(now = new Date()) {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const posts = await prisma.lfgPost.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gte: now, lte: tomorrow }
    },
    select: { id: true, ownerId: true, title: true }
  });

  await Promise.all(
    posts.map((post) =>
      createNotification({
        userId: post.ownerId,
        postId: post.id,
        type: "POST_EXPIRING_SOON",
        title: "Post expiring soon",
        body: `${post.title} expires in about 24 hours.`,
        link: `/lfg/${post.id}`,
        dedupeKey: `expiring:${post.id}`
      })
    )
  );

  return posts.length;
}
