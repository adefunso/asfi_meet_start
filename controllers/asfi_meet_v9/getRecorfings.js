const { db } = require("../../routes/db.config");

const getRecordings = async () => {

   return new Promise((resolve, reject) => {
      db.query("SELECT * FROM recordings", (err, result) => {
         if (err) {
            console.error("Error executing query:", err);
            reject(err);
         } else {
            if (result[0]) {
                resolve(result)
            } else {
               resolve([]); // No recordings found
            }
         }
      });
   }
   );
}

module.exports = getRecordings