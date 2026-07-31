export const dynamic = "force-dynamic";
import Link from "next/link";
import { GameCover } from "@/components/GameCover";
import { prisma } from "@/lib/db";
import { TEST_FIXTURE_GAME_NAME_FILTER } from "@/lib/game-catalog";

export default async function GamesPage() {
  const games = await prisma.game.findMany({
    where: { approvalStatus: "APPROVED", isActive: true, listingEnabled: true, NOT: TEST_FIXTURE_GAME_NAME_FILTER },
    include: { platforms: true, categories: { include: { category: true } }, _count: { select: { posts: true } } },
    orderBy: { name: "asc" }
  });
  return (
    <div className="container grid gap-6 py-8">
      <h1 className="text-3xl font-black">Game catalog</h1>
      <div className="grid-auto">
        {games.map((game) => (
          <Link href={`/games/${game.slug}`} className="card overflow-hidden" key={game.id}>
            <GameCover game={game} className="h-32" />
            <div className="grid gap-2 p-4">
              <h2 className="text-xl font-black">{game.name}</h2>
              <p className="text-sm text-[var(--muted)]">{game.description}</p>
              <p className="text-sm font-bold text-[var(--accent)]">{game._count.posts} LFG posts</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
