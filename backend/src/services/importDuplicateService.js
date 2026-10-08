// Check imported loan account numbers against existing
// lead records in PostgreSQL without querying once per CSV row.

const pool = require("../db");

const findExistingLoanAccounts = async (loanAccountNumbers) => {
    if (loanAccountNumbers.length === 0) {
        return new Set();
    }

    const result = await pool.query(
        `
        SELECT loan_account_no
        FROM leads
        WHERE loan_account_no = ANY($1::varchar[])
        `,
        [loanAccountNumbers]
    );

    return new Set(
        result.rows.map((row) => row.loan_account_no)
    );
};

module.exports = {
    findExistingLoanAccounts
};