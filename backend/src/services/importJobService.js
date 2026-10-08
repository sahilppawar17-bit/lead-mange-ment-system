//Update and retrieve background import job progress.

const pool = require("../db");

const updateImportProgress = async (jobId, progress) => {
    await pool.query(
        `
        UPDATE import_jobs
        SET
            total = $1,
            processed = $2,
            succeeded = $3,
            failed = $4
        WHERE id = $5
        `,
        [
            progress.total,
            progress.processed,
            progress.succeeded,
            progress.failed,
            jobId
        ]
    );
};

const completeImportJob = async (
    jobId,
    progress,
    errorReportPath
) => {
    await pool.query(
        `
        UPDATE import_jobs
        SET
            status = 'completed',
            total = $1,
            processed = $2,
            succeeded = $3,
            failed = $4,
            error_report_path = $5,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = $6
        `,
        [
            progress.total,
            progress.processed,
            progress.succeeded,
            progress.failed,
            errorReportPath,
            jobId
        ]
    );
};

const failImportJob = async (jobId) => {
    await pool.query(
        `
        UPDATE import_jobs
        SET
            status = 'failed',
            completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [jobId]
    );
};

const getImportJob = async (jobId) => {
    const result = await pool.query(
        `
        SELECT
            id,
            original_filename,
            status,
            total,
            processed,
            succeeded,
            failed,
            error_report_path,
            created_at,
            started_at,
            completed_at
        FROM import_jobs
        WHERE id = $1
        `,
        [jobId]
    );

    return result.rows[0] || null;
};

module.exports = {
    updateImportProgress,
    completeImportJob,
    failImportJob,
    getImportJob
};