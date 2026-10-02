const dbPromise = require("../../../routes/dbPromise.config");
const meetingExists = require("../meetingExists");

const getAllGuests = async (req,res)=>{

    try {
        const { meetingId } = req.params;
          const meetingData = await meetingExists(meetingId);
        if (!meetingData?.channel) {
            return res.json({ error: "Meeting does not exist" });
        }
        const id = meetingData.id

        // Determine user permissions
        const isGroupOwner = meetingData.isGroupOwner == req.user.id || req.user.acct_type === "administrator";
        if(isGroupOwner){
        const [guests] = await dbPromise.query(
            "SELECT id, email, full_name, status, created_at FROM meeting_guests WHERE meeting_id = ? ORDER BY created_at DESC",
            [id]
        );

       return res.json(guests);
    }
    return res.json({error:"Unathorized"})
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch guests" });
    }
}


module.exports = getAllGuests