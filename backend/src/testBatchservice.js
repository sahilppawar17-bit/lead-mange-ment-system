// Task 7: Test batch insertion of validated import rows into PostgreSQL.

const { insertLeadBatch } = require("./services/batchService");

const testRows = [
    {
        full_name: "Rahul Sharma",
        age: "30",
        phone_mobile: "9876543210",
        country_code: "+91",
        loan_account_no: "TEST002",
        next_emi_date_dom: "2026-11-10",
        emi_amount: "15000",
        branch_code: "MUM01",
        lead_status: "High"
    }
];

const runTest = async () => {
    try {
        const insertedCount = await insertLeadBatch(testRows);

        console.log(
            `Batch insert completed. Rows inserted: ${insertedCount}`
        );
    } catch (error) {
        console.error("Batch insert failed:", error);
    } finally {
        process.exit(0);
    }
};

runTest();
