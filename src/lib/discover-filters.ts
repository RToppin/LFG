export type SearchParamValue = string | string[] | undefined;

export function firstSearchParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseSelectedGameSlugs(value: SearchParamValue, legacyValue?: SearchParamValue) {
  const slugs = toArray(value)
    .concat(toArray(legacyValue))
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => /^[a-z0-9-]+$/.test(entry));

  return Array.from(new Set(slugs));
}

export function selectedGameNames<T extends { name: string; slug: string }>(games: T[], selectedSlugs: string[]) {
  const selected = new Set(selectedSlugs);
  return games.filter((game) => selected.has(game.slug)).map((game) => game.name);
}

function toArray(value: SearchParamValue) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}