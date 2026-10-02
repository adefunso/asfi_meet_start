const { db } = require("../../routes/db.config")

const channels = async (req,res) =>{

    try{
   db.query("SELECT * FROM channels WHERE 1 ORDER BY id DESC", async (err, data) =>{
    if(err){
        return res.json({error:err})
    }else{
        return res.json({success:"Channels", channels:data})
    }
   })
}catch(error){
    return res.json({error:error.message})
}
}


module.exports = channels