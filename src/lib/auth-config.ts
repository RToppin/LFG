export function getDiscordOAuthConfig() {
  const clientId = process.env.DISCORD_CLIENT_ID ?? process.env.AUTH_DISCORD_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET ?? process.env.AUTH_DISCORD_SECRET;
  return { clientId, clientSecret };
}

export function isDiscordAuthConfigured() {
  const { clientId, clientSecret } = getDiscordOAuthConfig();
  return Boolean(clientId && clientSecret);
}
