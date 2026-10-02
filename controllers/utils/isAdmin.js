const { db } = require("../../routes/db.config")

const isAdmin = async (email, username) =>{
 return new Promise((resolve, reject) => {
    db.query("SELECT * FROM admin_accounts WHERE user = ? OR user = ?", [email, username], (err, result) => {
        if (err) {
            console.error("Error executing query:", err);
            reject(err);
        } else {
         
            if (result[0]) {
                resolve(true); // User is an admin
            } else {
                resolve(false); // User is not an admin
            }
        }
    }
    );

})

}


module.exports = isAdmin