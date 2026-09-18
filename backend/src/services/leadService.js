const pool = require("../db");

const SORT_COLUMNS = {
    id: "id",
    date_entered: "date_entered",
    lead_status: "lead_status",
    branch_code: "branch_code",
    campaign_id: "campaign_id"
};

const {
    NotFoundError,
    ValidationError
} = require("../errors/AppError");

const {
    encodeCursor,
    decodeCursor
} = require("../utils/cursor");

const getAllLeads = async () => {
    const query = `
        SELECT
            id,
            full_name,
            age,
            phone_mobile,
            country_code,
            lead_status,
            date_entered
        FROM leads
        WHERE deleted = FALSE
        ORDER BY id
    `;

    const result = await pool.query(query);

    return result.rows;
};


const getLeadById = async (id) => {
    const query = `
        SELECT
            id,
            full_name,
            age,
            phone_mobile,
            country_code,
            lead_status,
            date_entered
        FROM leads
        WHERE id = $1
          AND deleted = FALSE
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
        throw new NotFoundError(
            `Lead with id ${id} not found`
        );
    }

    return result.rows[0];
};


const createLead = async (lead) => {
    const query = `
        INSERT INTO leads (
            full_name,
            age,
            phone_mobile,
            country_code,
            lead_status
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            id,
            full_name,
            age,
            phone_mobile,
            country_code,
            lead_status,
            date_entered
    `;

    const values = [
        lead.full_name,
        lead.age,
        lead.phone_mobile,
        lead.country_code,
        lead.lead_status
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};


const replaceLead = async (id, lead) => {
    const query = `
        UPDATE leads
        SET
            full_name = $1,
            age = $2,
            phone_mobile = $3,
            country_code = $4,
            lead_status = $5
        WHERE id = $6
          AND deleted = FALSE
        RETURNING
            id,
            full_name,
            age,
            phone_mobile,
            country_code,
            lead_status,
            date_entered
    `;

    const values = [
        lead.full_name,
        lead.age,
        lead.phone_mobile,
        lead.country_code,
        lead.lead_status,
        id
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
        throw new NotFoundError(
            `Lead with id ${id} not found`
        );
    }

    return result.rows[0];
};


const updateLead = async (id, lead) => {
    const allowedFields = [
        "full_name",
        "age",
        "phone_mobile",
        "country_code",
        "lead_status"
    ];

    const fields = [];
    const values = [];

    let parameterIndex = 1;

    for (const field of allowedFields) {
        if (lead[field] !== undefined) {
            fields.push(
                `${field} = $${parameterIndex}`
            );

            values.push(lead[field]);

            parameterIndex++;
        }
    }
    if (fields.length === 0) {
        throw new ValidationError(
            "At least one field is required for update"
        );
    }

    values.push(id);

    const query = `
        UPDATE leads
        SET ${fields.join(", ")}
        WHERE id = $${parameterIndex}
          AND deleted = FALSE
        RETURNING
            id,
            full_name,
            age,
            phone_mobile,
            country_code,
            lead_status,
            date_entered
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
        throw new NotFoundError(
            `Lead with id ${id} not found`
        );
    }

    return result.rows[0];
};


const softDeleteLead = async (id) => {
    const query = `
        UPDATE leads
        SET deleted = TRUE
        WHERE id = $1
          AND deleted = FALSE
        RETURNING id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
        throw new NotFoundError(
            `Lead with id ${id} not found`
        );
    }
};
const buildLeadFilters = (
    status,
    branch_code,
    campaign_id,
    date_from,
    date_to
) => {
    const conditions = ["deleted = FALSE"];
    const values = [];

    if (status) {
        values.push(status);
        conditions.push(
            `lead_status = $${values.length}`
        );
    }

    if (branch_code) {
        values.push(branch_code);
        conditions.push(
            `branch_code = $${values.length}`
        );
    }

    if (campaign_id) {
        values.push(campaign_id);
        conditions.push(
            `campaign_id = $${values.length}`
        );
    }

    if (date_from) {
        values.push(date_from);
        conditions.push(
            `date_entered >= $${values.length}::date`
        );
    }

    if (date_to) {
        values.push(date_to);
        conditions.push(
            `date_entered < ($${values.length}::date + INTERVAL '1 day')`
        );
    }

    return {
        conditions,
        values
    };
};

// Helper function

const createNextCursor = (row, sortColumn) => {
    const value = row[sortColumn];

    return encodeCursor(
        value,
        row.id
    );
};

const getLeadsByPage = async ({
    page = 1,
    limit = 50,
    status,
    branch_code,
    campaign_id,
    date_from,
    date_to,
    sort = "id",
    order = "ASC"
}) => {

    const sortColumn =
        SORT_COLUMNS[sort] || SORT_COLUMNS.id;

    const sortOrder =
        order.toUpperCase() === "DESC"
            ? "DESC"
            : "ASC";

    const offset = (page - 1) * limit;

    const {
        conditions,
        values
    } = buildLeadFilters(
        status,
        branch_code,
        campaign_id,
        date_from,
        date_to
    );

    values.push(limit);
    const limitParam = `$${values.length}`;

    values.push(offset);
    const offsetParam = `$${values.length}`;

    const query = `
        SELECT
            id,
            full_name,
            age,
            phone_mobile,
            country_code,
            lead_status,
            date_entered
        FROM leads
        WHERE ${conditions.join(" AND ")}
        ORDER BY
            ${sortColumn} ${sortOrder},
            id ${sortOrder}
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
    `;

    const result = await pool.query(
        query,
        values
    );

   let nextCursor = null;

    if (result.rows.length === Number(limit)) {

        const lastRow =
            result.rows[result.rows.length - 1];

        nextCursor = createNextCursor(
              lastRow,
              sortColumn
        );
    }

    return {
        rows: result.rows,
        page: Number(page),
        limit: Number(limit),
        nextCursor
    };
};


const getLeadsByCursor = async ({
    after,
    limit = 50,
    status,
    branch_code,
    campaign_id,
    date_from,
    date_to,
    sort = "id",
    order = "ASC"
}) => {

    const sortColumn =
        SORT_COLUMNS[sort] || SORT_COLUMNS.id;

    const sortOrder =
        order.toUpperCase() === "DESC"
            ? "DESC"
            : "ASC";

    const {
        conditions,
        values
    } = buildLeadFilters(
        status,
        branch_code,
        campaign_id,
        date_from,
        date_to
    );

    const cursor = decodeCursor(after);

    if (!cursor) {
        throw new ValidationError(
            "Invalid cursor"
        );
    }

    const valueParam = values.length + 1;
    const idParam = values.length + 2;

    if (sortColumn === "date_entered") {

    if (sortOrder === "ASC") {

        conditions.push(`
            (
                date_entered > $${valueParam}::timestamp
                OR (
                    date_entered = $${valueParam}::timestamp
                    AND id > $${idParam}
                )
            )
        `);

    } else {

        conditions.push(`
            (
                date_entered < $${valueParam}::timestamp
                OR (
                    date_entered = $${valueParam}::timestamp
                    AND id < $${idParam}
                )
            )
        `);
    }

} else {

    if (sortOrder === "ASC") {

        conditions.push(`
            (
                ${sortColumn} > $${valueParam}
                OR (
                    ${sortColumn} = $${valueParam}
                    AND id > $${idParam}
                )
            )
        `);

    } else {

        conditions.push(`
            (
                ${sortColumn} < $${valueParam}
                OR (
                    ${sortColumn} = $${valueParam}
                    AND id < $${idParam}
                )
            )
        `);
    }
}

    values.push(cursor.value);
    values.push(cursor.id);

    const limitParam = values.length + 1;

    values.push(Number(limit));

    const query = `
        SELECT
            id,
            full_name,
            age,
            phone_mobile,
            country_code,
            lead_status,
            date_entered,
            branch_code,
            campaign_id
        FROM leads
        WHERE ${conditions.join(" AND ")}
        ORDER BY
            ${sortColumn} ${sortOrder},
            id ${sortOrder}
        LIMIT $${limitParam}
    `;

    console.log("========== CURSOR DEBUG ==========");
console.log("sortColumn:", sortColumn);
console.log("sortOrder:", sortOrder);
console.log("cursor:", cursor);
console.log("query:", query);
console.log("values:", values);
console.log("==================================");

    const result = await pool.query(
        query,
        values
    );

    const rows = result.rows;

    let nextCursor = null;

    if (rows.length === Number(limit)) {

        const lastRow =
            rows[rows.length - 1];

        nextCursor = createNextCursor(
            lastRow,
            sortColumn
        );
    }

    return {
        rows,
        nextCursor
    };
};


module.exports = {
    getAllLeads,
    getLeadById,
    createLead,
    replaceLead,
    updateLead,
    softDeleteLead,
    getLeadsByPage,
    getLeadsByCursor,
};