const isAdmin = require("./utils/isAdmin")
const { logError } = require("../utils/logger")
const { callPosterApi } = require("../utils/posterAdminApi")
const { buildPageLinks } = require("./managepostersPage")

const PAGE_SIZE = 25
const STATUS_FILTERS = ["all", "active", "inactive", "used", "unused"]

function formatDate(value) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function currentQuery(filters, page) {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  if (filters.status && filters.status !== "all") params.set("status", filters.status)
  if (page) params.set("page", String(page))
  const query = params.toString()
  return query ? `/manageposterids?${query}` : "/manageposterids"
}

const manageposterIdsPage = async (req, res) => {
  try {
    if (!req.cookies.posterUser || !req.user) {
      return res.render("signin", { meetingId: "", turnstile_site_key: process.env.TURNSTILE_SITE_KEY || "" })
    }

    const roleAdmin = await isAdmin(req.user.email, req.user.username)
    if (!roleAdmin) {
      return res.render("userDashboard")
    }

    const filters = {
      q: String(req.query.q || "").trim(),
      status: STATUS_FILTERS.includes(String(req.query.status)) ? String(req.query.status) : "all",
      page: Math.max(1, parseInt(req.query.page, 10) || 1)
    }

    let data = null
    let loadError = null

    try {
      data = await callPosterApi("/admin/posterids/list", {
        query: { page: filters.page, limit: PAGE_SIZE, q: filters.q, status: filters.status }
      })
    } catch (error) {
      loadError = "Could not load poster ids from the poster service. Please try again."
      logError(`Could not load poster ids for ${req.originalUrl}`, error)
    }

    const posterIds = (data && Array.isArray(data.posterIds) ? data.posterIds : []).map((row) => ({
      ...row,
      dateLabel: formatDate(row.created_at)
    }))

    const pagination = data && data.pagination
      ? data.pagination
      : { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1, hasPrevious: false, hasNext: false }

    const notice = req.query.notice ? { text: String(req.query.notice), kind: req.query.kind === "error" ? "error" : "success" } : null

    return res.render("manageposterids", {
      posterIds,
      pagination,
      filters,
      pageLinks: buildPageLinks(pagination.page, pagination.totalPages),
      pageUrl: (page) => currentQuery(filters, page),
      returnTo: currentQuery(filters, filters.page),
      notice,
      loadError
    })
  } catch (error) {
    logError(`Could not render the poster id dashboard for ${req.originalUrl}`, error)
    return res.status(503).render("404", { message: "We could not load the poster id dashboard right now. Please try again." })
  }
}

module.exports = manageposterIdsPage
module.exports.PAGE_SIZE = PAGE_SIZE
module.exports.STATUS_FILTERS = STATUS_FILTERS
