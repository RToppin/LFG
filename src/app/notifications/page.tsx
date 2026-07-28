import Link from "next/link";
import { redirect } from "next/navigation";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { createdAt: "desc" }
  });
  return (
    <div className="container grid gap-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black">Notifications</h1>
        <form action={markAllNotificationsRead}>
          <button className="btn secondary" type="submit">
            Mark all read
          </button>
        </form>
      </div>
      <div className="panel grid gap-2 p-5">
        {notifications.length ? notifications.map((notification) => (
          <div className="grid gap-2 border-b border-[var(--line)] py-3" key={notification.id}>
            <Link href={notification.link ?? "/dashboard"} className={notification.readAt ? "muted" : "font-black"}>
              {notification.title}
            </Link>
            <p className="muted text-sm">{notification.body}</p>
            {!notification.readAt ? (
              <form action={async () => {
                "use server";
                await markNotificationRead(notification.id);
              }}>
                <button className="btn secondary w-fit" type="submit">
                  Mark read
                </button>
              </form>
            ) : null}
          </div>
        )) : <p className="muted">No notifications yet.</p>}
      </div>
    </div>
  );
}
