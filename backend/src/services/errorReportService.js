//Stream import validation errors directly to an error-report CSV file.

const fs = require("fs");
const path = require("path");

const createErrorReport = (jobId) => {
    const reportDirectory = path.join(
        process.cwd(),
        "storage",
        "error-reports"
    );

    fs.mkdirSync(reportDirectory, { recursive: true });

    const filePath = path.join(
        reportDirectory,
        `${jobId}-errors.csv`
    );

    const stream = fs.createWriteStream(filePath, {
        encoding: "utf8"
    });

    stream.write("row_number,error_reason\n");

    const writeError = (rowNumber, reasons) => {
        const reason = reasons.join("; ");

        const escapedReason =
            `"${reason.replace(/"/g, '""')}"`;

        stream.write(
            `${rowNumber},${escapedReason}\n`
        );
    };

    const close = () => {
        return new Promise((resolve, reject) => {
            stream.end(() => {
                resolve();
            });

            stream.on("error", reject);
        });
    };

    return {
        filePath,
        writeError,
        close
    };
};

module.exports = {
    createErrorReport
};