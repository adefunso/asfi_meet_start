
const { config } = require('dotenv');
const sql = require('mysql2'); // Use require instead of import

config();

const db = sql.createConnection({
    host: process.env.DATA_HOST,
    user: process.env.DATA_USER,
    password: process.env.DATA_PASSWORD,
    database: process.env.DATA_MAIN_NAME
});

// Function to check database connection and return errors
function connectToDatabase() {
    db.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return err; // Return the error
        }
        console.log('Connected to the database.');
        return null; // No error, connection successful
    });
}
connectToDatabase()
// Function to handle query errors
function executeQuery(query, params, callback) {
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return callback(err, null); // Return error
        }
        callback(null, results); // Return results on success
    });
}

module.exports = { 
    db,
    connectToDatabase,
    executeQuery
};
