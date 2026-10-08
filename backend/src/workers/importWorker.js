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

const processNextImportJob = async () => {
    const result = await pool.query(
    `
    SELECT
        id,
        original_filename,
        file_path,
        status
    FROM import_jobs
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 1
    `
);

    if (result.rows.length === 0) {
        return null;
    }

    const job = result.rows[0];

    await pool.query(
        `
        UPDATE import_jobs
        SET
            status = 'processing',
            started_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [job.id]
    );

    return job;
};

// Process one CSV import as a stream, validate rows,
// write errors directly to an error report, and insert valid
// rows into PostgreSQL in batches of 500.

const processCsvImport = async (job) => {
    const BATCH_SIZE = 500;

    let total = 0;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    let validBatch = [];

    const errorReport = createErrorReport(job.id);

    const loanAccountTracker =
        createLoanAccountTracker();

    const parser = fs
        .createReadStream(job.file_path)
        .pipe(
            parse({
                columns: true,
                skip_empty_lines: true,
                trim: true,
                delimiter: ","
            })
        );

    const processBatch = async (batch) => {
        if (batch.length === 0) {
            return;
        }

        const loanAccounts = batch.map(
            (item) =>
                String(item.loan_account_no).trim()
        );

        const existingAccounts =
            await findExistingLoanAccounts(
                loanAccounts
            );

        const rowsToInsert = [];

        for (const item of batch) {
            const loanAccountNo =
                String(item.loan_account_no).trim();

            if (existingAccounts.has(loanAccountNo)) {
                failed++;
                processed++;

                errorReport.writeError(
                    item.__rowNumber,
                    [
                        `loan_account_no ${loanAccountNo} already exists`
                    ]
                );

                continue;
            }

            rowsToInsert.push(item);
        }

        if (rowsToInsert.length === 0) {
            return;
        }

        const insertedAccounts =
            await insertLeadBatch(rowsToInsert);

        succeeded += insertedAccounts.length;
        processed += rowsToInsert.length;
    };

    try {
        for await (const row of parser) {
            total++;

            const rowNumber = total + 1;

            const rowErrors =
                validateImportRow(row);

            if (rowErrors.length === 0) {
                const isUniqueInFile =
                    loanAccountTracker.checkAndAdd(
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

                errorReport.writeError(
                    rowNumber,
                    rowErrors
                );

                continue;
            }

            row.__rowNumber = rowNumber;

            validBatch.push(row);

            if (validBatch.length >= BATCH_SIZE) {
    await processBatch(validBatch);

    validBatch = [];

    await updateImportProgress(job.id, {
        total,
        processed,
        succeeded,
        failed
    });
}
        }

        if (validBatch.length > 0) {
    await processBatch(validBatch);

    validBatch = [];

    await updateImportProgress(job.id, {
        total,
        processed,
        succeeded,
        failed
    });
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
    }  catch (error) {
    try {
        await errorReport.close();
    } catch (closeError) {
        console.error(
            "[Import Worker] Error closing error report:",
            closeError
        );
    }

    await failImportJob(job.id);

    throw error;
}
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
// process them in the background.

const startImportWorker = () => {
    setInterval(async () => {
        try {
            const job = await processNextImportJob();

            if (!job) {
                return;
            }

            console.log(
                `[Import Worker] Started job ${job.id} (${job.original_filename})`
            );

            const result =
                await processCsvImport(job);

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
        }
    }, 5000);
};

module.exports = {
    processNextImportJob,
    startImportWorker,
    readCsvFile,
    processCsvImport
};