// Insert a batch of validated lead rows into PostgreSQL
// and return the loan account numbers that were actually inserted.

const pool = require("../db");

const insertLeadBatch = async (rows) => {
    if (rows.length === 0) {
        return [];
    }

    const values = [];
    const placeholders = [];

    rows.forEach((row, index) => {
        const offset = index * 9;

        placeholders.push(
            `(
                $${offset + 1},
                $${offset + 2},
                $${offset + 3},
                $${offset + 4},
                $${offset + 5},
                $${offset + 6},
                $${offset + 7},
                $${offset + 8},
                $${offset + 9}
            )`
        );

        values.push(
            String(row.full_name).trim(),
            Number(row.age),
            String(row.phone_mobile).trim(),
            String(row.country_code).trim(),
            String(row.loan_account_no).trim(),
            String(row.next_emi_date_dom).trim(),
            Number(row.emi_amount),
            String(row.branch_code).trim(),
            String(row.lead_status).trim()
        );
    });

    const query = `
        INSERT INTO leads (
            full_name,
            age,
            phone_mobile,
            country_code,
            loan_account_no,
            next_emi_date_dom,
            emi_amount,
            branch_code,
            lead_status
        )
        VALUES ${placeholders.join(",")}
        ON CONFLICT (loan_account_no) DO NOTHING
        RETURNING loan_account_no
    `;

    const result = await pool.query(query, values);

    return result.rows.map((row) => row.loan_account_no);
};

module.exports = {
    insertLeadBatch
};