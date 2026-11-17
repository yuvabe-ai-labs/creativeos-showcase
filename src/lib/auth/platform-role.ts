// Who may manage the showcase, read from the JWT's app_metadata (only the service role can
// set it, so a user can't grant it to themselves). Two ways in:
// - a CreativeOS super admin (`platform_role: "super_admin"`), or
// - a showcase-only login (`showcase_admin: true`), e.g. the sales account. It opens this
//   admin and nothing in CreativeOS.
// Anything else, including near misses like "Super_Admin" or "true", is refused: fail closed.
export function canManageShowcase(appMetadata: unknown): boolean {
  if (typeof appMetadata !== "object" || appMetadata === null) return false;
  const meta = appMetadata as Record<string, unknown>;
  return meta.platform_role === "super_admin" || meta.showcase_admin === true;
}
