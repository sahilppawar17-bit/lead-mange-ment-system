// Receive an uploaded CSV/XLSX file, create an import job,
// and return 202 Accepted without processing the file during the request.

const { randomUUID } = require("crypto");
const pool = require("../db");

//Service used to retrieve import job progress.
const {getImportJob} = require("../services/importJobService");

// POST /api/imports
const createImport = async (req, res, next) => {

    try {
// 1. Check that Multer actually received a file
        
        if (!req.file) {

            return res.status(400).json({
                success: false,
                error: {
                    code: "FILE_REQUIRED",
                    message: "Please upload a CSV or XLSX file."
                }
            });
        }

        // 2. Generate a unique ID for this import job
        const jobId = randomUUID();


        // 3. Get the authenticated user ID
        const uploadedBy = req.user?.userId || null;
        
        // 4. Store the job in PostgreSQL
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
                req.file.path,
                "queued",
                uploadedBy
            ]
        );

        // 5. Return immediately

        return res.status(202).json({
            success: true,
            data: {
                jobId,
                status: "queued"
            }
        });

    } catch (error) {
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
                errorReportPath: job.error_report_path,
                createdAt: job.created_at,
                startedAt: job.started_at,
                completedAt: job.completed_at
            }
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    createImport,
    getImportStatus
};