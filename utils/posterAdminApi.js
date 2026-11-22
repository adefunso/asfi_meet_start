// Server-to-server helpers for the poster app's admin API.
// The poster app only serves these endpoints to callers holding the shared
// POSTERS_ADMIN_API_KEY, so the key never reaches the browser.
const dns = require("dns");
const TIMEOUT_MS = Number(process.env.POSTERS_TIMEOUT_MS) || 10000;

// Some hosts advertise AAAA records without a working IPv6 route, which makes
// Node's fetch fail with a bare "fetch failed" while curl succeeds by falling
// back to IPv4. Prefer IPv4 so those lookups connect.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (error) {
  // Older Node builds without this API keep their default order
}

function postersBaseUrl() {
  return String(process.env.POSTERS || "https://posters.asfischolar.com").replace(/\/+$/, "");
}

function requireApiKey() {
  const apiKey = String(process.env.POSTERS_ADMIN_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("POSTERS_ADMIN_API_KEY is not set, cannot call the poster admin API");
  }

  return apiKey;
}

// Keeps the reason a request failed, e.g. ENOTFOUND / ECONNREFUSED / CERT_HAS_EXPIRED,
// because Node reports every one of those as a plain "fetch failed".
function describeNetworkError(error, url) {
  const cause = error && error.cause;
  const reason = cause ? cause.code || cause.message : error && error.message;
  return `${error && error.message ? error.message : "Request failed"} (${reason || "unknown cause"}) calling ${url.origin}${url.pathname} - check the POSTERS base URL and that the poster service is reachable`;
}

async function requestOnce(url, apiKey, options) {
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs) || TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: options.method || "GET",
      signal: controller.signal,
      headers: Object.assign(
        { "x-posters-admin-key": apiKey },
        options.body ? { "content-type": "application/json" } : {}
      ),
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch (error) {
    error.isNetworkError = true;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// GET/POST JSON from the poster app. Throws on transport errors, timeouts,
// non-2xx responses and non-JSON bodies; callers turn that into a page message.
async function callPosterApi(pathname, options = {}) {
  const apiKey = requireApiKey();
  const query = options.query || {};
  const url = new URL(`${postersBaseUrl()}${pathname}`);

  Object.keys(query).forEach((key) => {
    const value = query[key];
    if (value !== undefined && value !== null && String(value) !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  try {
    let response;

    try {
      response = await requestOnce(url, apiKey, options);
    } catch (error) {
      // One retry covers a transient DNS/socket blip before we report failure.
      // Callers with a non-idempotent request (e.g. creating a poster) opt out.
      if (error.name === "AbortError" || options.retry === false) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250));
      response = await requestOnce(url, apiKey, options);
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      // Usually an HTML error/404 page: the poster app on this URL has not been
      // deployed with the admin endpoints yet, or POSTERS points at another app
      throw new Error(
        `${url.origin}${url.pathname} returned ${contentType || "an unknown content type"} (status ${response.status}) instead of JSON - check that the poster app at POSTERS has the admin endpoints deployed`
      );
    }

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload && payload.error ? payload.error : `Poster admin API responded with status ${response.status}`);
    }

    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Poster admin API timed out after ${Number(options.timeoutMs) || TIMEOUT_MS}ms calling ${url.origin}${url.pathname}`);
    }
    if (error.isNetworkError || error.name === "TypeError") {
      throw new Error(describeNetworkError(error, url));
    }
    throw error;
  }
}

module.exports = {
  postersBaseUrl,
  callPosterApi,
  TIMEOUT_MS
};
