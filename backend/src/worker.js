
require("dotenv").config();

const pool = require("./db");
const { importQueue, getRedisConnection } =
    require("./queues/importQueue");
const { Worker } = require("bullmq");
const {
    processCsvImport,
    processXlsxImport
} = require("./workers/importWorker");

const worker = new Worker(
    "lead-imports",
    async (queueJob) => {
        const { jobId } = queueJob.data;

        if (!jobId) {
            throw new Error("Missing database import job ID.");
        }

        // Claim only jobs that are still queued.
        const result = await pool.query(
            `UPDATE import_jobs
             SET status = 'processing',
                 started_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND status = 'queued'
             RETURNING id, original_filename, file_path`,
            [jobId]
        );

        const job = result.rows[0];

        if (!job) {
            console.warn(
                `[Import Worker] Skipping unavailable job ${jobId}`
            );
            return;
        }

        try {
            const path = require("path");
            const extension = path
                .extname(job.original_filename)
                .toLowerCase();

            if (extension === ".csv") {
                await processCsvImport(job);
            } else if (extension === ".xlsx") {
                await processXlsxImport(job);
            } else {
                throw new Error(
                    `Unsupported import type: ${extension}`
                );
            }

            console.log(`[Import Worker] Finished job ${jobId}`);
        } catch (error) {
            // Do not overwrite a job already completed by the processor.
            try {
                await pool.query(
                    `UPDATE import_jobs
                     SET status = 'failed',
                         completed_at = CURRENT_TIMESTAMP
                     WHERE id = $1 AND status = 'processing'`,
                    [jobId]
                );
            } catch (dbError) {
                console.error(
                    "[Import Worker] Could not update job status:",
                    dbError.message
                );
            }

            throw error;
        }
    },
    {
        connection: getRedisConnection(),
        concurrency: Number(
            process.env.IMPORT_WORKER_CONCURRENCY || 1
        )
    }
);

worker.on("failed", (job, error) => {
    console.error(
        `[Import Worker] Job ${job?.id || "unknown"} failed:`,
        error.message
    );
});

worker.on("error", (error) => {
    console.error("[Import Worker] Error:", error.message);
});

// Recover jobs saved in PostgreSQL but not submitted to BullMQ.
async function recoverQueuedImports() {
    try {
        const result = await pool.query(
            `SELECT id
             FROM import_jobs
             WHERE status = 'queued'
               AND created_at <
                   CURRENT_TIMESTAMP - INTERVAL '15 seconds'
             ORDER BY created_at ASC
             LIMIT 50`
        );

        for (const job of result.rows) {
            const existingJob = await importQueue.getJob(job.id);

            if (!existingJob) {
                await importQueue.add(
                    "process-import",
                    { jobId: job.id },
                    { jobId: job.id }
                );

                console.log(`[Import Recovery] Re-enqueued ${job.id}`);
            }
        }
    } catch (error) {
        console.error(
            "[Import Recovery] Check failed:",
            error.message
        );
    }
}

const recoveryTimer = setInterval(
    recoverQueuedImports,
    15000
);

recoverQueuedImports();

console.log("[Import Worker] Background processing started.");

let shuttingDown = false;

async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`[Import Worker] ${signal}: shutting down`);

    clearInterval(recoveryTimer);

    try {
        // Stop taking new jobs and wait for active work to finish.
        await worker.close();

        await importQueue.close();
        await pool.end();

        console.log("[Import Worker] Shutdown complete.");
        process.exit(0);
    } catch (error) {
        console.error("[Import Worker] Shutdown failed:", error);
        process.exit(1);
    }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
