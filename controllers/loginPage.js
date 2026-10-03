const { config } = require("dotenv")
config()
const loginPage = async (req,res) =>{
    if(req.cookies.posterUser){
        res.redirect("/dashboard")
    }else{
            res.render("signin", {meetingId:"", turnstile_site_key: process.env.TURNSTILE_SITE_KEY || "" })
    }
}

module.exports = loginPage