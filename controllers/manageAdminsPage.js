
const { config } = require("dotenv")
config()
const getAllAdmins = require("./asfi_meet_v9/getAllAdmins");
const getPublicMeetings = require("./asfi_meet_v9/getPublicMeetings");
const isAdmin = require("./utils/isAdmin");

const manageAdminsPage = async (req, res) => {
  if(req.cookies.posterUser){
    const useremail = req.user.email 
    const username  = req.user.username
    const roleAdmin = await isAdmin(useremail, username)
   
    if(roleAdmin){
      const adminAccounts = await getAllAdmins()
      res.render("createAdminAccount", {adminAccounts})
    }else{
      const publicMeetings = await getPublicMeetings()

      res.render("userDashboard", {publicMeetings})
    }
  }else{
            res.render("signin", {meetingId:"", recaptcha_site_key: process.env.RECAPTCHA_SITE_KEY || "" })
  }
};

module.exports = manageAdminsPage;
