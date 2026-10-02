const loginPage = async (req,res) =>{
    if(req.cookies.posterUser){
        res.redirect("/dashboard")
    }else{
            res.render("signin", {meetingId:"", recaptcha_site_key: process.env.RECAPTCHA_SITE_KEY || "" })
    }
}

module.exports = loginPage