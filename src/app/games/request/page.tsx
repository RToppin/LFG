export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requestGame } from "@/app/actions";
import { auth } from "@/auth";
import { ActionForm } from "@/components/ActionForm";
import { prisma } from "@/lib/db";

export default async function GameRequestPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const requests = await prisma.gameRequest.findMany({
    where: { requestedById: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  return (
    <div className="container grid gap-6 py-8">
      <section className="panel grid gap-5 p-6">
        <div>
          <h1 className="text-3xl font-black">Request an unlisted game</h1>
          <p className="muted">
            Requests go to admins for review. They do not become public catalog games until approved.
          </p>
        </div>
        <ActionForm action={requestGame} submitLabel="Submit request">
          <label className="field">
            <span>Game name</span>
            <input className="input" name="requestedName" required placeholder="Game title" />
          </label>
          <label className="field">
            <span>Steam store URL</span>
            <input className="input" name="steamStoreUrl" placeholder="https://store.steampowered.com/app/..." />
          </label>
          <label className="field">
            <span>Notes</span>
            <textarea className="input textarea" name="notes" placeholder="Platforms, co-op mode, or why this belongs in ReadyLobby." />
          </label>
        </ActionForm>
      </section>
      <section className="panel grid gap-3 p-6">
        <h2 className="text-xl font-black">Your recent requests</h2>
        {requests.length ? (
          requests.map((request) => (
            <div className="border-b border-[var(--line)] py-2" key={request.id}>
              <strong>{request.requestedName}</strong>
              <p className="muted text-sm">{request.status}</p>
            </div>
          ))
        ) : (
          <p className="muted">No requests yet.</p>
        )}
      </section>
    </div>
  );
}
