const { db } = require("../../routes/db.config");
const isAdmin = require("../utils/isAdmin");

const deleteAdmin = async (req, res) => {
    try {
        const {Id} = req.body;
        
        const adminUser = await isAdmin(req.user.email)
        if(!adminUser){
        const adminUser = await isAdmin(req.user.username)
            if(!adminUser){
                return res.status(403).json({error:"You are not authorized to create an admin"})
            }
        }
        db.query("DELETE FROM admin_accounts WHERE id = ?", [Id], (err, result) => {
            if (err) {
                console.error("Error executing query:", err);
                return res.status(500).json({ error: "Database error" });
            }
            if (result.affectedRows === 0) {
                console.log(result)
                return res.status(404).json({ error: "Admin not found" });
            }else{
                return res.json({success:"Admin Deleted Successfully", message: "Admin deleted successfully" });

            }

        }
        );

    
    } catch (error) {
        console.log(error)
       return res.status(500).json({ error: error.message });
    }
    }

    module.exports = deleteAdmin