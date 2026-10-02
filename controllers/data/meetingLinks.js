const findChannelByPassphrase = require("./findChannel")

const meetingLinks = async (req,res) =>{
    try{
    const token = req.params.channel 
    const MeetinData = await findChannelByPassphrase(token)

    const host = MeetinData.host 
    const attendee = MeetinData.channel_secret
    

    res.render("start", {host:`${process.env.CURRENT_DOMAIN}/v3/${host}`, attendee:`${process.env.CURRENT_DOMAIN}/v3/${attendee}`, meetingTItle:MeetinData.title})
    }catch(error){
        res.json({error:error.message})
    }
}

module.exports = meetingLinks