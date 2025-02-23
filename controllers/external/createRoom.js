const { db } = require("../../routes/db.config")
const { GenerateRandomID, createSecretSalt } = require("../utils/saltAndToken")
const { v4: uuidv4 } = require('uuid'); 

const createRoomButton = async (req,res) =>{
    try{
        const {room} = req.body
        const secret = uuidv4();
     
        db.query("SELECT * FROM channels WHERE channel = ? ", [room], async(err, data) =>{
            if(err){
                console.log(err)
            }
            if(data[0]){
                return res.json({success:"Meeting Already Exists"})
            }else{
                db.query("INSERT INTO channels SET ?", [{title:room,channel_secret:secret, channel:room }], async (err, inserted) =>{
                        if(err){
                            console.log(err)
                            return res.json({error:err})
                        }else{
            
                            return res.json({success:`Meeting Created Succesfully host:`})
                        }
                    })
            }
        })
    }catch(error){
        console.log(error)
        res.json({error:error.message})
    }
}


module.exports = createRoomButton