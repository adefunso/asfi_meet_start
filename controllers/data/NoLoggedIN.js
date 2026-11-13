const { config } = require("dotenv")
config()

const validateSession = require("../utils/validateSession")
const { logError, logWarn } = require("../../utils/logger")

function getClientIP(req) {
    let ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    // Clean IPv6 localhost
    if (ip === '::1') ip = '127.0.0.1';

    return ip;
}

const asGuest = (req, res, next) => {
    req.user = {
        id: getClientIP(req),
        acct_type: "scholar_account"
    }
    next()
}

const NoLogInNeeded = async (req, res, next) => {
    const signinLocals = {
        meetingId: req.params.meetingId || req.params.meeting || "",
        turnstile_site_key: process.env.TURNSTILE_SITE_KEY || ""
    }

    if (req.cookies.posterUser) {
        try {
            const data = await validateSession(req.cookies.posterUser)

            if (data && data.userInfo) {
                req.user = data.userInfo
                return next()
            }

            logWarn(`Guest login rejected: ${(data && data.error) || "no userInfo in response"}`)
            return res.render("signin", signinLocals)
        } catch (error) {
            logError("Could not validate login for guest route", error)
            return res.status(503).render("signin", {
                ...signinLocals,
                authError: "We could not verify your session right now. Please try again in a moment."
            })
        }
    }

    if (req.query.byPass == true || req.query.byPass == "true" || req.query.byPass == 1) {
        return asGuest(req, res, next)
    }

    if (req.query.guest == true || req.query.guest == 'true' || req.query.guest == 1) {
        return asGuest(req, res, next)
    }

    return res.render("signin", signinLocals)
}

module.exports = NoLogInNeeded
