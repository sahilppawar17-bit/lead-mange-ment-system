require("dotenv").config();
const cors = require("cors");
const express = require("express");
const requestTimeout = require("./middleware/requestTimeout");
//Import routes for CSV/XLSX lead uploads.
const importRoutes = require("./routes/importRoutes");

//Access the shared PostgreSQL pool for graceful shutdown.
const pool = require("./db");
const fileRoutes = require("./routes/fileRoutes");

const leadRoutes = require("./routes/leadRoutes");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");

// Start the BullMQ worker instead of the old PostgreSQL polling worker.
const { startBullMQImportWorker } = require("./workers/bullmqImportWorker");

// Import the queue so its Redis connection can also close during shutdown.
const { importQueue } = require("./queues/importQueue");

const app = express();

const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());
app.use(requestTimeout);
app.use("/api/auth", authRoutes);

app.use("/api/leads", leadRoutes);

//Register the lead import API.
app.use("/api/imports", importRoutes);

// New generic file upload service
app.use("/api/files", fileRoutes);
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


// Start the BullMQ worker after the HTTP server has been created.
let importWorker;

try {
    importWorker = startBullMQImportWorker();
    console.log("[BullMQ Import Worker] Started.");
} catch (error) {
    // Report startup errors rather than silently running without a worker.
    console.error("[BullMQ Import Worker] Could not start:", error);
    process.exitCode = 1;
}


 // Automatically recover queued imports that were not added to BullMQ.
 const recoverQueuedImports = async () => {
     try {
         // Find older queued jobs that may have missed queue submission.
         const result = await pool.query(`
             SELECT id
             FROM import_jobs
             WHERE status = 'queued'
               AND created_at < CURRENT_TIMESTAMP - INTERVAL '15 seconds'
             ORDER BY created_at ASC
             LIMIT 50
         `);

         // Re-submit each job using its existing database ID.
         for (const job of result.rows) {
             // Check Redis before attempting to add the job.
             const existingJob = await importQueue.getJob(job.id);

             // Do not add a duplicate when BullMQ already has the job.
             if (!existingJob) {
                 await importQueue.add(
                     "process-import",
                     { jobId: job.id },
                     { jobId: job.id }
                 );

                 console.log(`[Import Recovery] Re-enqueued job ${job.id}`);
             }
         }
     } catch (error) {
         // Retry during the next cycle if PostgreSQL or Redis is unavailable.
         console.error(
             "[Import Recovery] Recovery check failed:",
             error.message
         );
     }
 };

 // Check once at startup and repeat every 15 seconds.
 recoverQueuedImports();
 const importRecoveryTimer = setInterval(recoverQueuedImports, 15000);
// Confirm that automatic queued-job recovery is enabled.
console.log("[Import Recovery] Automatic recovery enabled.");


let isShuttingDown = false;

const shutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`${signal} received. Shutting down API...`);

    server.close(async () => {
        try {
            // This process owns its own PostgreSQL pool.
            await pool.end();

            console.log("API server and PostgreSQL pool closed.");
            process.exit(0);
        } catch (error) {
            console.error("API shutdown failed:", error);
            process.exit(1);
        }
    });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

