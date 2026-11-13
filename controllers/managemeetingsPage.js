const { config } = require("dotenv")
config()
const getAllMeetingsForAdmin = require("./asfi_meet_v9/getAllMeetingsForAdmin");
const getPublicMeetings = require("./asfi_meet_v9/getPublicMeetings");
const isAdmin = require("./utils/isAdmin");
const { logError } = require("../utils/logger");

const dashboard = async (req, res) => {
  try {
    if(req.cookies.posterUser){
      const useremail = req.user.email 
      const username  = req.user.username
      const roleAdmin = await isAdmin(useremail, username)
    
      if(roleAdmin){
        const publicMeetings = await getAllMeetingsForAdmin()
        return res.render("adminDashboard", {publicMeetings})
      }else{
        const publicMeetings = await getPublicMeetings()

        return res.render("userDashboard", {publicMeetings})
      }
    }else{
      return res.render("signin", {meetingId:"", turnstile_site_key: process.env.TURNSTILE_SITE_KEY || "" })
    }
  } catch (error) {
    // Database failures here used to take the whole server down
    logError(`Could not load the dashboard for ${req.originalUrl}`, error)
    return res.status(503).render("404", { message: "We could not load your dashboard right now. Please try again." })
  }
};

module.exports = dashboard;
