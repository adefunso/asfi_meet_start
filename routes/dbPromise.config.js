const mysql = require('mysql2/promise');
const dotenv = require("dotenv").config();

const dbPromise = mysql.createPool({
    host: process.env.DATA_HOST,
    user: process.env.DATA_USER,
    password: process.env.DATA_PASSWORD,
    database: process.env.DATA_MAIN_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

module.exports = dbPromise;