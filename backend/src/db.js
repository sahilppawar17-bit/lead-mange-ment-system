require("dotenv").config();

const { Pool, types } = require("pg");

// Keep PostgreSQL "timestamp without time zone"
// as a string instead of converting it to a JavaScript Date.
types.setTypeParser(1114, value => value);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on("error", (error) => {
    console.error(
        "Unexpected PostgreSQL pool error:",
        error
    );
});

module.exports = pool;