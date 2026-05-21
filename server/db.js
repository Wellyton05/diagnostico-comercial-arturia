const mysql = require('mysql2/promise');
require('dotenv').config();

const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'diagcomercial',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (process.env.DB_SSL === 'true') {
    poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;
