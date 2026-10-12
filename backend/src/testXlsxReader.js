// Task 7: Test streaming XLSX parsing and conversion into import rows.

const path = require("path");

const {
    readXlsxRows
} = require("./services/xlsxImportService");

const runTest = async () => {
    try {
        const filePath = path.join(
            process.cwd(),
            "task7-live-test.xlsx"
        );

        let rowNumber = 0;

        for await (
            const row of readXlsxRows(filePath)
        ) {
            rowNumber++;

            console.log(
                `Row ${rowNumber}:`
            );

            console.log(row);
        }

        console.log(
            "\nXLSX streaming test completed."
        );
    } catch (error) {
        console.error(
            "XLSX reader test failed:",
            error
        );
    }
};

runTest();