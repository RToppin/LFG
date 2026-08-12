export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LfgPostForm } from "@/components/LfgPostForm";
import { getApprovedGamesForSelection } from "@/lib/game-catalog";

export default async function NewLfgPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.onboarded) redirect("/onboarding");
  const games = await getApprovedGamesForSelection();
  return (
    <div className="container grid gap-6 py-8">
      <div>
        <h1 className="text-3xl font-black">Create group post</h1>
        <p className="muted">Publish a fresh listing or save a draft. Campaign duration and listing expiration are tracked separately.</p>
      </div>
      <section className="panel p-6">
        <LfgPostForm games={games} />
      </section>
    </div>
  );
}
