
module.exports = {
    apps: [
        {
            name: "leads-api",
            script: "./src/app.js",
            instances: 2,
            exec_mode: "cluster",
            env: {
                NODE_ENV: "development",
                PORT: 3000,
                DB_POOL_MAX: 5,
                DB_CONNECTION_TIMEOUT_MS: 3000,
                DB_IDLE_TIMEOUT_MS: 30000,
                DB_STATEMENT_TIMEOUT_MS: 5000,
                DB_IDLE_TRANSACTION_TIMEOUT_MS: 10000,
                REQUEST_TIMEOUT_MS: 120000
            },
            time: true,
            max_memory_restart: "500M"
        },
        {
            name: "leads-import-worker",
            script: "./src/worker.js",
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "development",
                DB_POOL_MAX: 5,
                DB_CONNECTION_TIMEOUT_MS: 3000,
                DB_IDLE_TIMEOUT_MS: 30000,
                DB_STATEMENT_TIMEOUT_MS: 5000,
                DB_IDLE_TRANSACTION_TIMEOUT_MS: 10000
            },
            time: true,
            max_memory_restart: "500M"
        }
    ]
};
