import { Platform } from "@prisma/client";

export type SeedCatalogGame = {
  name: string;
  slug?: string;
  shortName?: string;
  description: string;
  sourceRank: number;
  steamAppId?: number;
  coverImageUrl?: string;
  fallbackGradient?: string;
  aliases?: string[];
  platforms?: Platform[];
  categories?: string[];
  supportsCrossplay?: boolean;
  supportsDedicatedServers?: boolean;
  supportsLocalCoop?: boolean;
  supportsOnlineCoop?: boolean;
  minimumPlayers?: number;
  maximumPlayers?: number;
};

export const CATALOG_SOURCE_DATE = "2026-07-28";

export const GAME_CATEGORIES = [
  "Cooperative campaign",
  "Survival crafting",
  "Sandbox",
  "Team competitive",
  "Tactical shooter",
  "Party or social",
  "Sports",
  "MMO",
  "Strategy",
  "Action RPG",
  "Extraction",
  "Horror co-op",
  "Racing",
  "Dedicated-server game",
  "Local co-op"
];

function steamCover(steamAppId: number, fallbackGradient: string) {
  return {
    steamAppId,
    coverImageUrl: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/header.jpg`,
    fallbackGradient
  };
}
export const STEAM_COOP_CATALOG: SeedCatalogGame[] = [
  { name: "Counter-Strike 2", sourceRank: 1, ...steamCover(730, "bg-gradient-to-br from-orange-500 via-slate-800 to-zinc-950"), description: "Team-based tactical shooter with competitive multiplayer.", categories: ["Team competitive", "Tactical shooter"], platforms: [Platform.PC] },
  { name: "Dota 2", sourceRank: 2, ...steamCover(570, "bg-gradient-to-br from-red-700 via-stone-900 to-black"), description: "Team competitive strategy action with coordinated multiplayer roles.", categories: ["Team competitive", "Strategy"], platforms: [Platform.PC] },
  { name: "Palworld", sourceRank: 3, ...steamCover(1623730, "bg-gradient-to-br from-sky-400 via-cyan-700 to-slate-950"), description: "Creature collecting, base building, survival crafting, and co-op exploration.", categories: ["Survival crafting", "Sandbox"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.CROSS_PLATFORM], supportsCrossplay: true, supportsDedicatedServers: true },
  { name: "PUBG: BATTLEGROUNDS", sourceRank: 4, ...steamCover(578080, "bg-gradient-to-br from-amber-400 via-stone-800 to-zinc-950"), description: "Squad-based battle royale shooter.", aliases: ["PUBG", "PlayerUnknown's Battlegrounds"], categories: ["Team competitive", "Tactical shooter"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION] },
  { name: "EA SPORTS FC 26", sourceRank: 5, ...steamCover(3405690, "bg-gradient-to-br from-lime-400 via-emerald-800 to-slate-950"), description: "Football sports multiplayer with team and club modes.", aliases: ["FC 26", "EA FC 26"], categories: ["Sports", "Team competitive"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.NINTENDO_SWITCH] },
  { name: "Rust", sourceRank: 6, ...steamCover(252490, "bg-gradient-to-br from-orange-700 via-neutral-800 to-stone-950"), description: "Open-world survival crafting and base-building multiplayer.", categories: ["Survival crafting", "Sandbox", "Dedicated-server game"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION], supportsDedicatedServers: true },
  { name: "Apex Legends", sourceRank: 7, ...steamCover(1172470, "bg-gradient-to-br from-red-600 via-orange-800 to-zinc-950"), description: "Squad-based hero battle royale shooter.", categories: ["Team competitive", "Tactical shooter"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.NINTENDO_SWITCH, Platform.CROSS_PLATFORM], supportsCrossplay: true },
  { name: "The Binding of Isaac: Rebirth", sourceRank: 8, ...steamCover(250900, "bg-gradient-to-br from-rose-300 via-stone-800 to-zinc-950"), description: "Roguelike action game with co-op modes.", categories: ["Cooperative campaign", "Local co-op"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.NINTENDO_SWITCH], supportsLocalCoop: true },
  { name: "Grand Theft Auto V Legacy", sourceRank: 9, ...steamCover(271590, "bg-gradient-to-br from-green-500 via-cyan-800 to-zinc-950"), description: "Open-world multiplayer action sandbox.", aliases: ["GTA V Legacy", "Grand Theft Auto 5 Legacy"], categories: ["Sandbox", "Team competitive"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION] },
  { name: "Dead by Daylight", sourceRank: 10, ...steamCover(381210, "bg-gradient-to-br from-red-950 via-neutral-900 to-slate-950"), description: "Asymmetric horror multiplayer with coordinated survivor play.", categories: ["Horror co-op", "Team competitive"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.NINTENDO_SWITCH, Platform.CROSS_PLATFORM], supportsCrossplay: true },
  { name: "Grand Theft Auto V Enhanced", sourceRank: 11, ...steamCover(3240220, "bg-gradient-to-br from-fuchsia-500 via-sky-800 to-zinc-950"), description: "Enhanced open-world multiplayer action sandbox.", aliases: ["GTA V Enhanced", "Grand Theft Auto 5 Enhanced"], categories: ["Sandbox", "Team competitive"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION] },
  { name: "Delta Force", sourceRank: 12, ...steamCover(2507950, "bg-gradient-to-br from-emerald-500 via-stone-800 to-black"), description: "Team-based tactical shooter.", categories: ["Team competitive", "Tactical shooter"], platforms: [Platform.PC] },
  { name: "Marvel Rivals", sourceRank: 13, ...steamCover(2767030, "bg-gradient-to-br from-yellow-300 via-red-700 to-blue-950"), description: "Team-based hero shooter.", categories: ["Team competitive"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION] },
  { name: "Slay the Spire 2", sourceRank: 14, ...steamCover(2868840, "bg-gradient-to-br from-violet-500 via-fuchsia-900 to-black"), description: "Deckbuilding roguelike sequel with multiplayer-interest listings.", categories: ["Strategy"], platforms: [Platform.PC] },
  { name: "Warframe", sourceRank: 15, ...steamCover(230410, "bg-gradient-to-br from-sky-300 via-indigo-700 to-slate-950"), description: "Online cooperative action RPG with missions and progression.", categories: ["Cooperative campaign", "Action RPG", "MMO"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.NINTENDO_SWITCH, Platform.CROSS_PLATFORM], supportsCrossplay: true },
  { name: "Team Fortress 2", sourceRank: 16, ...steamCover(440, "bg-gradient-to-br from-orange-600 via-stone-800 to-zinc-950"), description: "Class-based team shooter.", aliases: ["TF2"], categories: ["Team competitive"], platforms: [Platform.PC] },
  { name: "Battlefield 6", sourceRank: 17, ...steamCover(2807960, "bg-gradient-to-br from-cyan-400 via-slate-800 to-black"), description: "Large-scale team shooter.", categories: ["Team competitive", "Tactical shooter"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION] },
  { name: "Tom Clancy's Rainbow Six Siege", sourceRank: 18, ...steamCover(359550, "bg-gradient-to-br from-sky-300 via-neutral-800 to-black"), description: "Team tactical shooter focused on operators and objective play.", aliases: ["Rainbow Six Siege", "R6 Siege"], categories: ["Team competitive", "Tactical shooter"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION] },
  { name: "DayZ", sourceRank: 19, ...steamCover(221100, "bg-gradient-to-br from-lime-600 via-stone-800 to-black"), description: "Open-world survival multiplayer with persistent servers.", categories: ["Survival crafting", "Dedicated-server game"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION], supportsDedicatedServers: true },
  { name: "Hearts of Iron IV", sourceRank: 20, ...steamCover(394360, "bg-gradient-to-br from-neutral-400 via-red-900 to-zinc-950"), description: "Grand strategy multiplayer.", aliases: ["HOI4"], categories: ["Strategy"], platforms: [Platform.PC] },
  { name: "Overwatch", sourceRank: 21, ...steamCover(2357570, "bg-gradient-to-br from-orange-400 via-sky-700 to-slate-950"), description: "Team-based hero shooter.", categories: ["Team competitive"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.NINTENDO_SWITCH] },
  { name: "Deadlock", sourceRank: 22, ...steamCover(1422450, "bg-gradient-to-br from-amber-300 via-teal-800 to-black"), description: "Team-based action strategy shooter.", categories: ["Team competitive", "Strategy"], platforms: [Platform.PC] },
  { name: "Don't Starve Together", sourceRank: 23, ...steamCover(322330, "bg-gradient-to-br from-yellow-600 via-stone-900 to-black"), description: "Cooperative survival crafting with persistent worlds.", aliases: ["DST"], categories: ["Survival crafting", "Cooperative campaign", "Dedicated-server game"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION], supportsDedicatedServers: true },
  { name: "Sid Meier's Civilization VI", sourceRank: 24, ...steamCover(289070, "bg-gradient-to-br from-yellow-500 via-blue-800 to-slate-950"), description: "Turn-based strategy multiplayer.", aliases: ["Civilization VI", "Civ VI", "Civ 6"], categories: ["Strategy"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.NINTENDO_SWITCH] },
  { name: "Garry's Mod", sourceRank: 25, ...steamCover(4000, "bg-gradient-to-br from-sky-400 via-blue-900 to-zinc-950"), description: "Sandbox multiplayer with community modes and servers.", aliases: ["GMod"], categories: ["Sandbox", "Party or social", "Dedicated-server game"], platforms: [Platform.PC], supportsDedicatedServers: true },
  { name: "MECCHA CHAMELEON", sourceRank: 26, ...steamCover(4704690, "bg-gradient-to-br from-pink-400 via-purple-800 to-black"), description: "Multiplayer catalog entry from the captured Steam co-op ranking.", categories: [], platforms: [Platform.PC] },
  { name: "Terraria", sourceRank: 27, ...steamCover(105600, "bg-gradient-to-br from-green-500 via-blue-800 to-slate-950"), description: "2D survival crafting, building, bosses, and campaign progression.", categories: ["Survival crafting", "Cooperative campaign", "Sandbox"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.NINTENDO_SWITCH] },
  { name: "ELDEN RING", sourceRank: 28, ...steamCover(1245620, "bg-gradient-to-br from-yellow-500 via-stone-800 to-black"), description: "Action RPG with cooperative summoning and multiplayer sessions.", aliases: ["Elden Ring"], categories: ["Action RPG", "Cooperative campaign"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION] },
  { name: "PAYDAY 2", sourceRank: 29, ...steamCover(218620, "bg-gradient-to-br from-sky-300 via-blue-900 to-black"), description: "Cooperative heist shooter.", categories: ["Cooperative campaign", "Tactical shooter"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION] },
  { name: "tModLoader", sourceRank: 30, ...steamCover(1281930, "bg-gradient-to-br from-green-400 via-stone-800 to-slate-950"), description: "Terraria mod loader and modded multiplayer platform.", categories: ["Sandbox", "Survival crafting"], platforms: [Platform.PC] },
  { name: "R.E.P.O.", sourceRank: 31, ...steamCover(3241660, "bg-gradient-to-br from-lime-300 via-neutral-800 to-black"), description: "Cooperative horror extraction game.", aliases: ["REPO"], categories: ["Horror co-op", "Extraction"], platforms: [Platform.PC] },
  { name: "Call of Duty", sourceRank: 32, ...steamCover(1938090, "bg-gradient-to-br from-stone-300 via-neutral-800 to-black"), description: "Multiplayer shooter franchise entry.", categories: ["Team competitive", "Tactical shooter"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.CROSS_PLATFORM], supportsCrossplay: true },
  { name: "Scrap Mechanic", sourceRank: 33, ...steamCover(387990, "bg-gradient-to-br from-amber-400 via-orange-800 to-slate-950"), description: "Creative sandbox and survival building multiplayer.", categories: ["Sandbox", "Survival crafting"], platforms: [Platform.PC] },
  { name: "HELLDIVERS 2", sourceRank: 34, ...steamCover(553850, "bg-gradient-to-br from-yellow-400 via-neutral-800 to-black"), description: "Squad cooperative third-person shooter.", aliases: ["Helldivers 2", "HELLDIVERS\u2122 2"], categories: ["Cooperative campaign", "Tactical shooter"], platforms: [Platform.PC, Platform.PLAYSTATION] },
  { name: "Project Zomboid", sourceRank: 35, ...steamCover(108600, "bg-gradient-to-br from-red-700 via-stone-900 to-black"), description: "Hardcore zombie survival with roleplay, mods, and long campaigns.", categories: ["Survival crafting", "Horror co-op", "Dedicated-server game"], platforms: [Platform.PC], supportsDedicatedServers: true },
  { name: "eFootball", sourceRank: 36, ...steamCover(1665460, "bg-gradient-to-br from-blue-500 via-indigo-900 to-slate-950"), description: "Football sports multiplayer.", categories: ["Sports", "Team competitive"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION] },
  { name: "Total War: WARHAMMER III", sourceRank: 37, ...steamCover(1142710, "bg-gradient-to-br from-red-500 via-purple-900 to-black"), description: "Strategy campaign and battle multiplayer.", aliases: ["Total War Warhammer 3"], categories: ["Strategy"], platforms: [Platform.PC] },
  { name: "Left 4 Dead 2", sourceRank: 38, ...steamCover(550, "bg-gradient-to-br from-red-600 via-neutral-900 to-black"), description: "Cooperative zombie campaign shooter.", aliases: ["L4D2"], categories: ["Cooperative campaign", "Horror co-op"], platforms: [Platform.PC, Platform.XBOX] },
  { name: "Forza Horizon 6", sourceRank: 39, ...steamCover(2483190, "bg-gradient-to-br from-pink-400 via-orange-700 to-slate-950"), description: "Open-world racing multiplayer.", categories: ["Racing"], platforms: [Platform.PC, Platform.XBOX] },
  { name: "FINAL FANTASY XIV Online", sourceRank: 40, ...steamCover(39210, "bg-gradient-to-br from-sky-300 via-indigo-800 to-zinc-950"), description: "Online MMO with parties, duties, raids, and social play.", aliases: ["FFXIV", "Final Fantasy 14"], categories: ["MMO", "Cooperative campaign"], platforms: [Platform.PC, Platform.PLAYSTATION, Platform.XBOX] },
  { name: "Warhammer 40,000: Space Marine 2", sourceRank: 41, ...steamCover(2183900, "bg-gradient-to-br from-blue-500 via-yellow-800 to-black"), description: "Cooperative and competitive action shooter.", aliases: ["Space Marine 2"], categories: ["Cooperative campaign", "Team competitive"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION] },
  { name: "NBA 2K26", sourceRank: 42, ...steamCover(3472040, "bg-gradient-to-br from-red-500 via-blue-900 to-slate-950"), description: "Basketball sports multiplayer.", categories: ["Sports", "Team competitive"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION, Platform.NINTENDO_SWITCH] },
  { name: "ARK: Survival Evolved", sourceRank: 43, ...steamCover(346110, "bg-gradient-to-br from-cyan-500 via-emerald-900 to-black"), description: "Dinosaur survival crafting, taming, and tribe progression.", categories: ["Survival crafting", "Dedicated-server game"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION], supportsDedicatedServers: true },
  { name: "Satisfactory", sourceRank: 44, ...steamCover(526870, "bg-gradient-to-br from-orange-500 via-stone-800 to-black"), description: "Cooperative factory building and automation sandbox.", categories: ["Sandbox", "Cooperative campaign", "Dedicated-server game"], platforms: [Platform.PC], supportsDedicatedServers: true },
  { name: "Valheim", sourceRank: 45, ...steamCover(892970, "bg-gradient-to-br from-amber-500 via-teal-900 to-slate-950"), description: "Viking survival crafting with co-op boss progression and long-term worlds.", categories: ["Survival crafting", "Cooperative campaign", "Dedicated-server game"], platforms: [Platform.PC, Platform.XBOX, Platform.CROSS_PLATFORM], supportsDedicatedServers: true, supportsCrossplay: true },
  { name: "Where Winds Meet", sourceRank: 46, ...steamCover(3564740, "bg-gradient-to-br from-emerald-300 via-slate-800 to-zinc-950"), description: "Open-world action RPG with online multiplayer interest.", categories: ["Action RPG", "MMO"], platforms: [Platform.PC, Platform.PLAYSTATION] },
  { name: "Hunt: Showdown 1896", sourceRank: 47, ...steamCover(594650, "bg-gradient-to-br from-amber-600 via-stone-900 to-black"), description: "Extraction shooter with cooperative teams.", aliases: ["Hunt Showdown"], categories: ["Extraction", "Tactical shooter"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION] },
  { name: "Shift At Midnight", sourceRank: 48, ...steamCover(3722330, "bg-gradient-to-br from-violet-400 via-slate-900 to-black"), description: "Multiplayer catalog entry from the captured Steam co-op ranking.", categories: [], platforms: [Platform.PC] },
  { name: "Factorio", sourceRank: 49, ...steamCover(427520, "bg-gradient-to-br from-orange-500 via-neutral-800 to-zinc-950"), description: "Automation factory sandbox with cooperative servers.", categories: ["Sandbox", "Strategy", "Dedicated-server game"], platforms: [Platform.PC, Platform.NINTENDO_SWITCH], supportsDedicatedServers: true },
  { name: "Monster Hunter: World", sourceRank: 50, ...steamCover(582010, "bg-gradient-to-br from-emerald-400 via-cyan-900 to-black"), description: "Cooperative action RPG hunts and progression.", aliases: ["Monster Hunter World", "MHW"], categories: ["Action RPG", "Cooperative campaign"], platforms: [Platform.PC, Platform.XBOX, Platform.PLAYSTATION] }
];
