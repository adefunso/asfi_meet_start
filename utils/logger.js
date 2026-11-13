const fs = require("fs");
const path = require("path");

const LOG_FILE = process.env.ERROR_LOG_FILE || path.join(__dirname, "..", "error.log");
const MAX_LOG_BYTES = Number(process.env.ERROR_LOG_MAX_BYTES) || 5 * 1024 * 1024;

let lastRotationCheck = 0;
let consoleCaptureInstalled = false;

function formatError(error) {
    if (error === undefined || error === null) return "";
    if (error instanceof Error) return error.stack || `${error.name}: ${error.message}`;
    if (typeof error === "object") {
        try {
            return JSON.stringify(error);
        } catch (stringifyError) {
            return String(error);
        }
    }
    return String(error);
}

// Keeps a single previous file so the log cannot grow without bound
function rotateIfNeeded() {
    const now = Date.now();
    if (now - lastRotationCheck < 60 * 1000) return;
    lastRotationCheck = now;

    try {
        const stats = fs.statSync(LOG_FILE);
        if (stats.size > MAX_LOG_BYTES) {
            fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
        }
    } catch (error) {
        // Missing file on first write is expected
    }
}

function append(level, message, error) {
    rotateIfNeeded();

    const line = `[${new Date().toISOString()}] ${level} ${message}${error ? `\n${formatError(error)}` : ""}\n`;

    try {
        fs.appendFileSync(LOG_FILE, line);
    } catch (writeError) {
        process.stderr.write(`[logger] could not write to ${LOG_FILE}: ${writeError.message}\n`);
    }

    // Write straight to stderr (not console.error) so the console capture below
    // can never recurse into this function.
    process.stderr.write(line);
    return line;
}

function logError(message, error) {
    return append("ERROR", message, error);
}

function logWarn(message, error) {
    return append("WARN", message, error);
}

function logInfo(message) {
    const line = `[${new Date().toISOString()}] INFO ${message}\n`;
    process.stdout.write(line);
    return line;
}

// Existing controllers log with console.error; nothing must be lost from
// error.log, so route those calls through the file logger as well.
function installConsoleErrorCapture() {
    if (consoleCaptureInstalled) return;
    consoleCaptureInstalled = true;

    const originalError = console.error.bind(console);

    console.error = (...args) => {
        const [first, ...rest] = args;
        const message = typeof first === "string" ? first : formatError(first);
        const detail = rest.length > 0 ? rest.map((item) => formatError(item)).join(" ") : undefined;
        append("ERROR", message, detail);

        if (process.env.LOG_TO_CONSOLE === "true") {
            originalError(...args);
        }
    };
}

module.exports = {
    LOG_FILE,
    logError,
    logWarn,
    logInfo,
    installConsoleErrorCapture
};
