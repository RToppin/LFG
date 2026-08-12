export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || !canAdmin(session.user.role as never)) redirect("/dashboard");
  async function suspend(formData: FormData) {
    "use server";
    const current = await auth();
    if (!current?.user || !canAdmin(current.user.role as never)) return;
    const userId = String(formData.get("userId"));
    if (userId === current.user.id) return;
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!target || target.role === "ADMIN") return;
    await prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
    await prisma.auditLog.create({ data: { actorId: current.user.id, action: "suspend-user", targetType: "User", targetId: userId } });
  }
  const users = await prisma.user.findMany({ include: { profile: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="container grid gap-6 py-8">
      <h1 className="text-3xl font-black">Users</h1>
      <div className="panel grid gap-2 p-5">
        {users.map((user) => (
          <form action={suspend} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] py-2" key={user.id}>
            <span>{user.profile?.displayName ?? user.name ?? user.email ?? user.id} · {user.role} · {user.status}</span>
            <input name="userId" type="hidden" value={user.id} />
            <button className="btn danger" type="submit">Suspend</button>
          </form>
        ))}
      </div>
    </div>
  );
}
