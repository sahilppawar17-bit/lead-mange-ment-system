// Task 7: Test import-row validation independently before
// connecting validation to the background import worker.

const { validateImportRow } = require("./validators/importValidator");

const validRow = {
    full_name: "Rahul Sharma",
    age: "30",
    phone_mobile: "9876543210",
    country_code: "+91",
    loan_account_no: "TEST002",
    next_emi_date_dom: "2026-11-10",
    emi_amount: "15000",
    branch_code: "BR001",
    lead_status: "High"
};

const invalidRow = {
    full_name: "",
    age: "15",
    phone_mobile: "98765",
    country_code: "+91",
    loan_account_no: "",
    next_emi_date_dom: "wrong-date",
    emi_amount: "-500",
    branch_code: "XYZ99",
    lead_status: "Unknown"
};

console.log("Valid row errors:");
console.log(validateImportRow(validRow));

console.log("\nInvalid row errors:");
console.log(validateImportRow(invalidRow));