const { config } = require("dotenv")
config()
const isAdmin = require("./utils/isAdmin");

const managepostersPage = async (req, res) => {
  if(req.cookies.posterUser){
    const useremail = req.user.email 
    const username  = req.user.username
    const roleAdmin = await isAdmin(useremail, username)
    if(roleAdmin){
      res.render("manageposters");
    }else{
      res.render("userDashboard")
    }
}else{
    res.render("signin", {meetingId:"", turnstile_site_key: process.env.TURNSTILE_SITE_KEY || "" })
}
  
};

module.exports = managepostersPage;
