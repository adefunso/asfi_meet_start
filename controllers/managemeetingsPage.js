const { config } = require("dotenv")
config()
const getAllMeetingsForAdmin = require("./asfi_meet_v9/getAllMeetingsForAdmin");
const getPublicMeetings = require("./asfi_meet_v9/getPublicMeetings");
const isAdmin = require("./utils/isAdmin");
const { logError } = require("../utils/logger");
const { callPosterApi, postersBaseUrl } = require("../utils/posterAdminApi");

// Poster counts per meeting come from the poster app's admin overview. The key
// of each entry is the value stored in posterdecks.poster_deck_meeting, which is
// the channel slug (channels.channel) for recent uploads and the channel secret
// for older ones, so both are checked here.
async function getPosterCounts() {
  try {
    const overview = await callPosterApi("/admin/posters/overview", { query: { limit: 1 } });
    const counts = new Map();

    (overview && Array.isArray(overview.meetings) ? overview.meetings : []).forEach((meeting) => {
      counts.set(String(meeting.meeting), Number(meeting.total) || 0);
    });

    return counts;
  } catch (error) {
    // The meetings dashboard still works without the counts, it just cannot
    // link to a meeting's poster gallery
    logError("Could not load poster counts for the manage meetings dashboard", error);
    return new Map();
  }
}

// Only meetings that actually have posters get a "View all posters" button
function withPosterGalleries(meetings, counts) {
  const postersBase = postersBaseUrl();

  return meetings.map((meeting) => {
    const candidates = [meeting.channel, meeting.channel_secret]
      .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
      .map((value) => String(value));

    let posterKey = null;
    let posterCount = 0;

    candidates.forEach((candidate) => {
      const total = counts.get(candidate) || 0;
      if (total > posterCount) {
        posterCount = total;
        posterKey = candidate;
      }
    });

    return {
      ...meeting,
      posterCount,
      posterShowcaseUrl: posterKey
        ? `${postersBase}/poster-showcase/${encodeURIComponent(posterKey)}`
        : null
    };
  });
}

const dashboard = async (req, res) => {
  try {
    if(req.cookies.posterUser){
      const useremail = req.user.email 
      const username  = req.user.username
      const roleAdmin = await isAdmin(useremail, username)
    
      if(roleAdmin){
        const [publicMeetings, posterCounts] = await Promise.all([
          getAllMeetingsForAdmin(),
          getPosterCounts()
        ])

        return res.render("adminDashboard", { publicMeetings: withPosterGalleries(publicMeetings, posterCounts) })
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
