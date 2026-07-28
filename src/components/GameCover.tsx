import Image from "next/image";

type GameCoverGame = {
  name: string;
  coverImage?: string | null;
  coverImageUrl?: string | null;
  fallbackGradient: string;
};

export function GameCover({
  game,
  className = "h-28",
  imageSizes = "(max-width: 768px) 100vw, 360px",
  initialsClassName = "text-2xl"
}: {
  game: GameCoverGame;
  className?: string;
  imageSizes?: string;
  initialsClassName?: string;
}) {
  const source = game.coverImageUrl ?? game.coverImage;

  return (
    <div className={`relative grid place-items-center overflow-hidden ${className} ${game.fallbackGradient}`}>
      {source ? (
        <>
          <Image alt="" className="object-cover" fill sizes={imageSizes} src={source} />
          <span className="absolute inset-0 bg-gradient-to-t from-[#070b10]/75 via-[#070b10]/10 to-transparent" aria-hidden />
        </>
      ) : (
        <span className={`font-black text-white drop-shadow ${initialsClassName}`}>{initials(game.name)}</span>
      )}
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