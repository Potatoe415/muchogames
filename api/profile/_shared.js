// Shared helpers for api/profile/*. Not a route itself.

/** Never leak internal column names (e.g. avatar_url) past this boundary. */
export function toPublicProfile(row) {
  return {
    name: row?.name || "",
    avatarUrl: row?.avatar_url || "",
    wins: row?.wins || 0,
    losses: row?.losses || 0
  };
}
