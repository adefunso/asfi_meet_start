const { config } = require("dotenv")
const dbPromise = require("../../../routes/dbPromise.config")
const meetingExists = require("../meetingExists")
const jwt = require("jsonwebtoken")
    config()

const validateGuest = async (req,res) =>{
try{
    const {email, pass_code:passcode, meeting} = req.body 
    // checkexists 
    const meetingData = await meetingExists(meeting)

    if(!meetingData.channel){
        return res.json({error:"Invalid Meeting Info"})
    }

    const meetingId = meetingData.id

    const guestExists = await dbPromise.query("SELECT * FROM meeting_guests WHERE email = ? AND meeting_id = ?",[email, meetingId])
    if(guestExists[0].length > 0){
        const guest = guestExists[0][0]
        if(guest.passcode !== passcode){
            return res.json({error:"Invalid Credentials Provided"})
        }
           const cookieOptions = {
        expiresIn: new Date(Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        httpOnly: true
    } 
   const token = jwt.sign({id: guest.id}, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES
                    // httpOnly: true
                })
        if(guest.status === "pending"){
           await dbPromise.query("UPDATE meeting_guests SET ? WHERE id = ? AND email = ? AND meeting_id = ?",[{status:"confirmed"}, guest.id, email, meetingId])

           res.cookie("gst", token, cookieOptions)
            return res.json({success:"Inivtation Accepted"})
        }
        if(guest.status === "confirmed"){
           res.cookie("gst", token, cookieOptions)
            return res.json({success:"Login Confirmed"})
            
        }
    }else{
        return res.json({error:"This User does not exist"})
    }
}catch(error){
    console.error(error)
    return res.json({error:error.message})
}
}


module.exports = validateGuest