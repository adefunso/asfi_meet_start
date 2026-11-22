// POST /manageposters/bulk - handle a batch of poster PDFs.
// File names follow "<Poster title>_<presenter email>.pdf": everything before
// the last underscore is the title, everything after it is the presenter's
// email. For each PDF we make sure the presenter has an ASFIScholar account
// (created with a temporary password and an emailed setup link when missing)
// and then create the poster in the poster app.
const multer = require("multer");
const isAdmin = require("./utils/isAdmin");
const { logError } = require("../utils/logger");
const { callPosterApi } = require("../utils/posterAdminApi");
const { ensurePosterAccount } = require("../utils/scholarAccounts");
const { renderBulkPosterUpload, MAX_FILES, MAX_FILE_BYTES } = require("./bulkPosterUploadPage");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTER_TIMEOUT_MS = Number(process.env.POSTERS_UPLOAD_TIMEOUT_MS) || 120000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: MAX_FILES, fileSize: MAX_FILE_BYTES }
});

// Busboy decodes file names as latin1; recover the UTF-8 title when needed.
function decodeFileName(name) {
  const original = String(name || "");
  const decoded = Buffer.from(original, "latin1").toString("utf8");

  // Prefer the decoded value only when it round-trips cleanly
  return decoded.includes("\uFFFD") ? original : decoded;
}

// "Climate Change, Pollination Dynamics and Food Production_ibukun.adedeji@gmail.com.pdf"
// -> { title: "Climate Change, Pollination Dynamics and Food Production",
//      email: "ibukun.adedeji@gmail.com" }
function parsePosterFileName(rawName) {
  const fileName = String(rawName || "").trim();

  if (!/\.pdf$/i.test(fileName)) {
    return { fileName, error: "Only PDF files can be uploaded." };
  }

  const base = fileName.replace(/\.pdf$/i, "");
  const separator = base.lastIndexOf("_");

  if (separator <= 0) {
    return {
      fileName,
      error: "Use the naming format \"Poster title_email@example.com.pdf\"."
    };
  }

  const title = base.slice(0, separator).replace(/_/g, " ").trim();
  const email = base.slice(separator + 1).trim().toLowerCase();

  if (!title) {
    return { fileName, title, email, error: "The poster title is missing before the underscore." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { fileName, title, email, error: "The presenter email after the last underscore is not valid." };
  }
  if (title.length > 255) {
    return { fileName, title, email, error: "The poster title is longer than 255 characters." };
  }

  return { fileName, title, email };
}

// The page lets the admin type the title/email for a file whose name cannot
// carry them, and those values win over whatever the file name says.
function applyManualValues(parsed, manual) {
  if (!manual || typeof manual !== "object") return parsed;

  // Each field falls back to the file name, so typing only the email keeps the
  // title the file name already carried.
  const title = String(manual.title || "").trim() || String(parsed.title || "").trim();
  const email = String(manual.email || "").trim().toLowerCase() || String(parsed.email || "").trim().toLowerCase();

  if (title === String(parsed.title || "").trim() && email === String(parsed.email || "").trim().toLowerCase()) {
    return parsed;
  }
  if (!title) {
    return { fileName: parsed.fileName, title, email, error: "The poster title is missing." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { fileName: parsed.fileName, title, email, error: "The presenter email is not valid." };
  }
  if (title.length > 255) {
    return { fileName: parsed.fileName, title, email, error: "The poster title is longer than 255 characters." };
  }

  return { fileName: parsed.fileName, title, email };
}

// The page posts { title, email } per file, in the order the files were sent
function readOverrides(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function presenterNameFromEmail(email) {
  return String(email || "")
    .split("@")[0]
    .replace(/[._+-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Multer errors (too many files, too large) are shown on the page, not thrown
function receivePosterFiles(req, res, next) {
  upload.array("posters", MAX_FILES)(req, res, (error) => {
    if (!error) return next();

    if (error.code === "LIMIT_FILE_SIZE") {
      req.uploadError = `Each PDF must be smaller than ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB.`;
    } else if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
      req.uploadError = `Select at most ${MAX_FILES} PDFs per upload.`;
    } else if (error.code === "LIMIT_PART_COUNT" || error.code === "LIMIT_FIELD_COUNT") {
      req.uploadError = "That upload is too large. Split it into smaller batches.";
    } else {
      req.uploadError = "The files could not be read. Please try again.";
    }

    return next();
  });
}

async function processPoster(file, meeting, manual) {
  const fileName = decodeFileName(file.originalname);
  const fromName = parsePosterFileName(fileName);
  // A non-PDF stays rejected even when the admin typed a title and email
  const parsed = /\.pdf$/i.test(fileName) ? applyManualValues(fromName, manual) : fromName;

  if (parsed.error) {
    return { ok: false, ...parsed, message: parsed.error };
  }

  try {
    const account = await ensurePosterAccount(parsed.email);

    const poster = await callPosterApi("/admin/posters/bulk-upload", {
      method: "POST",
      timeoutMs: POSTER_TIMEOUT_MS,
      // Never resend a whole PDF: a retry could create the poster twice
      retry: false,
      body: {
        meeting,
        title: parsed.title,
        email: parsed.email,
        presenterName: presenterNameFromEmail(parsed.email),
        fileName: file.originalname,
        pdfBase64: file.buffer.toString("base64")
      }
    });

    const accountCreated = Boolean(account.created);
    // Only treat it as a failure when the account service says so: an older
    // service that does not report emailSent must not be called a failure.
    const emailFailed = accountCreated && account.emailSent === false;

    let message;
    if (emailFailed) {
      message = "Poster created and the ASFIScholar account was created, but the welcome email could not be sent. Forward the setup link below to the presenter so they can set a password.";
      logError(`The welcome email could not be sent to ${parsed.email}`, new Error("Account created, email delivery failed"));
    } else if (accountCreated) {
      message = "Poster created and the ASFIScholar account was created. The welcome email was sent to the presenter.";
    } else {
      message = "Poster created. The presenter already had an ASFIScholar account.";
    }

    return {
      ok: true,
      fileName: parsed.fileName,
      title: parsed.title,
      email: parsed.email,
      accountCreated,
      accountExisted: Boolean(account.exists),
      emailFailed,
      setupUrl: emailFailed ? String(account.setupUrl || "") : "",
      posterId: poster.poster_id || "",
      deckId: poster.deck_id || "",
      message
    };
  } catch (error) {
    logError(`Could not create the poster from ${file.originalname}`, error);
    return {
      ok: false,
      fileName: parsed.fileName,
      title: parsed.title,
      email: parsed.email,
      message: error.message || "The poster could not be created."
    };
  }
}

const bulkPosterUploadAction = async (req, res) => {
  try {
    if (!req.cookies.posterUser || !req.user) {
      return res.status(403).render("404", { message: "You do not have access to this action." });
    }

    const roleAdmin = await isAdmin(req.user.email, req.user.username);
    if (!roleAdmin) {
      return res.status(403).render("404", { message: "You do not have access to this action." });
    }

    if (req.uploadError) {
      return renderBulkPosterUpload(req, res, { error: req.uploadError });
    }

    const meeting = String(req.body.meeting || "").trim();
    const files = Array.isArray(req.files) ? req.files : [];

    if (!meeting) {
      return renderBulkPosterUpload(req, res, { error: "Choose the meeting these posters belong to." });
    }
    if (files.length === 0) {
      return renderBulkPosterUpload(req, res, { error: "Select at least one PDF to upload.", selectedMeeting: meeting });
    }

    const results = [];
    const overrides = readOverrides(req.body.overrides);

    // Sequential on purpose: each PDF also creates an account and an email
    for (let index = 0; index < files.length; index += 1) {
      results.push(await processPoster(files[index], meeting, overrides[index]));
    }

    const created = results.filter((result) => result.ok).length;
    const accounts = results.filter((result) => result.accountCreated).length;
    const emailsFailed = results.filter((result) => result.emailFailed).length;

    return renderBulkPosterUpload(req, res, {
      selectedMeeting: meeting,
      results,
      summary: {
        total: results.length,
        created,
        failed: results.length - created,
        accounts,
        emailsFailed
      }
    });
  } catch (error) {
    logError(`Could not process the bulk poster upload for ${req.originalUrl}`, error);
    return renderBulkPosterUpload(req, res, {
      error: "Something went wrong while uploading the posters. Please try again."
    });
  }
};

module.exports = {
  bulkPosterUploadAction,
  receivePosterFiles,
  parsePosterFileName,
  applyManualValues,
  presenterNameFromEmail,
  decodeFileName
};
