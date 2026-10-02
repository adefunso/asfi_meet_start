const { config } = require("dotenv")

const startASFIScholarCall = async (req,res)=>{
    try{
        const meetingId = req.params.meeting
        const meetingRoom= process.env.MEET 
        // const postersRoom = process.env.POSTERS
        const postersRoom = 'https://posters.asfischolar.com'
        
    res.render("asfiCall", {meetingId, postersRoom, meetingRoom}) 
    }catch(error){
        console.log(error)
        return res.json({error:error.message})
    }
}



module.exports = startASFIScholarCall