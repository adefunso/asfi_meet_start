const { config } = require("dotenv")
const isAdmin = require("./utils/isAdmin")

const CreatePage = async (req,res) =>{
    
    const createMeetLink = process.env.MEET
  
    if(req.cookies.posterUser){
        const useremail = req.user.email 
        const username  = req.user.username
        const roleAdmin = await isAdmin(useremail, username)
        if(roleAdmin){
            res.render("create", {createMeetLink})
        }else{
          res.render("userDashboard")
        }
    }else{
        res.render("signin", {meetingId:""})
    }

    
}


module.exports = CreatePage