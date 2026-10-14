// Receive an uploaded CSV/XLSX file, create an import job,
// and return 202 Accepted without processing the file during the request.

const { randomUUID } = require("crypto");
const pool = require("../db");

//Utilities for safely locating and downloading import error reports.
const fs = require("fs");
const path = require("path");

//Service used to retrieve import job progress.
const {getImportJob} = require("../services/importJobService");

// BullMQ queue used to schedule background lead imports.
const { importQueue } = require("../queues/importQueue");

// POST /api/imports

const createImport = async (req, res, next) => {
    let jobId;
    let filePath;

    try {
        // Check that Multer received an uploaded file.
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "FILE_REQUIRED",
                    message: "Please upload a CSV or XLSX file."
                }
            });
        }

        // Keep the uploaded file path for cleanup if enqueueing fails.
        filePath = req.file.path;

        // Generate a unique ID shared by PostgreSQL and BullMQ.
        jobId = randomUUID();

        // Get the authenticated user's ID.
        const uploadedBy = req.user?.userId || null;

        // Create the database job before adding it to the queue.
        await pool.query(
            `
            INSERT INTO import_jobs (
                id,
                original_filename,
                file_path,
                status,
                uploaded_by
            )
            VALUES ($1, $2, $3, $4, $5)
            `,
            [
                jobId,
                req.file.originalname,
                filePath,
                "queued",
                uploadedBy
            ]
        );

        
        try {
            // Submit the job using the same ID as its database record.
            await importQueue.add(
                "process-import",
                { jobId },
                { jobId }
            );
        } catch (queueError) {
            // Redis may have accepted the job before the connection failed.
            let queuedJob;
            let lookupSucceeded = false;

            try {
                // Check whether BullMQ contains the submitted job.
                queuedJob = await importQueue.getJob(jobId);
                lookupSucceeded = true;
            } catch (lookupError) {
                // The queue state is unknown if Redis cannot be reached.
                console.error(
                    "[Import Controller] Could not verify queue job:",
                    lookupError
                );
            }

            if (lookupSucceeded && queuedJob) {
                // Preserve the file and database record for an accepted job.
                console.warn(
                    `[Import Controller] Job ${jobId} exists in BullMQ ` +
                    "despite an enqueue error."
                );

                // Let the client check the existing job instead of retrying.
                return res.status(202).json({
                    success: true,
                    data: {
                        jobId,
                        status: "queued",
                        message:
                            "The job exists in the queue. Check its status."
                    }
                });
            }

            if (lookupSucceeded && queuedJob === null) {
                // Mark failed only when Redis confirms the job is absent.
                try {
                    await pool.query(
                        `
                        UPDATE import_jobs
                        SET status = 'failed',
                            completed_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                          AND status = 'queued'
                        `,
                        [jobId]
                    );

                    // Remove the file only after confirming no queued job exists.
                    await fs.promises.unlink(filePath).catch((cleanupError) => {
                        console.error(
                            "[Import Controller] Could not remove upload:",
                            cleanupError
                        );
                    });
                } catch (databaseError) {
                    // Preserve the original queue error for reporting.
                    console.error(
                        "[Import Controller] Could not reconcile job:",
                        databaseError
                    );
                }
            } else if (!lookupSucceeded) {
                // Do not delete the file when queue acceptance is uncertain.
                console.error(
                    `[Import Controller] Queue state for job ${jobId} ` +
                    "is unknown. Preserving the database record and file."
                );
            }

            // Pass the original enqueue error to Express.
            throw queueError;
        }


        // Return HTTP 202 only after BullMQ accepts the job.
        return res.status(202).json({
            success: true,
            data: {
                jobId,
                status: "queued"
            }
        });
    } catch (error) {
        // If a database insert failed before a job was created,
        // remove the uploaded file to avoid leaving an orphan behind.
        if (!jobId && filePath) {
            try {
                await fs.promises.unlink(filePath);
            } catch (cleanupError) {
                // Log cleanup failures without hiding the original error.
                console.error(
                    "[Import Controller] Could not clean up upload:",
                    cleanupError
                );
            }
        }

        // Let the existing Express error handler format the response.
        return next(error);
    }
};

// Return the current progress of a background import job.

const getImportStatus = async (req, res, next) => {
    try {
        const { jobId } = req.params;

        const job = await getImportJob(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "IMPORT_JOB_NOT_FOUND",
                    message: "Import job not found."
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                jobId: job.id,
                filename: job.original_filename,
                status: job.status,
                total: job.total,
                processed: job.processed,
                succeeded: job.succeeded,
                failed: job.failed,
                errors: Array.isArray(job.errors)? job.errors.slice(0, 100): [],
                errorReportUrl: job.error_report_path? `/api/imports/${job.id}/errors`: null,
                createdAt: job.created_at,
                startedAt: job.started_at,
                completedAt: job.completed_at
            }
        });
    } catch (error) {
        return next(error);
    }
};

// Download the error report generated for an import job.

const downloadImportErrors = async (req, res, next) => {
    try {
        const { jobId } = req.params;

        const job = await getImportJob(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "IMPORT_JOB_NOT_FOUND",
                    message: "Import job not found."
                }
            });
        }

        if (!job.error_report_path) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "ERROR_REPORT_NOT_AVAILABLE",
                    message: "No error report is available for this import."
                }
            });
        }

        const reportPath = path.resolve(
            job.error_report_path
        );

        if (!fs.existsSync(reportPath)) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "ERROR_REPORT_NOT_FOUND",
                    message: "The error report file could not be found."
                }
            });
        }

        return res.download(
            reportPath,
            `${jobId}-errors.csv`
        );
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    createImport,
    getImportStatus,
    downloadImportErrors
};