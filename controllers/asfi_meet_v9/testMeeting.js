const dbPromise = require("../../routes/dbPromise.config")

const testMeeting = async (req,res) =>{
    try{
        const {meetingId} = req.body
        const userId = req.user.id 

        const checkMeetingExists = await dbPromise.query("SELECT * FROM channels WHERE id = ?", [meetingId])
        if(checkMeetingExists[0].length === 0){
            return res.json({error:"Meeting does not exist or you are not the owner"})
        }
        const meetingData = checkMeetingExists[0][0]
        const ownerId = meetingData.isGroupOwner
        const isOwner = ownerId == userId || req.user.acct_type === "administrator"

        if(!isOwner){
            return res.json({error:"You are not the owner of this meeting"})
        }
        // Update the meeting to set hasStarted to false
        await dbPromise.query("UPDATE channels SET hasStarted = ? WHERE id = ? ", ["test", meetingId])
        return res.json({success:"Meeting has started successfully", meetingId:meetingId})
    }catch(error){
        console.log(error)
        return res.json({error:error.message?error.message:error})
    }
}
module.exports = testMeeting;