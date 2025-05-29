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
    res.render("signin", {meetingId:""})
}
  
};

module.exports = managepostersPage;
