import { redirect } from "next/navigation";
import { Platform } from "@prisma/client";
import { auth } from "@/auth";
import { canAdmin, canModerate } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export default async function AdminGamesPage() {
  const session = await auth();
  if (!session?.user || !canModerate(session.user.role as never)) redirect("/dashboard");
  async function addGame(formData: FormData) {
    "use server";
    const current = await auth();
    if (!current?.user || !canAdmin(current.user.role as never)) return;
    const name = String(formData.get("name"));
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await prisma.game.create({
      data: {
        name,
        slug,
        description: String(formData.get("description")),
        fallbackGradient: "bg-gradient-to-br from-emerald-500 to-slate-900",
        platforms: { create: [{ platform: Platform.PC }] }
      }
    });
  }
  async function disableGame(formData: FormData) {
    "use server";
    const current = await auth();
    if (!current?.user || !canAdmin(current.user.role as never)) return;
    await prisma.game.update({ where: { id: String(formData.get("gameId")) }, data: { active: false } });
  }
  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="container grid gap-6 py-8">
      <section className="panel grid gap-4 p-6">
        <h1 className="text-3xl font-black">Manage games</h1>
        {session.user.role === "ADMIN" ? (
          <form action={addGame} className="grid-auto">
            <input className="input" name="name" placeholder="Game name" required />
            <input className="input" name="description" placeholder="Short description" required />
            <button className="btn" type="submit">Add game</button>
          </form>
        ) : null}
      </section>
      <section className="panel grid gap-2 p-5">
        {games.map((game) => (
          <form action={disableGame} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] py-2" key={game.id}>
            <span>{game.name} · {game.active ? "Active" : "Disabled"}</span>
            <input name="gameId" type="hidden" value={game.id} />
            {session.user.role === "ADMIN" && game.active ? <button className="btn danger" type="submit">Disable</button> : null}
          </form>
        ))}
      </section>
    </div>
  );
}
