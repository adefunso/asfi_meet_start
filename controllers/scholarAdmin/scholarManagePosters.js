const isAdmin = require("../utils/isAdmin");


const SCholarManagePosters = async (req, res) => {
  if(req.cookies.posterUser){
    const useremail = req.user.email 
    const username  = req.user.username
    const roleAdmin = await isAdmin(useremail, username)
    if(roleAdmin){
      res.render("managePostersScholar");
    }else{
      res.render("userDashboard")
    }
}else{
    res.render("signin", {meetingId:"", recaptcha_site_key: process.env.RECAPTCHA_SITE_KEY || "" })
}
  
};

module.exports = SCholarManagePosters;
