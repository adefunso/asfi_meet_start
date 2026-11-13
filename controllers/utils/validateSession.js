const AUTH_TIMEOUT_MS = Number(process.env.AUTH_TIMEOUT_MS) || 8000;

// Validates a scholar session against the ASFIScholar API.
// Never hangs forever and never assumes the response is JSON: the endpoint
// returning an HTML error page used to throw "Unexpected token < in JSON".
async function validateSession(token) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    try {
        const response = await fetch(`${process.env.ASFISCHOLAR_ENDPOINT}/external/api/validateLogin`, {
            method: "POST",
            body: JSON.stringify({ token }),
            headers: {
                "Content-type": "application/json"
            },
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Login validation failed with status ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            throw new Error(`Login validation returned ${contentType || "an unknown content type"} instead of JSON`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(`Login validation timed out after ${AUTH_TIMEOUT_MS}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = validateSession;
