// Task 7: Test streaming creation of the import error report.

const {
    createErrorReport
} = require("./services/errorReportService");

const runTest = async () => {
    try {
        const report =
            createErrorReport("test-job-001");

        report.writeError(
            3,
            [
                "age must be a valid integer between 18 and 120"
            ]
        );

        report.writeError(
            7,
            [
                "branch_code is not a valid branch code",
                "lead_status must be High, Medium, or Low"
            ]
        );

        await report.close();

        console.log("Error report created:");
        console.log(report.filePath);
    } catch (error) {
        console.error(
            "Error report test failed:",
            error
        );
    }
};

runTest();