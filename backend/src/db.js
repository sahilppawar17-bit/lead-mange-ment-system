
require("dotenv").config();

const { Pool, types } = require("pg");

// Keep PostgreSQL timestamps as strings, preserving your existing behavior.
types.setTypeParser(1114, (value) => value);

// Configure a separate, bounded pool in each Node.js process.
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // Maximum connections this process can open.
    max: Number(process.env.DB_POOL_MAX || 5),

    // Close connections that remain idle for too long.
    idleTimeoutMillis: Number(
        process.env.DB_IDLE_TIMEOUT_MS || 30000
    ),

    // Limit how long establishing a connection may take.
    connectionTimeoutMillis: Number(
        process.env.DB_CONNECTION_TIMEOUT_MS || 3000
    ),

    // Ask PostgreSQL to stop an SQL statement that runs too long.
    statement_timeout: Number(
        process.env.DB_STATEMENT_TIMEOUT_MS || 5000
    ),

    // Bound how long a transaction may remain idle between statements.
    idle_in_transaction_session_timeout: Number(
        process.env.DB_IDLE_TRANSACTION_TIMEOUT_MS || 10000
    ),
});

// Log unexpected errors from idle pooled connections.
pool.on("error", (error) => {
    console.error(
        "[PostgreSQL Pool] Unexpected idle-client error:",
        error.message
    );
});

module.exports = pool;
