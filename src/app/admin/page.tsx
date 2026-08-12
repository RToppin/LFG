export const dynamic = "force-dynamic";
import { Activity, BarChart3, ClipboardList, Gamepad2, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || !canAdmin(session.user.role as never)) redirect("/dashboard");
  const [
    openReports,
    users,
    games,
    activePosts,
    pendingGameRequests,
    pendingJoinRequests,
    usersByRole,
    usersByStatus,
    postsByStatus,
    reportsByStatus,
    recentAuditLogs,
    recentModerationActions
  ] = await Promise.all([
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.user.count(),
    prisma.game.count(),
    prisma.lfgPost.count({ where: { status: "ACTIVE" } }),
    prisma.gameRequest.count({ where: { status: "PENDING" } }),
    prisma.joinRequest.count({ where: { status: "PENDING" } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lfgPost.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.report.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.auditLog.findMany({
      include: { actor: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.moderationAction.findMany({
      include: { actor: { include: { profile: true } }, report: true },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  return (
    <div className="container grid gap-6 py-8">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">Admin only</p>
        <h1 className="text-3xl font-black">Admin</h1>
        <p className="muted">Catalog, user, moderation, and audit activity at a glance.</p>
      </div>

      <div className="grid-auto">
        <MetricCard href="/admin/reports" icon={ClipboardList} label="Open reports" value={openReports} />
        <MetricCard href="/admin/users" icon={Users} label="Total users" value={users} />
        <MetricCard href="/admin/games" icon={Gamepad2} label="Catalog games" value={games} />
        <MetricCard icon={Activity} label="Active posts" value={activePosts} />
        <MetricCard icon={BarChart3} label="Pending game requests" value={pendingGameRequests} />
        <MetricCard icon={ShieldCheck} label="Pending join requests" value={pendingJoinRequests} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Posts by status" items={postsByStatus.map((row) => ({ label: row.status, value: row._count._all }))} />
        <ChartPanel title="Users by role" items={usersByRole.map((row) => ({ label: row.role, value: row._count._all }))} />
        <ChartPanel title="Users by status" items={usersByStatus.map((row) => ({ label: row.status, value: row._count._all }))} />
        <ChartPanel title="Reports by status" items={reportsByStatus.map((row) => ({ label: row.status, value: row._count._all }))} />
      </div>

      <section className="panel grid gap-3 p-5">
        <h2 className="text-xl font-black">Admin access process</h2>
        <p className="muted text-sm">
          Admin access comes from the database-backed <code>User.role</code> value being set to <code>ADMIN</code>. There is no public
          self-service promotion flow. Demo seeding can create <code>admin@example.com</code>, and development credential login can assign an
          admin role to <code>admin...@example.com</code> only when <code>ENABLE_TEST_AUTH=true</code> and <code>NODE_ENV</code> is not production.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <LogPanel
          empty="No audit logs yet."
          items={recentAuditLogs.map((log) => ({
            id: log.id,
            title: log.action,
            detail: `${log.targetType}${log.targetId ? ` | ${log.targetId}` : ""}`,
            actor: displayName(log.actor),
            date: log.createdAt
          }))}
          title="Recent audit logs"
        />
        <LogPanel
          empty="No moderation actions yet."
          items={recentModerationActions.map((action) => ({
            id: action.id,
            title: action.type.replaceAll("_", " "),
            detail: action.report ? `${action.report.type.replaceAll("_", " ")} | ${action.report.status}` : action.note ?? "Moderation action",
            actor: displayName(action.actor),
            date: action.createdAt
          }))}
          title="Recent moderation actions"
        />
      </div>
    </div>
  );
}

function MetricCard({
  href,
  icon: Icon,
  label,
  value
}: {
  href?: string;
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  const content = (
    <div className="card metric-card p-5">
      <span className="settings-section-icon">
        <Icon size={20} aria-hidden />
      </span>
      <span>
        <strong className="block text-2xl">{value}</strong>
        <span className="muted text-sm">{label}</span>
      </span>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function ChartPanel({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <section className="panel grid gap-4 p-5">
      <h2 className="text-xl font-black">{title}</h2>
      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <div className="admin-chart-row" key={item.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>{item.label.replaceAll("_", " ")}</span>
                <strong>{item.value}</strong>
              </div>
              <div className="admin-chart-track">
                <span style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">No data yet.</p>
      )}
    </section>
  );
}

function LogPanel({
  title,
  items,
  empty
}: {
  title: string;
  items: Array<{ id: string; title: string; detail: string; actor: string; date: Date }>;
  empty: string;
}) {
  return (
    <section className="panel grid gap-3 p-5">
      <h2 className="text-xl font-black">{title}</h2>
      {items.length ? (
        <div className="grid gap-2">
          {items.map((item) => (
            <div className="border-b border-[var(--line)] py-2" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{item.title}</strong>
                <span className="muted text-xs">{formatDate(item.date)}</span>
              </div>
              <p className="muted text-sm">{item.detail}</p>
              <p className="muted text-xs">Actor: {item.actor}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </section>
  );
}

function displayName(actor: { profile: { displayName: string } | null; name: string | null; email: string | null } | null) {
  return actor?.profile?.displayName ?? actor?.name ?? actor?.email ?? "System";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}
