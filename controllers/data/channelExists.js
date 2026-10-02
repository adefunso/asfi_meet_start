const { db } = require("../../routes/db.config");


async function MeetingExists(passphrase) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM channels WHERE channel = ? OR host = ?", [passphrase, passphrase], (err, data) => {
      if (err) {
        console.log(err);
        reject(err); // Reject the promise with the error
      } else {
        if(data[0]){
        resolve(data[0]); 
        }else{
        resolve([]); 
      }
    }
    });
  });
}



module.exports = MeetingExists
