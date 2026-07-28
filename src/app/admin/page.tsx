export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canModerate } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || !canModerate(session.user.role as never)) redirect("/dashboard");
  const [reports, users, games] = await Promise.all([
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.user.count(),
    prisma.game.count()
  ]);
  return (
    <div className="container grid gap-6 py-8">
      <h1 className="text-3xl font-black">Admin</h1>
      <div className="grid-auto">
        <Link className="card p-5" href="/admin/reports"><strong>Reports</strong><p className="muted">{reports} open</p></Link>
        <Link className="card p-5" href="/admin/users"><strong>Users</strong><p className="muted">{users} total</p></Link>
        <Link className="card p-5" href="/admin/games"><strong>Games</strong><p className="muted">{games} catalog entries</p></Link>
      </div>
    </div>
  );
}
