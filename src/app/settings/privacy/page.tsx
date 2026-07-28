import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export default async function PrivacyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  async function blockByUsername(formData: FormData) {
    "use server";
    const current = await auth();
    if (!current?.user) return;
    const username = String(formData.get("username") ?? "").trim();
    const profile = await prisma.profile.findUnique({ where: { username } });
    if (!profile || profile.userId === current.user.id) return;
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: current.user.id, blockedId: profile.userId } },
      create: { blockerId: current.user.id, blockedId: profile.userId },
      update: {}
    });
  }

  async function unblock(formData: FormData) {
    "use server";
    const current = await auth();
    if (!current?.user) return;
    await prisma.block.deleteMany({
      where: { blockerId: current.user.id, blockedId: String(formData.get("blockedId")) }
    });
  }

  const blocks = await prisma.block.findMany({
    where: { blockerId: session.user.id },
    include: { blocked: { include: { profile: true } } },
    orderBy: { createdAt: "desc" }
  });
  return (
    <div className="container grid gap-6 py-8">
      <section className="panel grid gap-4 p-6">
        <h1 className="text-3xl font-black">Privacy</h1>
        <form action={blockByUsername} className="flex flex-wrap gap-3">
          <input className="input w-72" name="username" placeholder="Username to block" />
          <button className="btn danger" type="submit">
            Block user
          </button>
        </form>
      </section>
      <section className="panel grid gap-3 p-6">
        <h2 className="text-xl font-black">Blocked users</h2>
        {blocks.length ? (
          blocks.map((block) => (
            <form action={unblock} className="flex items-center justify-between gap-3 border-b border-[var(--line)] py-2" key={block.id}>
              <span>{block.blocked.profile?.displayName ?? block.blocked.name ?? block.blockedId}</span>
              <input name="blockedId" type="hidden" value={block.blockedId} />
              <button className="btn secondary" type="submit">
                Unblock
              </button>
            </form>
          ))
        ) : (
          <p className="muted">No blocked users.</p>
        )}
      </section>
    </div>
  );
}
