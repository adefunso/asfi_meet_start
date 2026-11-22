// Server-to-server helper for the ASFIScholar account API.
// A poster upload may create an account for a presenter, so this call carries
// the shared POSTERS_ADMIN_API_KEY. The key never reaches the browser.
const dns = require("dns");
const TIMEOUT_MS = Number(process.env.ASFISCHOLAR_TIMEOUT_MS) || 20000;

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (error) {
  // Older Node builds without this API keep their default order
}

function scholarBaseUrl() {
  const raw = String(process.env.ASFISCHOLAR_ENDPOINT || "").trim().replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(raw)) {
    throw new Error("ASFISCHOLAR_ENDPOINT is not set to a valid URL");
  }

  return raw;
}

function requireApiKey() {
  const apiKey = String(process.env.POSTERS_ADMIN_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("POSTERS_ADMIN_API_KEY is not set, cannot create presenter accounts");
  }

  return apiKey;
}

function describeError(error, url) {
  const cause = error && error.cause;
  const reason = cause ? cause.code || cause.message : error && error.message;
  return `${error && error.message ? error.message : "Request failed"} (${reason || "unknown cause"}) calling ${url.origin}${url.pathname}`;
}

// Checks whether the presenter already has an ASFIScholar account and creates
// one when they do not. Resolves to the account summary the dashboard shows.
async function ensurePosterAccount(email) {
  const apiKey = requireApiKey();
  const url = new URL(`${scholarBaseUrl()}/external/api/poster-accounts/ensure`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-posters-admin-key": apiKey
      },
      body: JSON.stringify({ email })
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      throw new Error(
        (payload && payload.error) || `ASFIScholar account API responded with status ${response.status}`
      );
    }
    if (!payload) {
      throw new Error("ASFIScholar account API did not return JSON - check ASFISCHOLAR_ENDPOINT");
    }

    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`ASFIScholar account API timed out after ${TIMEOUT_MS}ms`);
    }
    if (error.isNetworkError || error.name === "TypeError") {
      throw new Error(describeError(error, url));
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  ensurePosterAccount,
  scholarBaseUrl,
  TIMEOUT_MS
};
