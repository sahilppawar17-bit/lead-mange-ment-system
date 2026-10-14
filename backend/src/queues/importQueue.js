
const { Queue } = require("bullmq");

// Read the Redis connection details from the environment.
function getRedisConnection() {
    const redisUrl =
        process.env.REDIS_URL || "redis://127.0.0.1:6379";

    const parsed = new URL(redisUrl);

    // Build the shared Redis connection settings.
    const connection = {
        host: parsed.hostname,
        port: Number(parsed.port || 6379),
        maxRetriesPerRequest: null,
    };

    // Support Redis authentication when configured.
    if (parsed.password) {
        connection.password = decodeURIComponent(parsed.password);
    }

    if (parsed.username) {
        connection.username = decodeURIComponent(parsed.username);
    }

    // Enable TLS for secure Redis URLs.
    if (parsed.protocol === "rediss:") {
        connection.tls = {};
    }

    return connection;
}

// Configure a producer connection that fails faster during Redis outages.
const producerConnection = {
    ...getRedisConnection(),

    // Limit command retries instead of waiting indefinitely.
    maxRetriesPerRequest: 1,

    // Do not queue commands locally while Redis is disconnected.
    enableOfflineQueue: false,

    // Limit the time allowed to establish a Redis connection.
    connectTimeout: 5000,
};

// Create the queue used by the API to submit import jobs.
const importQueue = new Queue("lead-imports", {
    connection: producerConnection,

    // Keep automatic retries disabled until import recovery is safe.
    defaultJobOptions: {
        attempts: 1,

        // Retain completed jobs for debugging, then remove older records.
        removeOnComplete: {
            age: 7 * 24 * 60 * 60,
            count: 1000,
        },

        // Retain failed jobs longer for troubleshooting.
        removeOnFail: {
            age: 30 * 24 * 60 * 60,
            count: 5000,
        },
    },
});

// Export the queue and shared connection settings for the worker.
module.exports = {
    importQueue,
    getRedisConnection,
};
