const { db } = require("../../routes/db.config")

const getMostRated = async (req,res) =>{
    try{
        
        db.query(`SELECT posterId, SUM(rating) AS total_ratings
            FROM ratings
            GROUP BY posterId
            ORDER BY total_ratings DESC
            `, async(err, data)=>{
                if(err){
                    throw err
                }else if(data){
                    return res.json({success:"MostRated", ratedList: data})
                }
            })
         

    }catch(error){
        return res.json({error:error.message})
    }
}


module.exports = getMostRated