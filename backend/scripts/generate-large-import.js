// Task 7: Generate a large CSV file containing 200,000 unique
// lead records for testing streaming imports and batch processing.

const fs = require("fs");
const path = require("path");

const outputDirectory = path.join(process.cwd(), "storage", "test-data");
const outputFile = path.join(
    outputDirectory,
    "task7-200k-test.csv"
);

fs.mkdirSync(outputDirectory, { recursive: true });

const stream = fs.createWriteStream(outputFile, {
    encoding: "utf8"
});

stream.write(
    "full_name,age,phone_mobile,country_code,loan_account_no,next_emi_date_dom,emi_amount,branch_code,lead_status\n"
);

const TOTAL_ROWS = 200000;

for (let i = 1; i <= TOTAL_ROWS; i++) {
    const phoneNumber = String(9000000000 + i);

    const row = [
        `Test Customer ${i}`,
        25 + (i % 40),
        phoneNumber,
        "+91",
        `BULKTEST${String(i).padStart(6, "0")}`,
        "2026-11-15",
        10000 + (i % 10000),
        ["BLR01", "DEL01", "HYD01", "MUM01", "PUN01"][i % 5],
        ["High", "Medium", "Low"][i % 3]
    ];

    stream.write(row.join(",") + "\n");
}

stream.end(() => {
    console.log(`Generated ${TOTAL_ROWS} rows.`);
    console.log(`File: ${outputFile}`);
});
