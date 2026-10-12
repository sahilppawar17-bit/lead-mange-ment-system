// Background worker that finds queued import jobs
// and prepares them for asynchronous CSV/XLSX processing.

const fs = require("fs");
const { parse } = require("csv-parse");
const pool = require("../db");

const { validateImportRow } = require("../validators/importValidator");
const { createLoanAccountTracker } = require("../services/importDuplicateTracker");

const {findExistingLoanAccounts} = require("../services/importDuplicateService");

const {insertLeadBatch} = require("../services/batchService");

const {createErrorReport } = require("../services/errorReportService")

const {updateImportProgress, completeImportJob, failImportJob} = require("../services/importJobService")

// Stream XLSX rows when the uploaded file has an .xlsx extension.
const {readXlsxRows} = require("../services/xlsxImportService");

//Prevent the in-process import worker from processing
// multiple large import jobs concurrently.
let isWorkerBusy = false;

const processNextImportJob = async () => {
    const result = await pool.query(
        `
        WITH next_job AS (
            SELECT id
            FROM import_jobs
            WHERE status = 'queued'
            ORDER BY created_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        )
        UPDATE import_jobs AS jobs
        SET
            status = 'processing',
            started_at = CURRENT_TIMESTAMP
        FROM next_job
        WHERE jobs.id = next_job.id
        RETURNING
            jobs.id,
            jobs.original_filename,
            jobs.file_path,
            jobs.status
        `
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
};

// Process CSV/XLSX rows through one common validation,
// duplicate-checking, batching, and error-reporting pipeline.

const processImportRows = async (
    job,
    rowStream
) => {
    const BATCH_SIZE = 500;

    let total = 0;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    let validBatch = [];

    const errorReport =
        createErrorReport(job.id);

    await errorReport.ready;

    const loanAccountTracker =
        createLoanAccountTracker();


/* Process a batch of valid rows, reject existing loan accounts,
 * and record any database-level duplicate conflicts in the error report.*/
const processBatch = async (batch) => {
    if (batch.length === 0) {
        return;
    }

    const loanAccounts = batch.map((item) =>
        String(item.loan_account_no).trim()
    );

    const existingAccounts = await findExistingLoanAccounts(
        loanAccounts
    );

    const rowsToInsert = [];

    // Reject loan accounts that already exist before insertion.
    for (const item of batch) {
        const loanAccountNo = String(item.loan_account_no).trim();

        if (existingAccounts.has(loanAccountNo)) {
            failed++;
            processed++;

            await errorReport.writeError(
                item.__rowNumber,
                [`loan_account_no ${loanAccountNo} already exists`]
            );

            continue;
        }

        rowsToInsert.push(item);
    }

    if (rowsToInsert.length === 0) {
        return;
    }

    // Insert remaining rows and identify which ones PostgreSQL accepted.
    const insertedAccounts = await insertLeadBatch(rowsToInsert);
    const insertedAccountSet = new Set(insertedAccounts);

    succeeded += insertedAccounts.length;

    // Count every attempted row and report rows skipped by a database conflict.
    for (const item of rowsToInsert) {
        const loanAccountNo = String(item.loan_account_no).trim();

        processed++;

        if (!insertedAccountSet.has(loanAccountNo)) {
            failed++;

            await errorReport.writeError(
                item.__rowNumber,
                [`loan_account_no ${loanAccountNo} already exists`]
            );
        }
    }
};


    try {
        for await (const row of rowStream) {
            total++;

            const rowNumber =
                total + 1;

            const rowErrors =
                validateImportRow(row);

            if (rowErrors.length === 0) {
                const isUniqueInFile =
                    loanAccountTracker
                        .checkAndAdd(
                            row.loan_account_no
                        );

                if (!isUniqueInFile) {
                    rowErrors.push(
                        "duplicate loan_account_no in this import file"
                    );
                }
            }

            if (rowErrors.length > 0) {
                failed++;
                processed++;

              await errorReport.writeError(
                    rowNumber,
                    rowErrors
                );

                continue;
            }

            row.__rowNumber =
                rowNumber;

            validBatch.push(row);

            if (
                validBatch.length >=
                BATCH_SIZE
            ) {
                await processBatch(
                    validBatch
                );

                validBatch = [];

                await updateImportProgress(
                    job.id,
                    {
                        total,
                        processed,
                        succeeded,
                        failed
                    }
                );
            }
        }

        if (validBatch.length > 0) {
            await processBatch(
                validBatch
            );

            validBatch = [];

            await updateImportProgress(
                job.id,
                {
                    total,
                    processed,
                    succeeded,
                    failed
                }
            );
        }

        await errorReport.close();

        await completeImportJob(
            job.id,
            {
                total,
                processed,
                succeeded,
                failed
            },
            errorReport.filePath
        );

        return {
            total,
            processed,
            succeeded,
            failed,
            errorReportPath:
                errorReport.filePath
        };
    } catch (error) {
        try {
            await errorReport.close();
        } catch (closeError) {
            console.error(
                "[Import Worker] Error closing error report:",
                closeError
            );
        }

        await failImportJob(
            job.id
        );

        throw error;
    }
};

//Process a CSV import using the common import pipeline.

const processCsvImport = async (job) => {
    const rowStream =
        fs
            .createReadStream(
                job.file_path
            )
            .pipe(
                parse({
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    delimiter: ","
                })
            );

    return processImportRows(
        job,
        rowStream
    );
};

// Process an XLSX import using the common streaming import pipeline.

const processXlsxImport = async (job) => {
    const rowStream =
        readXlsxRows(
            job.file_path
        );

    return processImportRows(
        job,
        rowStream
    );
};

//Read a CSV import file as a stream and process one row at a time.

const readCsvFile = async (filePath) => {
    return new Promise((resolve, reject) => {
        let rowCount = 0;
        const validRows = [];
        const errors = [];

        const loanAccountTracker = createLoanAccountTracker();

        const parser = fs
            .createReadStream(filePath)
            .pipe(
                parse({
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    delimiter: ","
                })
            );

        parser.on("data", (row) => {
            rowCount++;

            const rowErrors = validateImportRow(row);

            if (rowErrors.length === 0) {
                const isUniqueInFile =
                    loanAccountTracker.checkAndAdd(row.loan_account_no);

                if (!isUniqueInFile) {
                    rowErrors.push(
                        "duplicate loan_account_no in this import file"
                    );
                }
            }

            if (rowErrors.length > 0) {
                errors.push({
                    rowNumber: rowCount + 1,
                    reasons: rowErrors
                });

                return;
            }

            validRows.push(row);
        });

        parser.on("end", () => {
            resolve({
                rowCount,
                validRows,
                errors
            });
        });

        parser.on("error", (error) => {
            reject(error);
        });
    });
};

// Continuously look for queued import jobs and
// process them in the background without overlapping jobs.

const startImportWorker = () => {
    let isStopping = false;
    let activeWorkerTask = null;

    const runWorker = async () => {
        if (isStopping || isWorkerBusy) {
            return;
        }

        isWorkerBusy = true;

        activeWorkerTask = (async () => {
    let job = null;

    try {
        job = await processNextImportJob();

        if (!job) {
            return;
        }

        console.log(
            `[Import Worker] Started job ${job.id} (${job.original_filename})`
        );

        const extension = require("path")
            .extname(job.original_filename)
            .toLowerCase();

        let result;

        if (extension === ".csv") {
            result = await processCsvImport(job);
        } else if (extension === ".xlsx") {
            result = await processXlsxImport(job);
        } else {
            throw new Error(
                `Unsupported import file type: ${extension}`
            );
        }

        console.log(
            `[Import Worker] Completed job ${job.id}`
        );

        console.log(
            `[Import Worker] Total: ${result.total}, ` +
            `Succeeded: ${result.succeeded}, ` +
            `Failed: ${result.failed}`
        );
    } catch (error) {
        console.error(
            "[Import Worker] Error:",
            error
        );

        // Mark the job failed if it was claimed but did not
        // reach a completed or failed state through its processor.
        if (job) {
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
            } catch (updateError) {
                console.error(
                    "[Import Worker] Could not mark job failed:",
                    updateError
                );
            }
        }
    } finally {
        isWorkerBusy = false;
        activeWorkerTask = null;
    }
})();
        await activeWorkerTask;
    };

    const workerInterval = setInterval(() => {
        void runWorker();
    }, 5000);

    return async () => {
        isStopping = true;
        clearInterval(workerInterval);

        if (activeWorkerTask) {
            console.log(
                "[Import Worker] Waiting for active import to finish..."
            );

            await activeWorkerTask;
        }

        console.log("[Import Worker] Stopped.");
    };
};

module.exports = {
    processNextImportJob,
    startImportWorker,
    readCsvFile,
    processCsvImport,
    processXlsxImport,
    processImportRows
};