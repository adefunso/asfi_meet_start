const dbPromise = require("../../../routes/dbPromise.config");
const sendEmail = require("../../emails/sendEmail");
const formatDateTime = require("../../utils/formatTime");
const generatePassCode = require("../../utils/generatePassCode");
const meetingExists = require("../meetingExists");

const createGuest = async (req, res) => {
    try {
        const { meetingId, email, fullName } = req.body;
        // Validate input
        if (!meetingId || !email || !fullName) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const meetingData = await meetingExists(meetingId)
        // Check if guest already exists
        const [existing] = await dbPromise.query(
            "SELECT id FROM meeting_guests WHERE meeting_id = ? AND email = ?",
            [meetingId, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: "Guest already exists" });
        }

        // Insert new guest
        const passCode = await generatePassCode()
        if(passCode == null){
            return res.json({error:"could not generate pass code"})
        }

        const [result] = await dbPromise.query(
            "INSERT INTO meeting_guests (meeting_id, email, full_name, status, passcode) VALUES (?, ?, ?, 'pending', ?)",
            [meetingId, email, fullName, passCode]
        );
        const subject = `Special Invitation to ${meetingData.title}`
        const formattedDate = formatDateTime(meetingData.time, true);
                if(!formattedDate){
                    return {error:"Invalid meeting time format"}
                }
            
            const message = `
    
    <div class="header">
        <img src="https://res.cloudinary.com/dvm0bs013/image/upload/v1748442398/logo_inverted_r61aue.png" alt="ASFI Logo" class="logo">
        <h1>You have been invited As a Guest !</h1>
    </div>
    
    <div class="content">
        <p>Dear ${ fullName },</p>
        
        <p>You have been invited as a guest on <strong>${ meetingData.title }</strong>. We're excited to have you join us!</p>
        
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
                <span>Online </span>
                <span>Click <a href="${process.env.CURRENT_DOMAIN}/join/${meetingData.channel}?byPass=true&guest=true" class="button">Join Meeting</a> 
                <br>to join / preview the meeting
            </div>
            <div class="details-row">
                <span class="details-label">Your Pass Code is:</span>
                <h3>${passCode}</h3>
            </div>
        </div>
        
        <p>We'll send you a reminder email with the meeting link 24 hours before the event starts.</p>
        
        <p>If you can no longer attend, please let us know by replying to this email.</p>
        
        <a href='https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meetingData.title)}&dates=${formattedDate}/${formattedDate}' class='button'>Add to Calendar</a>
        `;
await sendEmail(email, subject, message)
        res.json({
            success: true,
            guestId: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add guest" });
    }
}


module.exports = createGuest

