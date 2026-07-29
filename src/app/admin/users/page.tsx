export const dynamic = "force-dynamic";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canModerate } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || !canModerate(session.user.role as never)) redirect("/dashboard");
  async function setUserStatus(formData: FormData) {
    "use server";
    const current = await auth();
    if (!current?.user || !canModerate(current.user.role as never)) return;
    const userId = String(formData.get("userId"));
    if (userId === current.user.id) return;
    const action = formData.get("action") === "restore-user" ? "restore-user" : "suspend-user";
    await prisma.user.update({
      where: { id: userId },
      data: { status: action === "restore-user" ? "ACTIVE" : "SUSPENDED" }
    });
    await prisma.auditLog.create({ data: { actorId: current.user.id, action, targetType: "User", targetId: userId } });
    revalidatePath("/admin/users");
  }
  const users = await prisma.user.findMany({ include: { profile: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="container grid gap-6 py-8">
      <h1 className="text-3xl font-black">Users</h1>
      <div className="panel grid gap-2 p-5">
        {users.map((user) => (
          <form action={setUserStatus} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] py-2" key={user.id}>
            <span>{user.profile?.displayName ?? user.name ?? user.email ?? user.id} · {user.role} · {user.status}</span>
            <input name="userId" type="hidden" value={user.id} />
            {user.id === session.user.id ? (
              <span className="tag">Current user</span>
            ) : user.status === "SUSPENDED" ? (
              <button className="btn secondary" name="action" type="submit" value="restore-user">Unsuspend</button>
            ) : (
              <button className="btn danger" name="action" type="submit" value="suspend-user">Suspend</button>
            )}
          </form>
        ))}
      </div>
    </div>
  );
}
