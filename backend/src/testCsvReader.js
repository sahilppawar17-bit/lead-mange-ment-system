// Task 7: Test streamed CSV parsing, row validation,
// and duplicate detection before database insertion.

const { readCsvFile } = require("./workers/importWorker");
const path = require("path");

const filePath = path.join(
    process.cwd(),
    "storage",
    "imports",
    "1791372132988-147547256.csv"
);

const runTest = async () => {
    try {
        const result = await readCsvFile(filePath);

        console.log("CSV test completed.");
        console.log("Total rows:", result.rowCount);
        console.log("Valid rows:", result.validRows.length);
        console.log("Invalid rows:", result.errors.length);

        console.log("\nErrors:");
        console.log(result.errors);

        console.log("\nValid rows:");
        console.log(result.validRows);
    } catch (error) {
        console.error("CSV test failed:", error);
    }
};

runTest();