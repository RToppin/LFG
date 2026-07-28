export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { moderateReport } from "@/app/actions";
import { auth } from "@/auth";
import { canModerate } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user || !canModerate(session.user.role as never)) redirect("/dashboard");
  const reports = await prisma.report.findMany({
    include: {
      reporter: { include: { profile: true } },
      reportedUser: { include: { profile: true } },
      post: true
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return (
    <div className="container grid gap-6 py-8">
      <h1 className="text-3xl font-black">Reports</h1>
      <div className="panel grid gap-3 p-5">
        {reports.length ? reports.map((report) => (
          <div className="grid gap-3 border-b border-[var(--line)] py-3" key={report.id}>
            <div>
              <strong>{report.type.replaceAll("_", " ")}</strong>
              <p className="muted text-sm">{report.details || "No extra details."}</p>
              <p className="muted text-sm">Status: {report.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={async () => {
                "use server";
                await moderateReport(report.id, "dismiss");
              }}>
                <button className="btn secondary" type="submit">Dismiss</button>
              </form>
              {report.postId ? (
                <form action={async () => {
                  "use server";
                  await moderateReport(report.id, "remove-post");
                }}>
                  <button className="btn danger" type="submit">Remove post</button>
                </form>
              ) : null}
            </div>
          </div>
        )) : <p className="muted">No reports.</p>}
      </div>
    </div>
  );
}
