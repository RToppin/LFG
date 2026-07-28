type GameCoverGame = {
  name: string;
  coverImage?: string | null;
  coverImageUrl?: string | null;
  fallbackGradient: string;
};

export function GameCover({
  game,
  className = "h-28",
  initialsClassName = "text-2xl"
}: {
  game: GameCoverGame;
  className?: string;
  imageSizes?: string;
  initialsClassName?: string;
}) {
  const source = game.coverImageUrl ?? game.coverImage;

  return (
    <div
      className={`relative grid place-items-center overflow-hidden bg-cover bg-center ${className} ${game.fallbackGradient}`}
      style={
        source
          ? {
              backgroundImage: `linear-gradient(to top, rgba(7, 11, 16, 0.74), rgba(7, 11, 16, 0.08)), url("${source}")`
            }
          : undefined
      }
    >
      {!source ? <span className={`font-black text-white drop-shadow ${initialsClassName}`}>{initials(game.name)}</span> : null}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
