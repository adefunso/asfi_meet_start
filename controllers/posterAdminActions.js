// Admin actions from the poster dashboard: delete a poster, move a poster to
// another meeting, and manage poster ids. Each one calls the poster app with the
// shared secret and then redirects back to the page that submitted the form.
const isAdmin = require("./utils/isAdmin")
const { logError } = require("../utils/logger")
const { callPosterApi } = require("../utils/posterAdminApi")

// Only ever redirect back inside this app, and only to an admin page
function safeReturnTo(value, fallback) {
  const target = String(value || "")

  if (target.startsWith(fallback) && !target.includes("//") && !target.includes("\\")) {
    return target
  }

  return fallback
}

function withNotice(path, message, kind) {
  const separator = path.includes("?") ? "&" : "?"
  return `${path}${separator}notice=${encodeURIComponent(message)}&kind=${kind || "success"}`
}

async function guard(req) {
  if (!req.cookies.posterUser || !req.user) return false

  try {
    return Boolean(await isAdmin(req.user.email, req.user.username))
  } catch (error) {
    logError("Could not verify the admin role for a poster action", error)
    return false
  }
}

// POST /manageposters/delete
const deletePosterAction = async (req, res) => {
  const returnTo = safeReturnTo(req.body.return_to, "/manageposters")

  try {
    if (!(await guard(req))) {
      return res.status(403).render("404", { message: "You do not have access to this action." })
    }

    const posterId = String(req.body.poster_id || "").trim()

    if (!posterId) {
      return res.redirect(withNotice(returnTo, "No poster was selected.", "error"))
    }

    const result = await callPosterApi("/admin/posters/delete", {
      method: "POST",
      body: { poster_id: posterId }
    })

    return res.redirect(withNotice(returnTo, `Poster ${posterId} deleted${result.ratings ? ` with ${result.ratings} rating(s) and ${result.reactions} reaction(s)` : ""}.`))
  } catch (error) {
    logError(`Could not delete poster from ${req.originalUrl}`, error)
    return res.redirect(withNotice(returnTo, error.message || "Could not delete the poster.", "error"))
  }
}

// POST /manageposters/assign-meeting
const assignPosterMeetingAction = async (req, res) => {
  const returnTo = safeReturnTo(req.body.return_to, "/manageposters")

  try {
    if (!(await guard(req))) {
      return res.status(403).render("404", { message: "You do not have access to this action." })
    }

    const posterId = String(req.body.poster_id || "").trim()
    const meeting = String(req.body.meeting || "").trim()

    if (!posterId) {
      return res.redirect(withNotice(returnTo, "No poster was selected.", "error"))
    }
    if (!meeting) {
      return res.redirect(withNotice(returnTo, "Choose the meeting to move the poster to.", "error"))
    }

    await callPosterApi("/admin/posters/assign-meeting", {
      method: "POST",
      body: { poster_id: posterId, meeting }
    })

    return res.redirect(withNotice(returnTo, `Poster ${posterId} moved to ${meeting}.`))
  } catch (error) {
    logError(`Could not move poster to another meeting from ${req.originalUrl}`, error)
    return res.redirect(withNotice(returnTo, error.message || "Could not move the poster.", "error"))
  }
}

// POST /manageposterids/create
const createPosterIdsAction = async (req, res) => {
  const returnTo = safeReturnTo(req.body.return_to, "/manageposterids")

  try {
    if (!(await guard(req))) {
      return res.status(403).render("404", { message: "You do not have access to this action." })
    }

    const customIds = String(req.body.ids || "").trim()
    const body = customIds ? { ids: customIds } : { count: req.body.count }

    const result = await callPosterApi("/admin/posterids/create", { method: "POST", body })

    const created = Number(result.generated) || 0
    const duplicates = Number(result.duplicates) || 0
    const heldBack = result.posterIDs && result.posterIDs.length > 0 ? ` Latest: ${result.posterIDs[result.posterIDs.length - 1]}.` : ""

    return res.redirect(withNotice(
      returnTo,
      `Created ${created} poster id(s)${duplicates ? `, ${duplicates} already existed` : ""}.${heldBack}`
    ))
  } catch (error) {
    logError(`Could not create poster ids from ${req.originalUrl}`, error)
    return res.redirect(withNotice(returnTo, error.message || "Could not create poster ids.", "error"))
  }
}

// POST /manageposterids/import  (multipart CSV, first column, header row ignored)
const importPosterIdsAction = async (req, res) => {
  const returnTo = safeReturnTo(req.body.return_to, "/manageposterids")
  const MAX_CSV_BYTES = 2 * 1024 * 1024

  try {
    if (!(await guard(req))) {
      return res.status(403).render("404", { message: "You do not have access to this action." })
    }

    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return res.redirect(withNotice(returnTo, "Select a CSV file to import.", "error"))
    }
    if (req.file.size > MAX_CSV_BYTES) {
      return res.redirect(withNotice(returnTo, "That CSV file is too large. Split it into files under 2 MB.", "error"))
    }

    const csv = req.file.buffer.toString("utf8")

    if (!csv.trim()) {
      return res.redirect(withNotice(returnTo, "That CSV file is empty.", "error"))
    }

    const result = await callPosterApi("/admin/posterids/create", {
      method: "POST",
      body: { csv }
    })

    const imported = Number(result.generated) || 0
    const duplicates = Number(result.duplicates) || 0

    return res.redirect(withNotice(
      returnTo,
      `Imported ${imported} poster id(s)${duplicates ? `, ${duplicates} already existed` : ""}.`
    ))
  } catch (error) {
    logError(`Could not import poster ids from ${req.originalUrl}`, error)
    return res.redirect(withNotice(returnTo, error.message || "Could not import poster ids.", "error"))
  }
}

// POST /manageposterids/delete
const deletePosterIdsAction = async (req, res) => {
  const returnTo = safeReturnTo(req.body.return_to, "/manageposterids")

  try {
    if (!(await guard(req))) {
      return res.status(403).render("404", { message: "You do not have access to this action." })
    }

    const ids = String(req.body.poster_deck_id || "").trim()

    if (!ids) {
      return res.redirect(withNotice(returnTo, "No poster id was selected.", "error"))
    }

    const result = await callPosterApi("/admin/posterids/delete", {
      method: "POST",
      body: { ids: [ids] }
    })

    return res.redirect(withNotice(returnTo, `Poster id ${ids} deleted.`))
  } catch (error) {
    logError(`Could not delete poster ids from ${req.originalUrl}`, error)
    return res.redirect(withNotice(returnTo, error.message || "Could not delete the poster id.", "error"))
  }
}

// POST /manageposterids/status
const setPosterIdStatusAction = async (req, res) => {
  const returnTo = safeReturnTo(req.body.return_to, "/manageposterids")

  try {
    if (!(await guard(req))) {
      return res.status(403).render("404", { message: "You do not have access to this action." })
    }

    const ids = String(req.body.poster_deck_id || "").trim()
    const active = String(req.body.active) === "true"

    if (!ids) {
      return res.redirect(withNotice(returnTo, "No poster id was selected.", "error"))
    }

    await callPosterApi("/admin/posterids/status", {
      method: "POST",
      body: { ids: [ids], active }
    })

    return res.redirect(withNotice(returnTo, `Poster id ${ids} is now ${active ? "active" : "inactive"}.`))
  } catch (error) {
    logError(`Could not change poster id status from ${req.originalUrl}`, error)
    return res.redirect(withNotice(returnTo, error.message || "Could not change the poster id status.", "error"))
  }
}

module.exports = {
  deletePosterAction,
  assignPosterMeetingAction,
  createPosterIdsAction,
  importPosterIdsAction,
  deletePosterIdsAction,
  setPosterIdStatusAction
}
