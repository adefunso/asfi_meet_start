const { logWarn } = require("../utils/logger");

function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
        return forwarded.split(",")[0].trim();
    }
    return req.ip || (req.socket && req.socket.remoteAddress) || "unknown";
}

// One sweep timer for every limiter this process creates
const stores = [];
const sweeper = setInterval(() => {
    const now = Date.now();
    stores.forEach((hits) => {
        for (const [key, entry] of hits) {
            if (entry.resetAt <= now) hits.delete(key);
        }
    });
}, 60 * 1000);
if (sweeper.unref) sweeper.unref();

function tooManyRequestsHtml(retryAfter) {
    return `<!DOCTYPE html><html><head><title>Too many requests</title></head><body style="font-family:sans-serif;text-align:center;padding:3rem"><h1>429 - Too many requests</h1><p>Please try again in ${retryAfter} second(s).</p></body></html>`;
}

// Fixed-window limiter keyed by client IP and limiter name
function createRateLimiter({ name = "default", windowMs = 60 * 1000, max = 120 } = {}) {
    const hits = new Map();
    stores.push(hits);

    return function rateLimiter(req, res, next) {
        const now = Date.now();
        const key = `${name}:${getClientIp(req)}`;

        let entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }

        entry.count += 1;

        res.setHeader("X-RateLimit-Limit", String(max));
        res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
        res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

        if (entry.count <= max) {
            return next();
        }

        const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
        res.setHeader("Retry-After", String(retryAfter));

        if (entry.count === max + 1) {
            logWarn(`Rate limit "${name}" exceeded for ${getClientIp(req)} on ${req.method} ${req.originalUrl}`);
        }

        if ((req.headers.accept || "").includes("text/html")) {
            return res.status(429).type("html").send(tooManyRequestsHtml(retryAfter));
        }

        return res.status(429).json({ error: "Too many requests", retryAfter });
    };
}

module.exports = {
    createRateLimiter,
    getClientIp,
    globalLimiter: createRateLimiter({ name: "global", windowMs: 60 * 1000, max: 300 }),
    authLimiter: createRateLimiter({ name: "auth", windowMs: 10 * 60 * 1000, max: 20 }),
    writeLimiter: createRateLimiter({ name: "write", windowMs: 60 * 1000, max: 60 }),
    uploadLimiter: createRateLimiter({ name: "upload", windowMs: 60 * 1000, max: 10 })
};
