export const dynamic = "force-dynamic";

import { Platform } from "@prisma/client";
import { redirect } from "next/navigation";
import { mergeGamesAction, reviewGameRequest, setGameCatalogState, upsertAdminGame } from "@/app/actions";
import { auth } from "@/auth";
import { ActionForm } from "@/components/ActionForm";
import { GameCover } from "@/components/GameCover";
import { canModerate } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { GAME_CATEGORIES } from "@/lib/steam-catalog";

export default async function AdminGamesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  if (!session?.user || !canModerate(session.user.role as never)) redirect("/dashboard");
  const params = await searchParams;
  const q = params.q?.trim();
  const [games, categories, requests] = await Promise.all([
    prisma.game.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { aliases: { has: q } }
            ]
          }
        : undefined,
      include: {
        platforms: true,
        categories: { include: { category: true } },
        requests: true,
        _count: { select: { userGames: true, posts: { where: { status: "ACTIVE" } } } }
      },
      orderBy: [{ sourceRank: "asc" }, { name: "asc" }],
      take: 150
    }),
    prisma.gameCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.gameRequest.findMany({
      where: { status: "PENDING" },
      include: { requestedBy: { include: { profile: true } }, probableGame: true },
      orderBy: { createdAt: "asc" },
      take: 100
    })
  ]);

  return (
    <div className="container grid gap-6 py-8">
      <section className="panel grid gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Manage games</h1>
            <p className="muted">Approved, active, listing-enabled games are available for new LFG posts.</p>
          </div>
          <form className="flex gap-2">
            <input className="input w-72" name="q" defaultValue={q} placeholder="Search games or aliases" />
            <button className="btn secondary" type="submit">Search</button>
          </form>
        </div>
        {session.user.role === "ADMIN" ? (
          <ActionForm action={upsertAdminGame} className="grid gap-4" submitLabel="Add or update game">
            <div className="grid-auto">
              <label className="field"><span>Name</span><input className="input" name="name" required /></label>
              <label className="field"><span>Short name</span><input className="input" name="shortName" /></label>
              <label className="field"><span>Cover image URL</span><input className="input" name="coverImageUrl" /></label>
            </div>
            <label className="field"><span>Description</span><textarea className="input textarea" name="description" required /></label>
            <label className="field"><span>Aliases</span><input className="input" name="aliases" placeholder="One alias; submit multiple fields through future richer UI" /></label>
            <div className="grid-auto">
              {Object.values(Platform).map((platform) => (
                <label className="flex items-center gap-2" key={platform}>
                  <input defaultChecked={platform === "PC"} name="platforms" type="checkbox" value={platform} />
                  {platform.replaceAll("_", " ")}
                </label>
              ))}
            </div>
            <fieldset className="grid gap-2">
              <legend className="label">Categories</legend>
              <div className="grid-auto">
                {categories.map((category) => (
                  <label className="flex items-center gap-2" key={category.id}>
                    <input name="categories" type="checkbox" value={category.slug} />
                    {category.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid-auto">
              <label className="flex items-center gap-2"><input defaultChecked name="isActive" type="checkbox" /> Active</label>
              <label className="flex items-center gap-2"><input defaultChecked name="listingEnabled" type="checkbox" /> New listings enabled</label>
              <label className="flex items-center gap-2"><input defaultChecked name="supportsOnlineCoop" type="checkbox" /> Online co-op</label>
              <label className="flex items-center gap-2"><input name="supportsLocalCoop" type="checkbox" /> Local co-op</label>
              <label className="flex items-center gap-2"><input name="supportsDedicatedServers" type="checkbox" /> Dedicated servers</label>
              <label className="flex items-center gap-2"><input name="supportsCrossplay" type="checkbox" /> Crossplay</label>
            </div>
            <div className="grid-auto">
              <label className="field"><span>Minimum players</span><input className="input" name="minimumPlayers" type="number" min="1" /></label>
              <label className="field"><span>Maximum players</span><input className="input" name="maximumPlayers" type="number" min="1" /></label>
            </div>
          </ActionForm>
        ) : null}
      </section>

      <section className="panel grid gap-3 p-6">
        <h2 className="text-xl font-black">Pending game requests</h2>
        {requests.length ? requests.map((request) => (
          <div className="grid gap-2 border-b border-[var(--line)] py-3" key={request.id}>
            <div>
              <strong>{request.requestedName}</strong>
              <p className="muted text-sm">Requested by {request.requestedBy.profile?.displayName ?? request.requestedBy.name ?? "Player"}</p>
              {request.steamStoreUrl ? <a className="text-sm text-[var(--accent)]" href={request.steamStoreUrl} target="_blank" rel="noreferrer">Steam store URL</a> : null}
              <p className="muted text-sm">{request.notes || "No notes."}</p>
              {request.probableGame ? <p className="text-sm text-[var(--accent)]">Probable duplicate: {request.probableGame.name}</p> : null}
            </div>
            {session.user.role === "ADMIN" ? (
              <div className="flex flex-wrap gap-2">
                <form action={async () => { "use server"; await reviewGameRequest(request.id, "APPROVED"); }}><button className="btn" type="submit">Approve</button></form>
                <form action={async () => { "use server"; await reviewGameRequest(request.id, "REJECTED"); }}><button className="btn secondary" type="submit">Reject</button></form>
                <form action={async () => { "use server"; await reviewGameRequest(request.id, "DUPLICATE"); }}><button className="btn secondary" type="submit">Duplicate</button></form>
              </div>
            ) : null}
          </div>
        )) : <p className="muted">No pending requests.</p>}
      </section>

      {session.user.role === "ADMIN" ? (
        <section className="panel grid gap-3 p-6">
          <h2 className="text-xl font-black">Merge duplicate games</h2>
          <form action={mergeGamesAction} className="grid-auto">
            <label className="field"><span>Duplicate source</span><select className="input" name="sourceGameId">{games.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label>
            <label className="field"><span>Canonical target</span><select className="input" name="targetGameId">{games.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label>
            <button className="btn danger" type="submit">Merge</button>
          </form>
        </section>
      ) : null}

      <section className="panel grid gap-2 p-5">
        <h2 className="text-xl font-black">Catalog entries</h2>
        {games.map((game) => (
          <div className="grid gap-3 border-b border-[var(--line)] py-3" key={game.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <GameCover game={game} className="size-16 rounded-lg" imageSizes="64px" initialsClassName="text-base" />
                <div>
                  <strong>{game.name}</strong>
                  <p className="muted text-sm">
                    {game.approvalStatus} | {game.isActive ? "Active" : "Inactive"} | {game.listingEnabled ? "Listings enabled" : "Listings disabled"} | {game.source}{game.sourceRank ? ` #${game.sourceRank}` : ""}
                  </p>
                  <p className="muted text-sm">Profiles: {game._count.userGames} | Active posts: {game._count.posts}</p>
                  <div className="mt-2 flex flex-wrap gap-1">{game.categories.map(({ category }) => <span className="tag" key={category.slug}>{category.name}</span>)}</div>
                </div>
              </div>
              {session.user.role === "ADMIN" ? (
                <div className="flex flex-wrap gap-2">
                  <form action={async () => { "use server"; await setGameCatalogState(game.id, "disable-listings"); }}><button className="btn secondary" type="submit">Disable new listings</button></form>
                  <form action={async () => { "use server"; await setGameCatalogState(game.id, "reactivate"); }}><button className="btn" type="submit">Reactivate</button></form>
                  <form action={async () => { "use server"; await setGameCatalogState(game.id, "archive"); }}><button className="btn danger" type="submit">Archive</button></form>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </section>
      <p className="muted text-sm">Seeded categories include: {GAME_CATEGORIES.join(", ")}.</p>
    </div>
  );
}
