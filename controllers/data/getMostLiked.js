const { db } = require("../../routes/db.config")

const getMostLiked = async (req,res) =>{ 
    try{
        db.query(`SELECT poster_id, COUNT(*) AS total_likes
            FROM poster_reactions
            WHERE reaction = 'liked'
            GROUP BY poster_id
            ORDER BY total_likes DESC
            `, async(err, data)=>{
                if(err){
                    throw err
                }else if(data){
                    return res.json({success:"MostLiked", likedList: data})
                }
            })
        

    }catch(error){
        return res.json({error:error.message})
    }
}


module.exports = getMostLiked