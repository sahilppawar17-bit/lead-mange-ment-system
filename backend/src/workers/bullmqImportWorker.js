
const { Worker } = require("bullmq");
const path = require("path");

const pool = require("../db");

// Reuse the existing streaming CSV/XLSX import pipeline.
const {
    processCsvImport,
    processXlsxImport,
} = require("./importWorker");

// Reuse the Redis connection configuration from the queue.
const { getRedisConnection } = require("../queues/importQueue");

// Start a worker that consumes jobs from the lead-imports queue.
const startBullMQImportWorker = () => {
    const worker = new Worker(
        "lead-imports",
        async (queueJob) => {
            const { jobId } = queueJob.data;

            // Reject malformed queue jobs.
            if (!jobId) {
                throw new Error("Missing database import job ID.");
            }

            // Atomically claim the database job only if it is still queued.
            // This prevents two workers from claiming the same import.
            const result = await pool.query(
                `
                UPDATE import_jobs
                SET status = 'processing',
                    started_at = CURRENT_TIMESTAMP
                WHERE id = $1
                  AND status = 'queued'
                RETURNING id, original_filename, file_path, status
                `,
                [jobId]
            );

            const job = result.rows[0];

            // Skip jobs already processed or no longer eligible.
            if (!job) {
                console.warn(
                    `[BullMQ Import Worker] Skipping job ${jobId}: ` +
                    "database job is missing or is not queued."
                );
                return;
            }

            try {
                // Select the existing streaming processor by file extension.
                const extension = path
                    .extname(job.original_filename)
                    .toLowerCase();

                console.log(
                    `[BullMQ Import Worker] Started ${job.id}: ` +
                    job.original_filename
                );

                if (extension === ".csv") {
                    await processCsvImport(job);
                } else if (extension === ".xlsx") {
                    await processXlsxImport(job);
                } else {
                    throw new Error(
                        `Unsupported import file type: ${extension}`
                    );
                }

                // The existing processors update progress and completion status.
                console.log(
                    `[BullMQ Import Worker] Finished job ${job.id}`
                );
            } catch (error) {
                // Mark the database job failed if processing did not finish.
                // The condition avoids overwriting a completed job.
                try {
                    await pool.query(
                        `
                        UPDATE import_jobs
                        SET status = 'failed',
                            completed_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                          AND status = 'processing'
                        `,
                        [job.id]
                    );
                } catch (databaseError) {
                    console.error(
                        "[BullMQ Import Worker] Could not update job status:",
                        databaseError
                    );
                }

                // Propagate the error so BullMQ records the job failure.
                throw error;
            }
        },
        {
            // Use the same Redis settings as the producer queue.
            connection: getRedisConnection(),

            // Keep large imports from running concurrently by default.
            concurrency: Number(
                process.env.IMPORT_WORKER_CONCURRENCY || 1
            ),
        }
    );

    // Log jobs that fail and any worker-level errors.
    worker.on("failed", (job, error) => {
        console.error(
            `[BullMQ Import Worker] Job ${job?.id || "unknown"} failed:`,
            error
        );
    });

    worker.on("error", (error) => {
        console.error("[BullMQ Import Worker] Worker error:", error);
    });

    // Return the worker so the application can shut it down gracefully.
    return worker;
};

module.exports = { startBullMQImportWorker };
