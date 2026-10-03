const { config } = require("dotenv")
config()
const getRecordings = require("./asfi_meet_v9/getRecorfings")
const isAdmin = require("./utils/isAdmin")

const recordingsPage= async (req,res) =>{
    try{
        
        if(req.cookies.posterUser){
            const useremail = req.user.email 
            const username  = req.user.username
            const roleAdmin = await isAdmin(useremail, username)
            if(roleAdmin){
                const recordings = await getRecordings()
                res.render("recordings", {recordings})

            }else{
              res.render("userDashboard")
            }
        }else{
            res.render("signin", {meetingId:"", turnstile_site_key: process.env.TURNSTILE_SITE_KEY || "" })
        }
    }catch(error){
        res.render("404", {message:error.message})

        // return res.json({error:error.message})
    }
}



module.exports = recordingsPage