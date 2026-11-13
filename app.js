require("dotenv").config();

const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require("express");
const cors = require('cors');
const cookie = require("cookie-parser");
const bodyParser = require("body-parser");

const { logError, logWarn, logInfo, installConsoleErrorCapture } = require("./utils/logger");
const { getAllowedOrigins, createOriginGuard } = require("./middlewares/originGuard");
const { globalLimiter } = require("./middlewares/rateLimit");

// Everything already logged with console.error also lands in error.log
installConsoleErrorCapture();

const app = express();
// Behind the reverse proxy, so req.ip / req.protocol reflect the real client
app.set("trust proxy", true);

const PORT = process.env.PORT || 2020;
const server = require("http").Server(app);

const allowedOrigins = getAllowedOrigins();
if (allowedOrigins.length === 0) {
  logWarn("ALLOWED_ORIGINS is not set - only same-origin requests will be accepted. Add ALLOWED_ORIGINS to .env (comma separated).");
} else {
  logInfo(`Allowed origins: ${allowedOrigins.join(", ")}`);
}

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, allowedOrigins.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 600,
  optionsSuccessStatus: 204
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cookie());
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", ["./views", "./views/meetings"]);

app.locals.turnstile_site_key = process.env.TURNSTILE_SITE_KEY || "";

// Static assets are mounted before the origin guard so they keep serving
app.use("/assets", express.static(__dirname + '/public/assets', { type: 'files' }))
app.use("/css", express.static(__dirname + "/public/css", { type: 'text/css' }))
app.use("/js", express.static(__dirname + "/public/js", { type: 'text/javascript' }))
app.use("/recordings", express.static("recordings"));

// Only allowlisted origins may use the routes below, then apply a global rate limit
app.use(createOriginGuard(allowedOrigins));
app.use(globalLimiter);

app.use(
  '/jitsi',
  createProxyMiddleware({
    target: 'https://call.asfischolar.net',
    changeOrigin: true,
    secure: false,
    ws: true,  // Enable WebSocket proxying
    pathRewrite: {
      '^/jitsi': '',  // Remove "/jitsi" from the proxied request
    },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('Origin', 'https://call.asfischolar.net');
    }
  })
);

app.use("/", require("./routes/pages"));

// Fallback for anything the routers did not answer
app.use((req, res) => {
  if ((req.headers.accept || "").includes("text/html")) {
    return res.status(404).render("404", { message: "Page Not Found" });
  }
  return res.status(404).json({ error: "Not Found" });
});

// Single place where request errors are logged and answered gracefully instead
// of dumping a stack trace to the client or crashing the process
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    logError(`${req.method} ${req.originalUrl} failed with status ${status}`, err);
  } else {
    logWarn(`${req.method} ${req.originalUrl} rejected with status ${status}: ${err.message}`);
  }

  if (res.headersSent) {
    return next(err);
  }

  const message = status === 400 ? "Bad request" : "Something went wrong";

  if ((req.headers.accept || "").includes("text/html")) {
    return res
      .status(status)
      .type("html")
      .send(`<!DOCTYPE html><html><head><title>${message}</title></head><body style="font-family:sans-serif;text-align:center;padding:3rem"><h1>${status}</h1><p>${message}</p></body></html>`);
  }

  return res.status(status).json({ error: message });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// A rejected promise used to bring the whole server down. Log it and keep serving.
process.on("unhandledRejection", (reason) => {
  logError("Unhandled promise rejection", reason);
});

// Last resort: log it, stop accepting connections, then let the process
// manager restart a clean instance.
process.on("uncaughtException", (error) => {
  logError("Uncaught exception - shutting down", error);

  const forcedExit = setTimeout(() => process.exit(1), 5000);
  if (forcedExit.unref) forcedExit.unref();

  server.close(() => process.exit(1));
});
