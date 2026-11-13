const { config } = require("dotenv")
config()
const isAdmin = require("./utils/isAdmin")
const { logError } = require("../utils/logger")

const CreatePage = async (req,res) =>{
    
    const createMeetLink = process.env.MEET

    try{
        if(req.cookies.posterUser){
            const useremail = req.user.email 
            const username  = req.user.username
            const roleAdmin = await isAdmin(useremail, username)
            if(roleAdmin){
                return res.render("create", {createMeetLink})
            }else{
                return res.render("userDashboard")
            }
        }else{
            return res.render("signin", {meetingId:"", turnstile_site_key: process.env.TURNSTILE_SITE_KEY || "" })
        }
    }catch(error){
        // A failed database lookup used to crash the process here
        logError(`Could not render the create page for ${req.originalUrl}`, error)
        return res.status(503).render("404", { message: "We could not load the meeting page. Please try again." })
    }
}


module.exports = CreatePage