const dbPromise = require("../../routes/dbPromise.config")
const sendEmail = require("../emails/sendEmail")

const startMeeting = async (req,res) =>{
    try{
        const {meetingId} = req.body
        const userId = req.user.id 

        const checkMeetingExists = await dbPromise.query("SELECT * FROM channels WHERE id = ?", [meetingId])
        if(checkMeetingExists[0].length === 0){
            return res.json({error:"Meeting does not exist or you are not the owner"})
        }
        const meetingData = checkMeetingExists[0][0]
        if(meetingData.hasStarted === "true" || meetingData.hasStarted === true){
            return res.json({error:"Meeting has already started"})
        }
        const ownerId = meetingData.isGroupOwner
        const isOwner = ownerId == userId || req.user.acct_type === "administrator"

        if(!isOwner){
            return res.json({error:"You are not the owner of this meeting"})
        }
    
        // Update the meeting to set hasStarted to true
        await dbPromise.query("UPDATE channels SET hasStarted = ?, fullStart = ? WHERE id = ? ", ["true", "true", meetingId])
        // getParticipants 
        const participants = await dbPromise.query("SELECT * FROM pre_registration WHERE meetingId = ?", [meetingId])
        // Notify participants about the meeting start
        participants[0].forEach(async participant => {
            // Here you can implement the logic to notify each participant, e.g., via email or WebSocket
            console.log(`Notifying ${participant.email_address} that the meeting has started.`);
            const message = `<div class="header">
        <img src="https://res.cloudinary.com/dvm0bs013/image/upload/v1748442398/logo_inverted_r61aue.png" alt="ASFI Logo" class="logo">
        <h1>Your Seminar Registration is Confirmed!</h1>
    </div>
    
    <div class="content">
        <p>Dear ${ participant.first_name },</p>
        
        <p>Your Meeting <strong>${ meetingData.title }</strong> Has Started!</p>
        
        <div class="details">
            <div class="details-row">
                <span class="details-label">Event:</span>
                <span>${ meetingData.title }</span>
            </div>
           <div class="details-row">
                <span class="details-label">Click here to join</span>
                <span><a href="${process.env.CURRENT_DOMAIN}/join/${meetingData.channel}?byPass=true" class="button">Join Meeting</a></span>
               
            </div>
           
        </div>
        <p>We hope you have a great experience!</p>
        <p>If you have any questions, feel free to reach out.</p>
        </div>`
            await sendEmail(participant.email_address, "Meeting Started", message);
        });
        // Optionally, you can also log the start of the meeting
        // console.log(`Meeting ${meetingId} has started by user ${userId}.`);
        // Return success response

        return res.json({success:"Meeting has started successfully", meetingId:meetingId})
    }catch(error){
        console.log(error)
        return res.json({error:error.message?error.message: error})
    }
}
module.exports = startMeeting;