const { config } = require("dotenv")
config()

const isAdmin = require("./utils/isAdmin");
const { logError } = require("../utils/logger")

const PAGE_SIZE = 25
const SORT_MODES = ["newest", "oldest", "title", "rating", "views", "likes"]
const OVERVIEW_TIMEOUT_MS = Number(process.env.POSTERS_TIMEOUT_MS) || 10000

const EMPTY_STATS = {
  totalPosters: 0,
  totalMeetings: 0,
  totalRatings: 0,
  averageRating: 0,
  totalViews: 0,
  totalLikes: 0,
  totalDislikes: 0,
  totalDownloads: 0
}

// The posters live in the poster app's database, so the dashboard reads them
// through its admin overview API rather than a second database connection.
function postersBaseUrl() {
  return String(process.env.POSTERS || "https://posters.asfischolar.com").replace(/\/+$/, "")
}

async function fetchPosterOverview(params) {
  // The poster app only serves this endpoint to callers holding the shared secret
  const apiKey = String(process.env.POSTERS_ADMIN_API_KEY || "").trim()
  if (!apiKey) {
    throw new Error("POSTERS_ADMIN_API_KEY is not set, cannot call the poster overview API")
  }

  const url = `${postersBaseUrl()}/admin/posters/overview?${params.toString()}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OVERVIEW_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "x-posters-admin-key": apiKey }
    })

    if (!response.ok) {
      throw new Error(`Poster overview responded with status ${response.status}`)
    }

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      throw new Error(`Poster overview returned ${contentType || "an unknown content type"} instead of JSON`)
    }

    return await response.json()
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Poster overview timed out after ${OVERVIEW_TIMEOUT_MS}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function formatDate(value) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// Compact page window: 1 … 4 5 [6] 7 8 … 20
function buildPageLinks(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, totalPages, page, page - 1, page + 1])

  if (page <= 4) {
    [2, 3, 4, 5].forEach((value) => pages.add(value))
  }
  if (page >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach((value) => pages.add(value))
  }

  const sorted = Array.from(pages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b)

  return sorted.reduce((links, value, index) => {
    if (index > 0 && value !== sorted[index - 1] + 1) {
      links.push("…")
    }
    links.push(value)
    return links
  }, [])
}

const managepostersPage = async (req, res) => {
  try {
    if (!req.cookies.posterUser || !req.user) {
      return res.render("signin", { meetingId: "", turnstile_site_key: process.env.TURNSTILE_SITE_KEY || "" })
    }

    const roleAdmin = await isAdmin(req.user.email, req.user.username)
    if (!roleAdmin) {
      return res.render("userDashboard")
    }

    const filters = {
      meeting: String(req.query.meeting || "").trim(),
      sort: SORT_MODES.includes(req.query.sort) ? req.query.sort : "newest",
      page: Math.max(1, parseInt(req.query.page, 10) || 1)
    }

    const params = new URLSearchParams()
    if (filters.meeting) params.set("meeting", filters.meeting)
    params.set("sort", filters.sort)
    params.set("page", String(filters.page))
    params.set("limit", String(PAGE_SIZE))

    let overview = null
    let loadError = null

    try {
      overview = await fetchPosterOverview(params)
    } catch (error) {
      loadError = "Could not load posters from the poster service. Please try again."
      logError(`Could not load the poster overview for ${req.originalUrl}`, error)
    }

    const stats = overview && overview.stats ? overview.stats : EMPTY_STATS
    const meetings = overview && Array.isArray(overview.meetings) ? overview.meetings : []
    const posters = (overview && Array.isArray(overview.posters) ? overview.posters : []).map((poster) => ({
      ...poster,
      dateLabel: formatDate(poster.created_at)
    }))
    const pagination = overview && overview.pagination
      ? overview.pagination
      : { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1, hasPrevious: false, hasNext: false }

    return res.render("manageposters", {
      stats,
      meetings,
      posters,
      pagination,
      filters,
      pageLinks: buildPageLinks(pagination.page, pagination.totalPages),
      postersBase: postersBaseUrl(),
      loadError
    })
  } catch (error) {
    logError(`Could not render the poster dashboard for ${req.originalUrl}`, error)
    return res.status(503).render("404", { message: "We could not load the poster dashboard right now. Please try again." })
  }
}

module.exports = managepostersPage;
module.exports.PAGE_SIZE = PAGE_SIZE;
module.exports.buildPageLinks = buildPageLinks;
