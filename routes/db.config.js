const { config } = require('dotenv');
const mysql = require('mysql2');
const { logError, logInfo } = require('../utils/logger');

config();

// A pool is used instead of a single connection: an idle connection that the
// server closes used to leave every later query throwing
// "Can't add new command when connection is in closed state".
const db = mysql.createPool({
    host: process.env.DATA_HOST,
    user: process.env.DATA_USER,
    password: process.env.DATA_PASSWORD,
    database: process.env.DATA_MAIN_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DATA_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

// An idle-connection error must be logged, never left unhandled (which crashes)
db.on("error", (error) => {
    logError("MySQL pool error", error);
});

function connectToDatabase() {
    db.getConnection((err, connection) => {
        if (err) {
            logError("Error connecting to the database", err);
            return err;
        }

        connection.release();
        logInfo("Connected to the database (pool).");
        return null;
    });
}

connectToDatabase();

function executeQuery(query, params, callback) {
    db.query(query, params, (err, results) => {
        if (err) {
            logError("Error executing query", err);
            return callback(err, null);
        }
        callback(null, results);
    });
}

module.exports = {
    db,
    connectToDatabase,
    executeQuery
};
