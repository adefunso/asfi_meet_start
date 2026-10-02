const meetingExists = require("../meetingExists")

const GuestPage = async (req,res) =>{
    const {meetingId} = req.params
try{
 
    const meetingData = await meetingExists(meetingId);
        if (!meetingData?.channel) {
            return res.render("404", { message: "Meeting does not exist" });
        }

        // Determine user permissions
        const isGroupOwner = meetingData.isGroupOwner == req.user.id || req.user.acct_type === "administrator";
        if(isGroupOwner){
            return res.render("admin-guest-list", {
                meetingId: meetingData.channel,
                isActive:true,
                meetingData,
                isOwner: isGroupOwner})
        }

        return res.render("404",{message:"Could not update"})

    
}catch(error){
    
    console.log(error)
    return res.render("404", {message:"Something went wrong"})
}
}

module.exports = GuestPage