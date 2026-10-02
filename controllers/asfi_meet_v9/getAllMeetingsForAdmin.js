const { db } = require("../../routes/db.config")

const getAllMeetingsForAdmin = async () => {
   
        return new Promise((resolve, reject) => {
            db.query("SELECT * FROM channels WHERE 1 ORDER BY id DESC", (err, data) => {
                if (err) {
                    console.error("Error executing query:", err);
                    reject(err);
                } else {
                    resolve(data); // Resolve the promise with the data
                }
            });
        }
        )       


}
module.exports = getAllMeetingsForAdmin