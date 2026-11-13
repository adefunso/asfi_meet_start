const { config } = require("dotenv")
config()

const validateSession = require("../utils/validateSession")
const { logError, logWarn } = require("../../utils/logger")

const signinLocals = (req) => ({
    meetingId: req.params.meetingId || "",
    turnstile_site_key: process.env.TURNSTILE_SITE_KEY || ""
})

const loggedIn = async (req, res, next) => {
    if (!req.cookies.posterUser) {
        return res.render("signin", signinLocals(req))
    }

    try {
        const data = await validateSession(req.cookies.posterUser)

        if (data && data.userInfo) {
            req.user = data.userInfo
            return next()
        }

        logWarn(`Login rejected for ${req.method} ${req.originalUrl}: ${(data && data.error) || "no userInfo in response"}`)
        return res.render("signin", signinLocals(req))
    } catch (error) {
        // A failed auth lookup used to crash the process with an unhandled rejection
        logError(`Could not validate login for ${req.method} ${req.originalUrl}`, error)
        return res.status(503).render("signin", {
            ...signinLocals(req),
            authError: "We could not verify your session right now. Please try again in a moment."
        })
    }
}

module.exports = loggedIn
