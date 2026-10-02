const { config } = require("dotenv");
const meetingExists = require("../meetingExists");
config()
const adminPreReg = async (req, res) => {
    try {
        const meetingId = req.params.meetingId;
        const meetingRoom = process.env.MEET;
        const postersRoom = 'https://posters.asfischolar.com'; // Consider moving to config
        
        // Check if meeting exists
        const meetingData = await meetingExists(meetingId);
        if (!meetingData?.channel) {
            return res.render("404", { message: "Meeting does not exist" });
        }

        // Determine user permissions
        const isGroupOwner = meetingData.isGroupOwner == req.user.id || req.user.acct_type === "administrator";
        
        if(!isGroupOwner){
            return res.render("404", { message: "Unauthorized Access" });
        }
   

                return res.render("admin-pre-reg", {
                    meetingId,
                    postersRoom,
                    meetingRoom,
                    isOwner: isGroupOwner,
                    isActive:true,
                    meetingData,
                    csrfToken: req.csrfToken(),
                });


    } catch (error) {
        console.error("Error in adminPreReg:", error);
        return res.status(500).render("404", { 
            message: "An unexpected error occurred",
            error: process.env.NODE_ENV === "development" ? error.message : null
        });
    }
};

module.exports = adminPreReg;