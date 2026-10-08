-- Task 7: Prepare the leads table and database for large CSV/XLSX imports.
-- This migration adds the fields required by the import contract,
-- prevents duplicate loan accounts, and creates import job tracking.


-- ============================================================
-- 1. Add Task 7 import fields to the leads table
-- ============================================================

-- Loan account number is required for imported leads
-- and must be unique.
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS loan_account_no VARCHAR(100);


-- Next EMI date is stored as a PostgreSQL DATE.
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS next_emi_date_dom DATE;


-- EMI amount is stored as a numeric value with two decimal places.
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS emi_amount NUMERIC(12, 2);


-- ============================================================
-- 2. Prevent duplicate loan accounts
-- ============================================================

-- Multiple NULL values are allowed by PostgreSQL unique indexes.
-- This is useful because existing leads may not have a loan account
-- number yet. Our Task 7 application validation will require it for
-- every newly imported row.

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_loan_account_no_unique
ON leads(loan_account_no);


-- ============================================================
-- 3. Create the import_jobs table
-- ============================================================

-- This table tracks every background import job.
--
-- Example:
--
-- total      = 200000
-- processed  = 150000
-- succeeded  = 149500
-- failed     = 500
--
-- The status API will read this information.

CREATE TABLE IF NOT EXISTS import_jobs (

    -- Unique ID returned to the client after upload.
    id UUID PRIMARY KEY,

    -- Original name of the uploaded file.
    original_filename TEXT NOT NULL,

    -- Current state of the import.
    status VARCHAR(20) NOT NULL DEFAULT 'queued',

    -- Total number of rows in the file.
    total INTEGER NOT NULL DEFAULT 0,

    -- Number of rows processed so far.
    processed INTEGER NOT NULL DEFAULT 0,

    -- Number of rows successfully inserted.
    succeeded INTEGER NOT NULL DEFAULT 0,

    -- Number of rows rejected.
    failed INTEGER NOT NULL DEFAULT 0,

    -- Location of the generated error report.
    error_report_path TEXT,

    -- User who started the import.
    uploaded_by INTEGER,

    -- Job timestamps.
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    started_at TIMESTAMP,

    completed_at TIMESTAMP,

    -- Only valid job statuses are allowed.
    CONSTRAINT import_jobs_status_check
        CHECK (
            status IN (
                'queued',
                'processing',
                'completed',
                'failed'
            )
        )
);

-- Task 7: Store the actual uploaded file path so the background worker can process it.

ALTER TABLE import_jobs
ADD COLUMN IF NOT EXISTS file_path TEXT;