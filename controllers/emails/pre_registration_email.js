const { config } = require("dotenv")
const meetingExists = require("../asfi_meet_v9/meetingExists")
const formatDateTime = require("../utils/formatTime")
const sendEmail = require("./sendEmail")
config()

const preRegistrationEmail = async (meetingId, firstName, useremail) =>{
    try{
        const meetingData = await meetingExists(meetingId)
        if(!meetingData || !meetingData.channel){
            return {error:"Meeting does not exist"}
        }
        const meetingRoom = process.env.MEET;
        if(!meetingRoom){
            return {error:"Meeting room link is not configured"}
        }
        const formattedDate = formatDateTime(meetingData.time, true);
        if(!formattedDate){
            return {error:"Invalid meeting time format"}
        }
    
        const emailSubject = `Your Registration for ${meetingData.title} is Confirmed`;
        const message = `
    
    <div class="header">
        <img src="https://res.cloudinary.com/dvm0bs013/image/upload/v1748442398/logo_inverted_r61aue.png" alt="ASFI Logo" class="logo">
        <h1>Your Seminar Registration is Confirmed!</h1>
    </div>
    
    <div class="content">
        <p>Dear ${ firstName },</p>
        
        <p>Thank you for registering for the <strong>${ meetingData.title }</strong>. We're excited to have you join us!</p>
        
        <div class="details">
            <div class="details-row">
                <span class="details-label">Event:</span>
                <span>${ meetingData.title }</span>
            </div>
            <div class="details-row">
                <span class="details-label">Date & Time:</span>
                <span>${ formattedDate }</span>
            </div>
        
            <div class="details-row">
                <span class="details-label">Location:</span>
                <span>Online (Join link will be sent prior to event)</span>
            </div>
        </div>
        
        <p>We'll send you a reminder email with the meeting link 24 hours before the event starts.</p>
        
        <p>If you can no longer attend, please let us know by replying to this email.</p>
        
        <a href='https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meetingData.title)}&dates=${formattedDate}/${formattedDate}' class='button'>Add to Calendar</a>
        `;
    await sendEmail(useremail, emailSubject, message)
        return {success:true, message:"Pre-registration email sent successfully"}
    }catch(error){
        console.log("Error in preRegistrationEmail:", error)
        return {error:error.message?error.message:error}
    }
}

module.exports = preRegistrationEmail