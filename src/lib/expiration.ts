import { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createNotification, markExpiringPosts } from "@/lib/notifications";
import { shouldExpirePost } from "@/lib/time";

export async function expireStalePosts(now = new Date()) {
  const candidates = await prisma.lfgPost.findMany({
    where: {
      status: { in: ["ACTIVE", "PAUSED", "FULL"] },
      OR: [{ expiresAt: { lt: now } }, { campaignEndsAt: { lt: now } }]
    },
    select: {
      id: true,
      ownerId: true,
      title: true,
      status: true,
      expiresAt: true,
      campaignEndsAt: true
    }
  });

  const expired = candidates.filter((post) => shouldExpirePost(post, now));
  if (expired.length === 0) {
    await markExpiringPosts(now);
    return { expired: 0, warned: 0 };
  }

  await prisma.lfgPost.updateMany({
    where: { id: { in: expired.map((post) => post.id) } },
    data: { status: PostStatus.EXPIRED, closedAt: now }
  });

  await Promise.all(
    expired.map((post) =>
      createNotification({
        userId: post.ownerId,
        postId: post.id,
        type: "POST_EXPIRED",
        title: "Post expired",
        body: `${post.title} is no longer shown in Discover.`,
        link: `/lfg/${post.id}`,
        dedupeKey: `expired:${post.id}`
      })
    )
  );

  const warned = await markExpiringPosts(now);
  return { expired: expired.length, warned };
}
