// Catalog + announcement actions for api/admin/index.js. Not a route itself.
import { readHubSettings, writeHubSettings } from "../_lib/hubSettings.js";
import { sendError, sendJson } from "../_lib/http.js";

export async function handleHubSettingsGet(res) {
  const { settings, updatedAt, error } = await readHubSettings();
  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }
  sendJson(res, 200, { settings, updatedAt });
}

export async function handleHubSettingsUpdate(res, body) {
  if (!body.settings || typeof body.settings !== "object") {
    sendError(res, "invalid-settings", "settings (object) is required.");
    return;
  }

  const { settings, updatedAt, error } = await writeHubSettings(body.settings);
  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }
  sendJson(res, 200, { settings, updatedAt });
}
