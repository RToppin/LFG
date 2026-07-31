export function isMissingPrismaTableError(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = String((error as { code?: unknown }).code);
  return code === "P2021" || code === "P2022";
}
