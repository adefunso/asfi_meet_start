// GET /manageposters/bulk - bulk poster upload form.
// Admins select a meeting and several PDFs named
// "<Poster title>_<presenter@email.com>.pdf"; the submit handler checks or
// creates an ASFIScholar account for each presenter and creates the posters.
const { config } = require("dotenv");
config();

const isAdmin = require("./utils/isAdmin");
const { logError } = require("../utils/logger");
const { db } = require("../routes/db.config");

// Multer keeps every file in memory for the request, so the batch ceiling is
// the product of these two limits (6 x 10 MB = 60 MB). Raising either number
// raises the memory one upload can take from the server.
const MAX_FILES = 6;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function listChannels() {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT channel, title FROM channels WHERE channel IS NOT NULL AND channel <> '' ORDER BY id DESC",
      (error, rows) => (error ? reject(error) : resolve(rows || []))
    );
  });
}

async function renderBulkPosterUpload(req, res, extra = {}) {
  if (!req.cookies.posterUser || !req.user) {
    return res.render("signin", {
      meetingId: "",
      turnstile_site_key: process.env.TURNSTILE_SITE_KEY || ""
    });
  }

  const roleAdmin = await isAdmin(req.user.email, req.user.username);
  if (!roleAdmin) {
    return res.render("userDashboard");
  }

  let meetings = [];
  let loadError = null;

  try {
    const rows = await listChannels();
    meetings = rows.map((row) => ({
      meeting: row.channel,
      name: row.title || row.channel
    }));
  } catch (error) {
    loadError = "Could not load the list of meetings, so there is nothing to choose from yet. Refresh the page to try again.";
    logError("Could not load meetings for the bulk poster upload page", error);
  }

  const results = extra.results || [];
  const summary = extra.summary || null;

  return res.render("bulkPosterUpload", {
    meetings,
    selectedMeeting: extra.selectedMeeting || String(req.query.meeting || "").trim(),
    results,
    summary,
    error: extra.error || req.uploadError || null,
    loadError,
    maxFiles: MAX_FILES,
    maxFileMb: Math.round(MAX_FILE_BYTES / (1024 * 1024))
  });
}

const bulkPosterUploadPage = async (req, res) => {
  try {
    return await renderBulkPosterUpload(req, res);
  } catch (error) {
    logError(`Could not render the bulk poster upload page for ${req.originalUrl}`, error);
    return res.status(503).render("404", {
      message: "We could not load the bulk poster upload page right now. Please try again."
    });
  }
};

module.exports = bulkPosterUploadPage;
module.exports.renderBulkPosterUpload = renderBulkPosterUpload;
module.exports.MAX_FILES = MAX_FILES;
module.exports.MAX_FILE_BYTES = MAX_FILE_BYTES;
