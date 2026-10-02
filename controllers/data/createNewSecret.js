const { db } = require("../../routes/db.config")

const createSecret = async (req,res) =>{
    const {token} = req.body 
    try{
        db.query(`SEELCT * FROM poster_decks_secret_container WHERE poster_deck_id = ?`, [token], async (err, exists) =>{
            if(err){
                return res.json({error:err})
            }if(exists[0]){
                return res.json({error:"Id Already Exists"})
            }else{
                db.query("INSERT INTO poster_decks_secret_container SET ?", [{poster_deck_id:token}], async (error, newDAta) => {
                    if(error){
                        return res.json({error:error})
                    }else{
                        return res.json({success:"Poster Id Added Successfully"})
                    }
                })
                 
                
            }
        })
    }catch(error){
        return res.json({error:error})
    }
}


module.exports = createSecret