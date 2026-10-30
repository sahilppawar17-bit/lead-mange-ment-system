
require("dotenv").config();

const cors = require("cors");
const express = require("express");

const pool = require("./db");
const requestTimeout = require("./middleware/requestTimeout");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const leadRoutes = require("./routes/leadRoutes");
const importRoutes = require("./routes/importRoutes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

app.use(express.json());
app.use(requestTimeout);

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/imports", importRoutes);
app.use("/api/files", fileRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: "ROUTE_NOT_FOUND",
            message: "Route not found",
        },
    });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});

let isShuttingDown = false;

async function shutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`[API] ${signal} received. Shutting down...`);

    // Stop accepting new HTTP connections.
    server.close(async (serverError) => {
        try {
            if (serverError) {
                throw serverError;
            }

            await pool.end();

            console.log("[API] HTTP server and PostgreSQL pool closed.");
            process.exitCode = 0;
        } catch (error) {
            console.error("[API] Shutdown failed:", error);
            process.exitCode = 1;
        }
    });

    // Avoid waiting forever for existing HTTP connections.
    const shutdownTimer = setTimeout(() => {
        console.error("[API] Graceful shutdown timed out.");
        process.exit(1);
    }, Number(process.env.SHUTDOWN_TIMEOUT_MS || 15000));

    shutdownTimer.unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
