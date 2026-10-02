const { config } = require("dotenv");
const findChannelByPassphrase = require("./findChannel");
const findChannelByHost = require("./findChannelByHost");
const MeetingExists = require("./channelExists");
const FindChannelByView = require("./findChannelByViewer");

const joinMeeting = async (req, res) => {
  try {
    const { channel } = req.params;
  
    console.log(channel)
    const meetingExsits = await MeetingExists(channel)
    // Check if the meeting exists 

    if(meetingExsits.channel){
     
    const MeetingData = await FindChannelByView(channel);

    if (MeetingData.channel && MeetingData.view !== channel) {
      // Use a POST redirect by rendering an HTML form
    if(MeetingData.waitingRoom === "yes") {
       return res.render("waitingRoom")
    }else{
        return res.redirect(`${process.env.ASFI_MEET_ENDPOINT}/v6/${MeetingData.view}`)
        // console.log("VIEW", MeetingData.view)
        // return res.render("joinBrute", {channelToken:MeetingData.view})
    }
    } else if(meetingExsits.host === channel) {
        const MeetingByHost = await findChannelByHost(channel)
        if(MeetingByHost.channel){
        // return res.render("joinBrute", {channelToken:MeetingByHost.host})

           return res.redirect(`${process.env.ASFI_MEET_ENDPOINT}/v6/${MeetingByHost.host}`)
        }else{
          console.log("INVALID HOST ID")
    return res.json({ error: `invalid Meeting HOST ID ${channel}` });
        }
    }

  }else{
    console.log("INVALID CHANNEL ID")
    return res.json({ error: `invalid Channel ID ${channel}` });
  }

  } catch (error) {
    console.log(error)
    return res.json({ internalError: error.message });
  }
};

module.exports = joinMeeting;
