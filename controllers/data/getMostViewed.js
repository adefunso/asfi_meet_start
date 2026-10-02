const { db } = require("../../routes/db.config")

const getMostviewed = async (req,res) =>{
    try{
        db.query(`SELECT poster_id, COUNT(*) AS total_views
            FROM poster_reactions
            WHERE reaction = 'viewed'
            GROUP BY poster_id
            ORDER BY total_views DESC
            `, async(err, data)=>{ 
                if(err){
                    throw err
                }else if(data){
                    return res.json({success:"Mostviewed", viewedList: data})
                }
            })
        

    }catch(error){
        return res.json({error:error.message})
    }
}


module.exports = getMostviewed