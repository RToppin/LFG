import { redirect } from "next/navigation";
import { addUserGame } from "@/app/actions";
import { auth } from "@/auth";
import { ActionForm } from "@/components/ActionForm";
import { ExperienceSelect, PlatformSelect, PlayStyleChecks } from "@/components/FormControls";
import { prisma } from "@/lib/db";

export default async function GameSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [games, profile] = await Promise.all([
    prisma.game.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.profile.findUnique({ where: { userId: session.user.id }, include: { games: { include: { game: true } } } })
  ]);
  if (!profile) redirect("/onboarding");
  return (
    <div className="container grid gap-6 py-8">
      <section className="panel grid gap-4 p-6">
        <h1 className="text-3xl font-black">Game library</h1>
        <ActionForm action={addUserGame} submitLabel="Add or update game">
          <div className="grid-auto">
            <label className="field">
              <span>Game</span>
              <select className="input" name="gameId">
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </label>
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
          <div className="card p-4" key={entry.id}>
            <h2 className="font-black">{entry.game.name}</h2>
            <p className="muted text-sm">{entry.platform.replaceAll("_", " ")} · {entry.experience}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {entry.playStyles.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
