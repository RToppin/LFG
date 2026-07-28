const DISCORD_INVITE_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/([A-Za-z0-9-]{2,32})(?:\?.*)?$/;

export function parseDiscordInvite(input: string | null | undefined) {
  if (!input) return null;
  const trimmed = input.trim();
  const match = DISCORD_INVITE_PATTERN.exec(trimmed);
  if (!match) return null;
  return {
    code: match[1],
    url: `https://discord.gg/${match[1]}`
  };
}

export function isDiscordInvite(input: string | null | undefined) {
  return parseDiscordInvite(input) !== null;
}
