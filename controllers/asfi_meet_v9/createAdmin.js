const { db } = require("../../routes/db.config");
const isAdmin = require("../utils/isAdmin");

const createAdmin = async (req,res) =>{
try{
    const adminUser = await isAdmin(req.user.email)
    if(!adminUser){
    const adminUser = await isAdmin(req.user.username)
        if(!adminUser){
            return res.status(403).json({error:"You are not authorized to create an admin"})
        }
    }

    if(!req.body.user){
        return res.status(400).json({error:"Please provide a user"})
    }
    const {user} = req.body
    db.query("SELECT * FROM admin_accounts WHERE user = ?", [user], (err, result) => {
        if (err) {
            console.error("Error executing query:", err);
            return res.status(500).json({error:"Error executing query"})
        } else {
            if (result[0]) {
                return res.status(400).json({error:"User already exists"})
            } else {
                db.query("INSERT INTO admin_accounts SET ?", [{user:user}], (err, result) => {
                    if (err) {
                        console.error("Error executing query:", err);
                        return res.status(500).json({error:"Error executing query"})
                    } else {
                        return res.json({success:"Admin created successfully", AdminId:result.insertId, message: "Admin created successfully" });
                    }
                });
            }
        }
    }
    );
}catch(error){
    console.log(error)
    return res.json({error:error.message})
}
}

module.exports = createAdmin