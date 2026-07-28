export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { signInWithDiscord } from "@/app/actions";
import { auth } from "@/auth";
import { canDisconnectDiscord } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export default async function ConnectionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [profile, accounts] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.account.findMany({ where: { userId: session.user.id } })
  ]);
  const discordAccount = accounts.find((account) => account.provider === "discord");
  const canDisconnect = canDisconnectDiscord(Boolean(discordAccount || profile?.discordConnected), accounts.length);

  async function disconnectDiscord() {
    "use server";
    const current = await auth();
    if (!current?.user) return;
    const currentAccounts = await prisma.account.findMany({ where: { userId: current.user.id } });
    if (!canDisconnectDiscord(currentAccounts.some((account) => account.provider === "discord"), currentAccounts.length)) return;
    await prisma.$transaction([
      prisma.account.deleteMany({ where: { userId: current.user.id, provider: "discord" } }),
      prisma.profile.updateMany({
        where: { userId: current.user.id },
        data: {
          discordConnected: false,
          discordUserId: null,
          discordUsername: null,
          discordDisplayName: null,
          discordAvatar: null
        }
      })
    ]);
  }

  return (
    <div className="container py-8">
      <section className="panel grid gap-5 p-6">
        <h1 className="text-3xl font-black">Connections</h1>
        <div className="card grid gap-3 p-4">
          <h2 className="text-xl font-black">Discord</h2>
          <p className="muted">
            {discordAccount || profile?.discordConnected
              ? `Connected${profile?.discordUsername ? ` as ${profile.discordUsername}` : ""}.`
              : "Not connected."}
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={signInWithDiscord}>
              <button className="btn" type="submit">
                {discordAccount ? "Reconnect Discord" : "Connect Discord"}
              </button>
            </form>
            {canDisconnect ? (
              <form action={disconnectDiscord}>
                <button className="btn danger" type="submit">
                  Disconnect Discord
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
