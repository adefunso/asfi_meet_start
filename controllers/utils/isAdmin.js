const { db } = require("../../routes/db.config")
const { logError } = require("../../utils/logger")

const isAdmin = async (email, username) =>{
 return new Promise((resolve, reject) => {
    db.query("SELECT * FROM admin_accounts WHERE user = ? OR user = ?", [email, username], (err, result) => {
        if (err) {
            logError("Error checking admin account", err);
            reject(err);
        } else {
         
            if (result && result[0]) {
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