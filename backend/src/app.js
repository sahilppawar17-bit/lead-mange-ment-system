require("dotenv").config();
const cors = require("cors");
const express = require("express");

//Import routes for CSV/XLSX lead uploads.
const importRoutes = require("./routes/importRoutes");

//Access the shared PostgreSQL pool for graceful shutdown.
const pool = require("./db");

const leadRoutes = require("./routes/leadRoutes");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");

const {startImportWorker} = require("./workers/importWorker");
const { recoverAbandonedImportJobs } = require("./services/importJobService")
const app = express();

const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/leads", leadRoutes);

//Register the lead import API.
app.use("/api/imports", importRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: "ROUTE_NOT_FOUND",
            message: "Route not found"
        }
    });
});

app.use(errorHandler);
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


/*Recover abandoned jobs before starting the background worker.*/
let stopImportWorker;

const startWorkerSafely = async () => {
    try {
        const abandonedJobs = await recoverAbandonedImportJobs();

        for (const job of abandonedJobs) {
            console.warn(
                `[Import Worker] Marked abandoned job ${job.id} ` +
                `(${job.original_filename}) as failed.`
            );
        }

        stopImportWorker = startImportWorker();
    } catch (error) {
        console.error(
            "[Import Worker] Could not recover abandoned jobs:",
            error
        );

        // Do not start polling if recovery could not be completed.
        process.exitCode = 1;
        server.close();
    }
};

void startWorkerSafely();


let isShuttingDown = false;

const shutdown = (signal) => {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(`${signal} received. Shutting down gracefully...`);

    // Stop accepting new HTTP requests.
    server.close(async () => {
        try {
            // Stop worker polling and wait for its active job.
            if(stopImportWorker){
                await stopImportWorker();
            }

            // Close PostgreSQL only after the worker finishes.
            await pool.end();

            console.log("PostgreSQL pool closed.");
            process.exit(0);
        } catch (error) {
            console.error("Error during shutdown:", error);
            process.exit(1);
        }
    });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));