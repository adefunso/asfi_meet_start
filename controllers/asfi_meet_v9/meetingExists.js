const { db } = require("../../routes/db.config");
const { logError } = require("../../utils/logger");

const meetingExists = (meetingId) => { 
    if(meetingId === undefined || meetingId === null) {
        return false; // Meeting ID is not valid
    }
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM channels WHERE channel = ? OR id = ?", [meetingId, meetingId], (err, result) => {
            if (err) {
                logError("Error looking up meeting", err);
                reject(err);
            } else {
                if (result && result[0]) {
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