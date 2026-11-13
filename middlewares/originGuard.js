const { logWarn } = require("../utils/logger");

// Accepts "https://a.com, b.com" and normalizes each entry to a bare origin
function normalizeOrigin(value) {
    const trimmed = String(value || "").trim().replace(/\/+$/, "");
    if (!trimmed) return null;

    try {
        return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).origin;
    } catch (error) {
        logWarn(`Ignoring invalid origin in configuration: ${value}`);
        return null;
    }
}

// ALLOWED_ORIGINS is the source of truth. Existing single-domain variables are
// added as a fallback so the app keeps working before that variable is set.
function getAllowedOrigins() {
    const configured = String(process.env.ALLOWED_ORIGINS || "").split(",");
    const fallbacks = [
        process.env.CURRENT_DOMAIN,
        process.env.ASFI_MEET_ENDPOINT,
        process.env.MEET
    ];

    const origins = new Set();
    configured.forEach((value) => {
        const origin = normalizeOrigin(value);
        if (origin) origins.add(origin);
    });
    fallbacks.forEach((value) => {
        const origin = normalizeOrigin(value);
        if (origin) origins.add(origin);
    });

    return Array.from(origins);
}

function isSameOriginRequest(req, origin) {
    if (!req.headers.host) return false;

    try {
        return new URL(origin).host === req.headers.host;
    } catch (error) {
        return false;
    }
}

// Rejects any request that carries an Origin header which is neither allowlisted
// nor the origin the request was sent to. Requests without an Origin header
// (server-to-server calls, same-origin GET navigations) are not browser
// cross-origin requests and pass through.
function createOriginGuard(allowedOrigins) {
    const allowed = new Set(allowedOrigins);

    return function originGuard(req, res, next) {
        const origin = req.headers.origin;
        if (!origin) return next();

        const normalized = normalizeOrigin(origin);

        if (normalized && (allowed.has(normalized) || isSameOriginRequest(req, normalized))) {
            return next();
        }

        logWarn(`Blocked request from disallowed origin ${origin} (${req.method} ${req.originalUrl})`);

        if (req.method === "OPTIONS") {
            return res.status(403).end();
        }

        if ((req.headers.accept || "").includes("text/html")) {
            return res
                .status(403)
                .type("html")
                .send("<!DOCTYPE html><html><head><title>Origin not allowed</title></head><body style=\"font-family:sans-serif;text-align:center;padding:3rem\"><h1>403 - Origin not allowed</h1><p>This origin is not permitted to use this service.</p></body></html>");
        }

        return res.status(403).json({ error: "Origin not allowed" });
    };
}

module.exports = {
    getAllowedOrigins,
    createOriginGuard,
    normalizeOrigin
};
