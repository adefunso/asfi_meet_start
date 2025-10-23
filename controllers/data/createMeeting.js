
const { v4: uuidv4 } = require('uuid'); 
const { db } = require('../../routes/db.config');

const createMeeting = async (req,res) =>{
    try{
        const {title, time, isPrivate, preRegistration, description } = req.body
        const userId = req.user.id
     
       // Function to capitalize each word and remove spaces
const formatTitle = (str) => {
    return str
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove all special characters except letters, numbers, and spaces
        .replace(/\s+/g, '')             // Remove all whitespace
        .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize each word
};


        const rid = formatTitle(title);
        const secret = uuidv4();
        let hasStarted = "true"
        if(preRegistration === "yes" || preRegistration === "true"){
            hasStarted = "false"
        }

   

     
        db.query("SELECT * FROM channels WHERE channel = ? ", [rid], async(err, data) =>{
            if(err){
                console.log(err)
            }
            if(data[0]){
                return res.json({success:"Meeting Already Exists"})
            }else{
                db.query("INSERT INTO channels SET ?", [{title:title, channel_secret:secret, channel:rid, time, privateMeeting:isPrivate, isGroupOwner:userId, preRegistration, description, hasStarted }], async (err, inserted) =>{
                        if(err){
                            console.log(err)
                            return res.json({error:err})
                        }else{
            
                            return res.json({success:`Meeting Created Succesfully host:`, meetingId:inserted.insertId, channel:rid})
                        }
                    })
            }
        })
    }catch(error){
        console.log(error)
        res.json({error:error.message})
    }
}


module.exports = createMeeting