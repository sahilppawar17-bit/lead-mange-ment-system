
/*
 * Task 7: Stream validation errors into a CSV report while respecting
 * writable-stream backpressure to help control memory usage.
 */

const fs = require("fs");
const path = require("path");
const { once } = require("events");

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

    let streamError = null;

    // Remember stream errors so write and close operations can detect them.
    stream.on("error", (error) => {
        streamError = error;
    });

    const writeLine = async (line) => {
        if (streamError) {
            throw streamError;
        }

        // Wait for the stream to drain when its internal buffer is full.
        if (!stream.write(line)) {
            await once(stream, "drain");
        }

        if (streamError) {
            throw streamError;
        }
    };

    const writeError = async (rowNumber, reasons) => {
        const reason = reasons.join("; ");
        const escapedReason = `"${reason.replace(/"/g, '""')}"`;

        await writeLine(`${rowNumber},${escapedReason}\n`);
    };

    
/* Close the error-report stream safely and avoid
 * waiting for the same stream to finish more than once.*/
let closePromise = null;

const close = () => {
    // Reuse the existing close operation if already started.
    if (closePromise) {
        return closePromise;
    }

    closePromise = (async () => {
        if (streamError) {
            stream.destroy();
            throw streamError;
        }

        // Register the finish listener before ending the stream.
        const finished = once(stream, "finish");

        stream.end();

        await finished;

        if (streamError) {
            throw streamError;
        }
    })();

    return closePromise;
};


    // Write the CSV header before the report is used.
    const ready = writeLine("row_number,error_reason\n");

    return {
        filePath,
        ready,
        writeError,
        close
    };
};

module.exports = { createErrorReport };
