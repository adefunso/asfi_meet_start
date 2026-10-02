const { db } = require("../../routes/db.config")

const getTotalPosters = async (req,res) =>{
    try{
        db.query(`SELECT COUNT(id) AS total_posters
            FROM posterdecks WHERE 1
            `, async(err, data)=>{ 
                if(err){
                    throw err
                }else if(data){
                    return res.json({success:"totalPosters", totalPosters: data[0].total_posters})
                }
            })
        

    }catch(error){
        return res.json({error:error.message})
    }
}


module.exports = getTotalPosters