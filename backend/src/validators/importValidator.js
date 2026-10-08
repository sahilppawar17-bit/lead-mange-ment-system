//Validate one imported lead row before it is added to the database.

const REQUIRED_FIELDS = [
    "full_name",
    "age",
    "phone_mobile",
    "country_code",
    "loan_account_no",
    "next_emi_date_dom",
    "emi_amount",
    "branch_code",
    "lead_status"
];

const VALID_LEAD_STATUSES = ["High", "Medium", "Low"];

// Branch codes currently recognized by the existing lead data.
const VALID_BRANCH_CODES = new Set([
    "BLR01",
    "DEL01",
    "HYD01",
    "MUM01",
    "PUN01"
]);

const validateImportRow = (row) => {
    const errors = [];

    // Check required fields.
    for (const field of REQUIRED_FIELDS) {
        if (
            row[field] === undefined ||
            row[field] === null ||
            String(row[field]).trim() === ""
        ) {
            errors.push(`${field} is required`);
        }
    }

    // Validate age only when a value was provided.
if (
    row.age !== undefined &&
    row.age !== null &&
    String(row.age).trim() !== ""
) {
    const age = Number(row.age);

    if (!Number.isInteger(age) || age < 18 || age > 120) {
        errors.push("age must be a valid integer between 18 and 120");
    }
}

// Validate phone number only when a value was provided.
if (
    row.phone_mobile !== undefined &&
    row.phone_mobile !== null &&
    String(row.phone_mobile).trim() !== ""
) {
    const phone = String(row.phone_mobile).trim();

    if (!/^\d{10}$/.test(phone)) {
        errors.push("phone_mobile must contain exactly 10 digits");
    }
}

// Validate loan account number only when a value was provided.
if (
    row.loan_account_no !== undefined &&
    row.loan_account_no !== null &&
    String(row.loan_account_no).trim() !== ""
) {
    const loanAccountNo = String(row.loan_account_no).trim();

    if (loanAccountNo.length > 100) {
        errors.push("loan_account_no must not exceed 100 characters");
    }
}

// Validate branch code against the known branch list.
if (
    row.branch_code !== undefined &&
    row.branch_code !== null &&
    String(row.branch_code).trim() !== ""
) {
    const branchCode = String(row.branch_code).trim();

    if (!VALID_BRANCH_CODES.has(branchCode)) {
        errors.push("branch_code is not a valid branch code");
    }
}

// Validate EMI date only when a value was provided.
if (
    row.next_emi_date_dom !== undefined &&
    row.next_emi_date_dom !== null &&
    String(row.next_emi_date_dom).trim() !== ""
) {
    const emiDate = String(row.next_emi_date_dom).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(emiDate)) {
        errors.push("next_emi_date_dom must use YYYY-MM-DD format");
    }
}

// Validate EMI amount only when a value was provided.
if (
    row.emi_amount !== undefined &&
    row.emi_amount !== null &&
    String(row.emi_amount).trim() !== ""
) {
    const emiAmount = Number(row.emi_amount);

    if (!Number.isFinite(emiAmount) || emiAmount < 0) {
        errors.push("emi_amount must be a valid non-negative number");
    }
}

// Validate lead status only when a value was provided.
if (
    row.lead_status !== undefined &&
    row.lead_status !== null &&
    String(row.lead_status).trim() !== ""
) {
    if (!VALID_LEAD_STATUSES.includes(String(row.lead_status).trim())) {
        errors.push("lead_status must be High, Medium, or Low");
    }
}
    return errors;
};

module.exports = {
    validateImportRow
};