import { sendError, sendJson, withErrorHandling } from "./_lib/http.js";
import { readPopularRanking } from "./_lib/popular.js";
import { clientKey, isRateLimited } from "./_lib/rateLimit.js";

// Public, read-only. Counts of matches started per game (last 182 days).
// No player id, device id, or timestamp leaves the server.
// `Cache-Control` stays `no-store` (vercel.json, all of /api); the CDN
// header below is what actually caches the response.
async function handler(req, res) {
  if (req.method !== "GET") {
    sendError(res, "method-not-allowed", "Use GET for /api/popular.");
    return;
  }

  if (
    isRateLimited(`popular:${clientKey(req)}`, {
      maxHits: 60,
      windowMs: 60_000
    })
  ) {
    sendError(res, "too-many-requests", "Too many requests. Try again later.");
    return;
  }

  res.setHeader(
    "Vercel-CDN-Cache-Control",
    "max-age=300, stale-while-revalidate=600"
  );
  sendJson(res, 200, { ranking: await readPopularRanking() });
}

export default withErrorHandling(handler);
