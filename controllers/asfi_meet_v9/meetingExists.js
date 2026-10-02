const { db } = require("../../routes/db.config");

const meetingExists = (meetingId) => { 
    if(meetingId === undefined || meetingId === null) {
        return false; // Meeting ID is not valid
    }
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM channels WHERE channel = ? OR id = ?", [meetingId, meetingId], (err, result) => {
            if (err) {
                console.error("Error executing query:", err);
                reject(err);
            } else {
                if (result[0]) {
                    resolve(result[0]); // User is an admin
                } else {
                    resolve(false); // User is not an admin
                }
            }
        }
        );
    })
}
module.exports = meetingExists