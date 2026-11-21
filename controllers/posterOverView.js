const isAdmin = require("./utils/isAdmin")
const { logError } = require("../utils/logger")
const { callPosterApi, postersBaseUrl } = require("../utils/posterAdminApi")

const BOARD_LIMIT = 10
const EMPTY_BOARDS = { liked: [], rated: [], viewed: [], disliked: [] }

const posterOverVIew = async (req, res) => {
    try {
        if (!req.cookies.posterUser || !req.user) {
            return res.render("signin", { meetingId: "", turnstile_site_key: process.env.TURNSTILE_SITE_KEY || "" })
        }

        const roleAdmin = await isAdmin(req.user.email, req.user.username)

        if (!roleAdmin) {
            return res.render("userDashboard")
        }

        const meeting = String(req.query.meeting || "").trim()

        let leaderboards = null
        let loadError = null

        try {
            leaderboards = await callPosterApi("/admin/posters/leaderboards", {
                query: { meeting, limit: BOARD_LIMIT }
            })
        } catch (error) {
            loadError = "Could not load the poster leaderboards from the poster service. Please try again."
            logError(`Could not load poster leaderboards for ${req.originalUrl}`, error)
        }

        const meetings = leaderboards && Array.isArray(leaderboards.meetings) ? leaderboards.meetings : []
        const boards = leaderboards && leaderboards.boards ? leaderboards.boards : EMPTY_BOARDS
        const selectedMeeting = meetings.find((option) => option.meeting === meeting) || null

        return res.render("posteroverview", {
            boards,
            meetings,
            meeting,
            selectedMeetingName: selectedMeeting ? selectedMeeting.name : "",
            loadError,
            postersBase: postersBaseUrl(),
            boardLimit: BOARD_LIMIT
        })
    } catch (error) {
        logError(`Could not render poster leaderboards for ${req.originalUrl}`, error)
        return res.status(503).render("404", { message: "We could not load the poster leaderboards right now. Please try again." })
    }
}

module.exports = posterOverVIew
module.exports.BOARD_LIMIT = BOARD_LIMIT
