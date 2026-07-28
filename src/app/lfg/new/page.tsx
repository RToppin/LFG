import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LfgPostForm } from "@/components/LfgPostForm";
import { prisma } from "@/lib/db";

export default async function NewLfgPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.onboarded) redirect("/onboarding");
  const games = await prisma.game.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  return (
    <div className="container grid gap-6 py-8">
      <div>
        <h1 className="text-3xl font-black">Create LFG post</h1>
        <p className="muted">Publish a fresh listing or save a draft. Campaign duration and listing expiration are tracked separately.</p>
      </div>
      <section className="panel p-6">
        <LfgPostForm games={games} />
      </section>
    </div>
  );
}
