// Players moderation actions for api/admin/index.js. Not a route itself.
import { deleteAccount, isUuid } from "../_lib/accounts.js";
import { isAdminUserId } from "../_lib/adminAuth.js";
import { sendError, sendJson } from "../_lib/http.js";
import { getServiceClient } from "../_lib/supabase.js";

// Avatars are data URLs of up to ~35 KB each, so pages stay small.
const PAGE_SIZE = 30;
const RESETTABLE = { name: "name", avatar: "avatar_url" };

/** Newest players first, one page at a time. No email: not needed to moderate. */
export async function handlePlayersList(res, body) {
  const offset = Math.max(0, Math.floor(Number(body.offset) || 0));
  const { data, error, count } = await getServiceClient()
    .from("muchogames_profiles")
    .select("id, name, avatar_url, wins, losses, created_at", {
      count: "exact"
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, {
    total: count ?? data.length,
    offset,
    players: data.map((row) => ({
      id: row.id,
      name: row.name || "",
      avatarUrl: row.avatar_url || "",
      wins: row.wins,
      losses: row.losses,
      createdAt: row.created_at,
      isAdmin: isAdminUserId(row.id)
    }))
  });
}

export async function handlePlayerReset(res, body) {
  const column = RESETTABLE[body.field];
  if (!isUuid(body.userId) || !column) {
    sendError(res, "invalid-player", "A valid userId and field are required.");
    return;
  }

  const { error } = await getServiceClient()
    .from("muchogames_profiles")
    .update({ [column]: null })
    .eq("id", body.userId);

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, { reset: body.field });
}

/** Refuses admin accounts: deleting one would lock the owner out, since a
 *  new sign-in gets a new user id that ADMIN_USER_IDS does not list. */
export async function handlePlayerDelete(res, body) {
  if (!isUuid(body.userId) || body.confirm !== true) {
    sendError(
      res,
      "invalid-player",
      "A valid userId and confirm: true are required."
    );
    return;
  }

  if (isAdminUserId(body.userId)) {
    sendError(res, "forbidden", "Admin accounts cannot be deleted from here.");
    return;
  }

  const { error } = await deleteAccount(body.userId);
  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, { deleted: true });
}
