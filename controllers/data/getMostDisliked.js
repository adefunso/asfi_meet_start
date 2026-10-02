const { db } = require("../../routes/db.config")

const getMostdisliked = async (req,res) =>{
    try{
        db.query(`SELECT poster_id, COUNT(*) AS total_dislikes
            FROM poster_reactions
            WHERE reaction = 'disliked'
            GROUP BY poster_id
            ORDER BY total_dislikes DESC
            `, async(err, data)=>{ 
                if(err){
                    throw err
                }else if(data){
                    return res.json({success:"Mostdisliked", dislikedList: data})
                }
            })
        

    }catch(error){
        return res.json({error:error.message})
    }
}


module.exports = getMostdisliked