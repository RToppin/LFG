export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  async function save(formData: FormData) {
    "use server";
    const current = await auth();
    if (!current?.user) return;
    await prisma.notificationPreference.upsert({
      where: { userId: current.user.id },
      create: {
        userId: current.user.id,
        inApp: formData.get("inApp") === "on",
        email: formData.get("email") === "on",
        recommendations: formData.get("recommendations") === "on",
        joinRequests: formData.get("joinRequests") === "on",
        groupUpdates: formData.get("groupUpdates") === "on",
        expirationReminders: formData.get("expirationReminders") === "on",
        productAnnouncements: formData.get("productAnnouncements") === "on"
      },
      update: {
        inApp: formData.get("inApp") === "on",
        email: formData.get("email") === "on",
        recommendations: formData.get("recommendations") === "on",
        joinRequests: formData.get("joinRequests") === "on",
        groupUpdates: formData.get("groupUpdates") === "on",
        expirationReminders: formData.get("expirationReminders") === "on",
        productAnnouncements: formData.get("productAnnouncements") === "on"
      }
    });
  }
  const preferences = await prisma.notificationPreference.upsert({ where: { userId: session.user.id }, create: { userId: session.user.id }, update: {} });
  const items = [
    ["inApp", "In-app notifications"],
    ["email", "Email notifications"],
    ["recommendations", "Recommendation notifications"],
    ["joinRequests", "Join requests"],
    ["groupUpdates", "Group updates"],
    ["expirationReminders", "Expiration reminders"],
    ["productAnnouncements", "Product announcements"]
  ] as const;
  return (
    <div className="container py-8">
      <section className="panel grid gap-4 p-6">
        <h1 className="text-3xl font-black">Notification settings</h1>
        <form action={save} className="grid gap-3">
          {items.map(([name, label]) => (
            <label className="flex items-center gap-2" key={name}>
              <input defaultChecked={Boolean(preferences[name])} name={name} type="checkbox" />
              {label}
            </label>
          ))}
          <button className="btn w-fit" type="submit">Save settings</button>
        </form>
      </section>
    </div>
  );
}
