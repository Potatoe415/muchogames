import { getServiceClient } from "./supabase.js";

// Shape of muchogames_hub_settings.settings (supabase/migrations/0006).
const GAME_ID_RE = /^[a-z0-9-]{1,64}$/;
const MAX_IDS = 64;
const MAX_ANNOUNCEMENT_LENGTH = 280;
const LANGS = ["fr", "en", "es"];

function sanitizeIds(value) {
  if (!Array.isArray(value)) return [];
  const ids = value.filter(
    (id) => typeof id === "string" && GAME_ID_RE.test(id)
  );
  return [...new Set(ids)].slice(0, MAX_IDS);
}

function sanitizeAnnouncement(value) {
  const source = value && typeof value === "object" ? value : {};
  const announcement = { active: source.active === true };
  LANGS.forEach((lang) => {
    const text = typeof source[lang] === "string" ? source[lang].trim() : "";
    announcement[lang] = text.slice(0, MAX_ANNOUNCEMENT_LENGTH);
  });
  return announcement;
}

/** Drops anything unexpected, so neither a bad row nor a bad admin payload
 *  can push arbitrary JSON to every hub visitor. */
export function sanitizeHubSettings(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    hidden: sanitizeIds(source.hidden),
    pinned: sanitizeIds(source.pinned),
    new: sanitizeIds(source.new),
    announcement: sanitizeAnnouncement(source.announcement)
  };
}

/** `{ settings, updatedAt }`, or `{ error }` (including a missing table). */
export async function readHubSettings() {
  const { data, error } = await getServiceClient()
    .from("muchogames_hub_settings")
    .select("settings, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) return { error };
  if (!data) return { error: { message: "hub settings row missing" } };
  return {
    settings: sanitizeHubSettings(data.settings),
    updatedAt: data.updated_at
  };
}

export async function writeHubSettings(value) {
  const settings = sanitizeHubSettings(value);
  const { data, error } = await getServiceClient()
    .from("muchogames_hub_settings")
    .upsert({ id: 1, settings, updated_at: new Date().toISOString() })
    .select("settings, updated_at")
    .single();

  if (error) return { error };
  return {
    settings: sanitizeHubSettings(data.settings),
    updatedAt: data.updated_at
  };
}
