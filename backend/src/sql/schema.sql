DROP TABLE IF EXISTS leads;

CREATE TABLE leads (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    full_name VARCHAR(150) NOT NULL,

    age INTEGER NOT NULL,

    phone_mobile VARCHAR(10) NOT NULL,

    country_code VARCHAR(11) DEFAULT '0',

    lead_status VARCHAR(100),

    date_entered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_leads_deleted
ON leads(deleted);

CREATE INDEX idx_leads_phone_mobile
ON leads(phone_mobile);


DROP TABLE IF EXISTS leads;

CREATE TABLE leads (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    date_entered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    date_modified TIMESTAMP DEFAULT NULL,

    age INTEGER NOT NULL,

    primary_address VARCHAR(180),

    country VARCHAR(20),

    postalcode INTEGER,

    deleted BOOLEAN NOT NULL DEFAULT FALSE,

    phone_mobile VARCHAR(10) NOT NULL,

    primary_address_state VARCHAR(100),

    full_name VARCHAR(150) NOT NULL,

    campaign_id INTEGER,

    lead_status VARCHAR(100),

    country_code VARCHAR(7) DEFAULT '0',

    loan_account_no VARCHAR(46) NOT NULL,

    next_emi_date_dom DATE,

    emi_amount NUMERIC(15,2),

    branch_code VARCHAR(100),

    cur_month_inst_no VARCHAR(100),

    remainder_link VARCHAR(250),

    amount_due NUMERIC(15,2),

    post_overdue_link VARCHAR(180)
);

CREATE INDEX idx_leads_deleted
ON leads(deleted);

CREATE INDEX idx_leads_phone_mobile
ON leads(phone_mobile);

CREATE INDEX idx_leads_lead_status
ON leads(lead_status);

CREATE INDEX idx_leads_branch_code
ON leads(branch_code);

CREATE INDEX idx_leads_campaign_id
ON leads(campaign_id);

CREATE INDEX idx_leads_date_entered
ON leads(date_entered);

CREATE INDEX IF NOT EXISTS idx_leads_lead_status_active
ON leads (lead_status)
WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_branch_code_active
ON leads (branch_code)
WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_campaign_id_active
ON leads (campaign_id)
WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_date_entered_active
ON leads (date_entered)
WHERE deleted = FALSE;

** sorting/keyset performance **

CREATE INDEX IF NOT EXISTS idx_leads_date_entered_id_active
ON leads (date_entered, id)
WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_status_id_active
ON leads (lead_status, id)
WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_branch_id_active
ON leads (branch_code, id)
WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_campaign_id_id_active
ON leads (campaign_id, id)
WHERE deleted = FALSE;


// Authentication

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    team_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_role_check
        CHECK (role IN ('admin', 'team_lead', 'user'))
);

CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT refresh_tokens_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

