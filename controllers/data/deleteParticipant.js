const dbPromise = require("../../routes/dbPromise.config");

const deleteParticipant = async (req, res) => {
    try{
        const participantId = req.params.participantId;
        if(req.user.acct_type !== "administrator"){
            return res.json({error:"You are not authorized to delete participants"})
        }
        if(!participantId){
            return res.json({error:"Participant ID is required"})
        }
        // Check if participant exists
        const checkParticipantExists = await dbPromise.query("SELECT * FROM pre_registration WHERE id = ?", [participantId]);
        if(checkParticipantExists[0].length === 0){
            return res.json({error:"Participant does not exist"})
        }
        // Delete the participant
        await dbPromise.query("DELETE FROM pre_registration WHERE id = ?", [participantId]);
        return res.json({success:"Participant deleted successfully"});

    }catch(error){
        console.log(error)
        return res.json({error:error.message})
    }       

}


module.exports = deleteParticipant;