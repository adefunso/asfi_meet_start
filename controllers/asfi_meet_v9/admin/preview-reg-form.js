const { config } = require("dotenv");
const meetingExists = require("../meetingExists");
const dbPromise = require("../../../routes/dbPromise.config");
config()
const previewRegForm = async (req, res) => {
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


        const getCustomQuestions  = await dbPromise.query("SELECT * FROM pre_reg_questions WHERE meeting_id = ?",[meetingData.id])
        const questions = getCustomQuestions[0]
        
  
                return res.render("pre-registration", {
                    meetingId,
                    postersRoom,
                    meetingRoom,
                    isOwner: isGroupOwner,
                    isActive:true,
                    meetingData,
                    questions,

                });


    } catch (error) {
        console.error("Error in previewRegForm:", error);
        return res.status(500).render("404", { 
            message: "An unexpected error occurred",
            error: process.env.NODE_ENV === "development" ? error.message : null
        });
    }
};

module.exports = previewRegForm;