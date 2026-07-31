export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addUserGame, removeUserGame } from "@/app/actions";
import { auth } from "@/auth";
import { ActionForm } from "@/components/ActionForm";
import { ExperienceSelect, PlatformSelect, PlayStyleChecks } from "@/components/FormControls";
import { GameCover } from "@/components/GameCover";
import { GameSelector } from "@/components/GameSelector";
import { prisma } from "@/lib/db";
import { getApprovedGamesForSelection } from "@/lib/game-catalog";

export default async function GameSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [games, profile] = await Promise.all([
    getApprovedGamesForSelection({ excludeTestFixtures: true }),
    prisma.profile.findUnique({ where: { userId: session.user.id }, include: { games: { include: { game: true } } } })
  ]);
  if (!profile) redirect("/onboarding");
  return (
    <div className="container grid gap-6 py-8">
      <section className="panel grid gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-black">Game library</h1><Link className="btn secondary" href="/games/request">Request missing game</Link></div>
        <ActionForm action={addUserGame} submitLabel="Add or update game">
          <div className="grid-auto">
            <GameSelector games={games} />
            <label className="field">
              <span>Platform</span>
              <PlatformSelect />
            </label>
            <label className="field">
              <span>Experience</span>
              <ExperienceSelect />
            </label>
          </div>
          <fieldset className="grid gap-3">
            <legend className="label">Play styles</legend>
            <PlayStyleChecks />
          </fieldset>
          <div className="grid-auto">
            <label className="flex items-center gap-2">
              <input name="canHost" type="checkbox" /> I can host
            </label>
            <label className="flex items-center gap-2">
              <input name="usesMods" type="checkbox" /> I use mods
            </label>
            <label className="flex items-center gap-2">
              <input name="notificationsOff" type="checkbox" /> Disable matching notifications
            </label>
          </div>
        </ActionForm>
      </section>
      <section className="grid-auto">
        {profile.games.map((entry) => (
          <div className="card overflow-hidden" key={entry.id}>
            <GameCover game={entry.game} className="h-24" imageSizes="(max-width: 768px) 100vw, 320px" initialsClassName="text-xl" />
            <div className="grid gap-2 p-4">
              <h2 className="font-black">{entry.game.name}</h2>
              <p className="muted text-sm">{entry.platform.replaceAll("_", " ")} | {entry.experience}</p>
              <div className="flex flex-wrap gap-2">
                {entry.playStyles.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              </div>
              <form action={async () => { "use server"; await removeUserGame(entry.id); }}>
                <button className="btn secondary" type="submit">Remove</button>
              </form>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
