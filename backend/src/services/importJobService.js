//Update and retrieve background import job progress.

const pool = require("../db");

const fs = require("fs");
const readline = require("readline");

const { parse } = require("csv-parse");

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

const getImportErrors = async (reportPath, limit = 100) => {
if (!reportPath || !fs.existsSync(reportPath)) {
return [];
}

const errors = [];
const input = fs.createReadStream(reportPath);

const parser = input.pipe(
    parse({
        columns: ["row_number", "error_reason"],
        from_line: 2,
        relax_column_count: true,
        skip_empty_lines: true
    })
);

try {
    for await (const record of parser) {
        errors.push({
            rowNumber: Number(record.row_number),
            reason: record.error_reason
        });

        if (errors.length >= limit) {
            break;
        }
    }
} finally {
    input.destroy();
    parser.destroy();
}

return errors;

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

    const job = result.rows[0];

    if (!job) {
        return null;
    }

    job.errors = await getImportErrors(job.error_report_path);

    return job;
};

/* Mark jobs left in processing state by a previous server
 * instance as failed, avoiding automatic re-import of partial data.*/
const recoverAbandonedImportJobs = async () => {
    const result = await pool.query(`
        UPDATE import_jobs
        SET
            status = 'failed',
            completed_at = COALESCE(
                completed_at,
                CURRENT_TIMESTAMP
            )
        WHERE status = 'processing'
        RETURNING id, original_filename
    `);

    return result.rows;
};

module.exports = {
    updateImportProgress,
    completeImportJob,
    failImportJob,
    getImportJob,
    recoverAbandonedImportJobs
};