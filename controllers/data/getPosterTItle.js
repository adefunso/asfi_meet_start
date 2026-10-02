const { db } = require("../../routes/db.config")

const getPosterTitle = async (req,res) =>{
    try{
        const posterId = req.params.posterId
        db.query("SELECT * FROM posterdecks WHERE poster_deck_id = ?", [posterId], async (err, data)=>{
            if(err){
                throw err
            }else{
                return res.json({success:"PosterData", poster:data})
            }
        })
        }catch(error){
        return res.json({error:error.message})
    }
}


module.exports = getPosterTitle