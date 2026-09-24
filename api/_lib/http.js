const ERROR_STATUS = {
  "invalid-code": 400,
  "missing-code": 400,
  "game-not-found": 404,
  "game-expired": 410,
  "game-in-progress": 409,
  "resume-denied": 403,
  "code-exhausted": 503,
  "method-not-allowed": 405,
  "invalid-event": 400,
  "invalid-state": 400,
  "invalid-profile": 400,
  unauthorized: 401,
  "too-many-requests": 429,
  "server-error": 500
};

const GENERIC_SERVER_MESSAGE = "Unexpected server error. Please try again.";

export function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

/**
 * 4xx messages are meant for the user and are sent as-is. 5xx detail is usually
 * a raw Supabase/Postgres message, so it goes to the logs instead of the
 * browser. No correlation id is added: Vercel already tags every log line with
 * the invocation, path and request id.
 */
export function sendError(res, code, message) {
  const status = ERROR_STATUS[code] || 500;

  if (status >= 500) {
    console.error(JSON.stringify({ level: "error", code, detail: message }));
    res
      .status(status)
      .json({ error: { code, message: GENERIC_SERVER_MESSAGE } });
    return;
  }

  res.status(status).json({ error: { code, message } });
}

/**
 * Last-resort guard around a handler. Without it, any throw becomes an opaque
 * Vercel FUNCTION_INVOCATION_FAILED with nothing logged on our side.
 */
export function withErrorHandling(handler) {
  return async function guardedHandler(req, res) {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          code: "unhandled",
          method: req.method,
          detail: error?.message || String(error),
          stack: error?.stack
        })
      );

      if (!res.headersSent) {
        res.status(500).json({
          error: { code: "server-error", message: GENERIC_SERVER_MESSAGE }
        });
      }
    }
  };
}

export async function readJsonBody(req) {
  let body;

  try {
    // On Vercel's Node runtime `req.body` is a getter that parses eagerly and
    // throws on malformed JSON, so the access itself has to be guarded.
    body = req.body;
  } catch {
    return {};
  }

  if (body && typeof body === "object") {
    return body;
  }

  if (typeof body === "string" && body.length > 0) {
    try {
      return JSON.parse(body);
    } catch {
      // Treat an unparseable body as empty: each handler already validates what
      // it needs and answers 400, which beats a 500 on malformed input.
      return {};
    }
  }

  return {};
}
