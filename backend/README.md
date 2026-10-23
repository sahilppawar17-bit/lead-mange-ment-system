//Packages
npm install express pg dotenv express-validator

npm install jsonwebtoken
npm install multer file-type yauzl

//Development Tool
npm install --save-dev nodemon

// Test Get Method WithOut Any Data 

GET http://localhost:3000/api/leads

{
    "success": true,
    "data": []
}
// Post Method

POST http://localhost:3000/api/leads

{
    "full_name": "Madhav Patil",
    "age": 24,
    "phone_mobile": "9498998798",
    "country_code": "IN",
    "lead_status": "Low"
}
//Missing Field
{
    "full_name": "Madhav Patil",
    "age": 24,
    "phone_mobile": "9498998798",
    "country_code": "IN"
}
{
    "success": false,
    "error": {
        "code": "BAD_REQUEST",
        "message": "full_name, age, phone_mobile, country_code and lead_status are required"
    }
}

//Get By Id

GET http://localhost:3000/api/leads/1

{
    "success": true,
    "data": {
        "id": 1,
        "full_name": "Madhav Patil",
        "age": 24,
        "phone_mobile": "9498998798",
        "country_code": "IN",
        "lead_status": "Low",
        "date_entered": "2026-08-25T08:20:00.000Z"
    }
}

//Pagination
Why OFFSET Pagination Becomes Slow
With normal page-based pagination, we use OFFSET and LIMIT.
LIMIT 50 OFFSET 5000000
means the database has to skip the first 5,000,000 rows and then return the next 50 rows.
offset becomes larger, the query generally takes more time because the database still has to process and skip those earlier rows.
Why Keyset (Cursor) Pagination Is Better
id = 5000000
the next request can use:
WHERE id > 5000000
ORDER BY id
LIMIT 50
The database can use the index on id and directly continue from that point instead of processing the previous 5,000,000 rows again.

OFFSET pagination:
Skip the first 5 million records and then give me 50.

Keyset pagination:
I already have record 5,000,000. Give me the next 50 records after it.

----------------------------------------------
// tAsk 3

Get Leads — Default Page Pagination

GET http://localhost:3000/api/leads?page=1&limit=10

Output — 200 OK

{
    "success": true,
    "data": {
        "rows": [
            {
                "id": 1,
                "full_name": "Josh Butler",
                "age": 25,
                "phone_mobile": "9876543210",
                "country_code": "IN",
                "lead_status": "Low",
                "date_entered": "2026-08-25 17:16:19.431742"
            }
        ],
        "page": 1,
        "limit": 10
    },
    "pagination": {
        "type": "page",
        "page": 1,
        "limit": 10,
        "next_cursor": null
    }
}


// Page Pagination with Limit

GET http://localhost:3000/api/leads?page=1&limit=3

Output — 200 OK

{
    "success": true,
    "data": {
        "rows": [
            {
                "id": 1,
                "full_name": "Josh Butler",
                "age": 25,
                "phone_mobile": "9876543210",
                "country_code": "IN",
                "lead_status": "Low",
                "date_entered": "2026-08-25 17:16:19.431742"
            },
            {
                "id": 7,
                "full_name": "Neha Deshmukh",
                "age": 26,
                "phone_mobile": "9876543216",
                "country_code": "IN",
                "lead_status": "Pending",
                "date_entered": "2026-08-25 12:50:00"
            },
            {
                "id": 6,
                "full_name": "Vikram Singh",
                "age": 41,
                "phone_mobile": "9876543215",
                "country_code": "IN",
                "lead_status": "New",
                "date_entered": "2026-08-25 12:40:00"
            }
        ],
        "page": 1,
        "limit": 3
    },
    "pagination": {
        "type": "page",
        "page": 1,
        "limit": 3,
        "next_cursor": "..."
    }
}

// Sorting — Date Entered DESC

GET http://localhost:3000/api/leads?sort=date_entered&order=DESC&limit=3

Output — 200 OK

{
    "success": true,
    "data": {
        "rows": [
            {
                "id": 1,
                "full_name": "Josh Butler",
                "age": 25,
                "phone_mobile": "9876543210",
                "country_code": "IN",
                "lead_status": "Low",
                "date_entered": "2026-08-25 17:16:19.431742"
            },
            {
                "id": 7,
                "full_name": "Neha Deshmukh",
                "age": 26,
                "phone_mobile": "9876543216",
                "country_code": "IN",
                "lead_status": "Pending",
                "date_entered": "2026-08-25 12:50:00"
            },
            {
                "id": 6,
                "full_name": "Vikram Singh",
                "age": 41,
                "phone_mobile": "9876543215",
                "country_code": "IN",
                "lead_status": "New",
                "date_entered": "2026-08-25 12:40:00"
            }
        ],
        "page": 1,
        "limit": 3
    },
    "pagination": {
        "type": "page",
        "page": 1,
        "limit": 3,
        "next_cursor": "..."
    }
}

// Sorting — Date Entered ASC

GET http://localhost:3000/api/leads?sort=date_entered&order=ASC&limit=3

Output — 200 OK

{
    "success": true,
    "data": {
        "rows": [
            {
                "id": 2,
                "full_name": "Rahul Sharma",
                "age": 28,
                "phone_mobile": "9876543211",
                "country_code": "IN",
                "lead_status": "Pending",
                "date_entered": "2026-08-25 12:00:00"
            },
            {
                "id": 3,
                "full_name": "Priya Patil",
                "age": 32,
                "phone_mobile": "9876543212",
                "country_code": "IN",
                "lead_status": "New",
                "date_entered": "2026-08-25 12:10:00"
            },
            {
                "id": 4,
                "full_name": "Amit Kumar",
                "age": 35,
                "phone_mobile": "9876543213",
                "country_code": "IN",
                "lead_status": "Pending",
                "date_entered": "2026-08-25 12:20:00"
            }
        ],
        "page": 1,
        "limit": 3
    },
    "pagination": {
        "type": "page",
        "page": 1,
        "limit": 3
    }
}

// Filtering — Status

GET http://localhost:3000/api/leads?status=Pending&limit=50

Output — 200 OK

{
    "success": true,
    "data": {
        "rows": [
            {
                "id": 7,
                "full_name": "Neha Deshmukh",
                "age": 26,
                "phone_mobile": "9876543216",
                "country_code": "IN",
                "lead_status": "Pending",
                "date_entered": "2026-08-25 12:50:00"
            },
            {
                "id": 4,
                "full_name": "Amit Kumar",
                "age": 35,
                "phone_mobile": "9876543213",
                "country_code": "IN",
                "lead_status": "Pending",
                "date_entered": "2026-08-25 12:20:00"
            },
            {
                "id": 2,
                "full_name": "Rahul Sharma",
                "age": 28,
                "phone_mobile": "9876543211",
                "country_code": "IN",
                "lead_status": "Pending",
                "date_entered": "2026-08-25 12:00:00"
            }
        ],
        "page": 1,
        "limit": 50
    },
    "pagination": {
        "type": "page",
        "page": 1,
        "limit": 50,
        "next_cursor": null
    }
}

// Combined Filtering

GET

http://localhost:3000/api/leads?status=Pending&branch_code=BLR01&campaign_id=123&date_from=2026-08-25&date_to=2026-08-26&sort=date_entered&order=DESC&limit=2

Output — 200 OK

{
    "success": true,
    "data": {
        "rows": [
            {
                "id": 4,
                "full_name": "Amit Kumar",
                "age": 35,
                "phone_mobile": "9876543213",
                "country_code": "IN",
                "lead_status": "Pending",
                "date_entered": "2026-08-25 12:20:00"
            },
            {
                "id": 2,
                "full_name": "Rahul Sharma",
                "age": 28,
                "phone_mobile": "9876543211",
                "country_code": "IN",
                "lead_status": "Pending",
                "date_entered": "2026-08-25 12:00:00"
            }
        ],
        "page": 1,
        "limit": 2
    },
    "pagination": {
        "type": "page",
        "page": 1,
        "limit": 2,
        "next_cursor": null
    }
}

// Cursor Pagination — First Request

GET - http://localhost:3000/api/leads?sort=date_entered&order=DESC&limit=3

Output — 200 OK

{
    "success": true,
    "data": {
        "rows": [
            {
                "id": 1,
                "full_name": "Josh Butler",
                "age": 25,
                "phone_mobile": "9876543210",
                "country_code": "IN",
                "lead_status": "Low",
                "date_entered": "2026-08-25 17:16:19.431742"
            },
            {
                "id": 7,
                "full_name": "Neha Deshmukh",
                "age": 26,
                "phone_mobile": "9876543216",
                "country_code": "IN",
                "lead_status": "Pending",
                "date_entered": "2026-08-25 12:50:00"
            },
            {
                "id": 6,
                "full_name": "Vikram Singh",
                "age": 41,
                "phone_mobile": "9876543215",
                "country_code": "IN",
                "lead_status": "New",
                "date_entered": "2026-08-25 12:40:00"
            }
        ],
        "page": 1,
        "limit": 3
    },
    "pagination": {
        "type": "page",
        "page": 1,
        "limit": 3,
        "next_cursor": "eyJ2YWx1ZSI6IjIwMjYtMDgtMjUgMTI6NDA6MDAiLCJpZCI6Nn0"
    }
}


// Cursor Pagination — Next Page

GET - http://localhost:3000/api/leads?sort=date_entered&order=DESC&after=eyJ2YWx1ZSI6IjIwMjYtMDgtMjUgMTI6NDA6MDAiLCJpZCI6Nn0&limit=3

Output — 200 OK

{
    "success": true,
    "data": [
        {
            "id": 5,
            "full_name": "Sneha Joshi",
            "age": 29,
            "phone_mobile": "9876543214",
            "country_code": "IN",
            "lead_status": "Converted",
            "date_entered": "2026-08-25 12:30:00",
            "branch_code": "MUM01",
            "campaign_id": 102
        },
        {
            "id": 4,
            "full_name": "Amit Kumar",
            "age": 35,
            "phone_mobile": "9876543213",
            "country_code": "IN",
            "lead_status": "Pending",
            "date_entered": "2026-08-25 12:20:00",
            "branch_code": "BLR01",
            "campaign_id": 123
        },
        {
            "id": 3,
            "full_name": "Priya Patil",
            "age": 32,
            "phone_mobile": "9876543212",
            "country_code": "IN",
            "lead_status": "New",
            "date_entered": "2026-08-25 12:10:00",
            "branch_code": "MUM01",
            "campaign_id": 101
        }
    ],
    "pagination": {
        "type": "cursor",
        "limit": 3,
        "next_cursor": "eyJ2YWx1ZSI6IjIwMjYtMDgtMjUgMTI6MTA6MDAiLCJpZCI6M30"
    }
}

// Cursor Pagination — Final Page

GET - http://localhost:3000/api/leads?sort=date_entered&order=DESC&after=eyJ2YWx1ZSI6IjIwMjYtMDgtMjUgMTI6MTA6MDAiLCJpZCI6M30&limit=3

Output — 200 OK

{
    "success": true,
    "data": [
        {
            "id": 2,
            "full_name": "Rahul Sharma",
            "age": 28,
            "phone_mobile": "9876543211",
            "country_code": "IN",
            "lead_status": "Pending",
            "date_entered": "2026-08-25 12:00:00",
            "branch_code": "BLR01",
            "campaign_id": 123
        }
    ],
    "pagination": {
        "type": "cursor",
        "limit": 3,
        "next_cursor": null
    }
}

// Cursor Pagination with Filters

GET - http://localhost:3000/api/leads?status=Pending&branch_code=BLR01&campaign_id=123&sort=date_entered&order=DESC&limit=2

Output — 200 OK

{
    "success": true,
    "data": {
        "rows": [
            {
                "id": 7,
                "full_name": "Neha Deshmukh",
                "age": 26,
                "phone_mobile": "9876543216",
                "country_code": "IN",
                "lead_status": "Pending",
                "date_entered": "2026-08-25 12:50:00"
            },
            {
                "id": 4,
                "full_name": "Amit Kumar",
                "age": 35,
                "phone_mobile": "9876543213",
                "country_code": "IN",
                "lead_status": "Pending",
                "date_entered": "2026-08-25 12:20:00"
            }
        ],
        "page": 1,
        "limit": 2
    },
    "pagination": {
        "type": "page",
        "page": 1,
        "limit": 2,
        "next_cursor": "eyJ2YWx1ZSI6IjIwMjYtMDgtMjUgMTI6MjA6MDAiLCJpZCI6NH0"
    }
}

// Then use the returned cursor:

GET - http://localhost:3000/api/leads?status=Pending&branch_code=BLR01&campaign_id=123&sort=date_entered&order=DESC&after=eyJ2YWx1ZSI6IjIwMjYtMDgtMjUgMTI6MjA6MDAiLCJpZCI6NH0&limit=2


// Invalid Sort Column

GET - http://localhost:3000/api/leads?sort=invalid_column&order=DESC&limit=10

Output — 400 Bad Request

{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Request Validation failed",
        "details": [
            {
                "field": "sort",
                "location": "query",
                "message": "Invalid sort column"
            }
        ]
    }
}

// Invalid Cursor

GET - http://localhost:3000/api/leads?sort=date_entered&order=DESC&after=INVALID_CURSOR&limit=3

Output — 400 Bad Request

{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid cursor"
    }
}

// Cursor Format

The cursor is encoded using Base64URL.

Example:

eyJ2YWx1ZSI6IjIwMjYtMDgtMjUgMTI6NDA6MDAiLCJpZCI6Nn0

Decoded cursor:

{
    "value": "2026-08-25 12:40:00",
    "id": 6
}

The cursor contains:

value — current sort-column value
id — unique tie-breaker

The id is necessary because multiple leads can have the same date_entered.

// Keyset Pagination Logic

For:

sort=date_entered
order=DESC

the next-page query uses:

WHERE deleted = FALSE
AND (
    date_entered < $1
    OR (
        date_entered = $1
        AND id < $2
    )
)
ORDER BY date_entered DESC, id DESC
LIMIT $3;

For example:

cursor value = 2026-08-25 12:40:00
cursor id    = 6
limit        = 3

The query starts after (date_entered, id) = (12:40, 6), returning:

5
4
3

and then:

2

on the final page.

This is the keyset approach required by Task 3.

// Why Cursor Pagination Is Used

Avoid using:

OFFSET 5000000 LIMIT 50

for deep pagination.

With large offsets, PostgreSQL must scan/skip a large number of rows before returning the requested records.

Instead, cursor pagination uses the last row's:

sort value + id

to jump directly to the next part of the ordered dataset.

Therefore, cursor/keyset pagination is the recommended approach for very deep paging on the full leads table.

// Database Indexes

The following indexes were added to support filtering and sorting:

CREATE INDEX idx_leads_status_active
ON leads (lead_status)
WHERE deleted = FALSE;
CREATE INDEX idx_leads_branch_active
ON leads (branch_code)
WHERE deleted = FALSE;
CREATE INDEX idx_leads_campaign_active
ON leads (campaign_id)
WHERE deleted = FALSE;
CREATE INDEX idx_leads_date_entered_active
ON leads (date_entered)
WHERE deleted = FALSE;

Composite index:

CREATE INDEX idx_leads_filter_sort
ON leads (
    lead_status,
    branch_code,
    campaign_id,
    date_entered DESC,
    id DESC
)
WHERE deleted = FALSE;

Primary key:

CREATE UNIQUE INDEX leads_pkey
ON leads (id);

Task 3 requires every filterable column to have a matching index and asks for EXPLAIN ANALYZE evidence showing index usage.

// Verify Indexes

Run:

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'leads';

Expected indexes:

idx_leads_branch_active
idx_leads_campaign_active
idx_leads_date_entered_active
idx_leads_filter_sort
idx_leads_status_active
leads_pkey

// EXPLAIN ANALYZE — Filtered Query

Run:

EXPLAIN (ANALYZE, BUFFERS)
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
  AND lead_status = 'Pending'
  AND branch_code = 'BLR01'
  AND campaign_id = 123
ORDER BY date_entered DESC, id DESC
LIMIT 50;

Save the output in the README under:

EXPLAIN ANALYZE — After Indexing

The output should demonstrate index usage rather than a full-table scan.


// EXPLAIN ANALYZE — Cursor Query

Run:

EXPLAIN (ANALYZE, BUFFERS)
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
  AND (
      date_entered < '2026-08-25 12:40:00'
      OR (
          date_entered = '2026-08-25 12:40:00'
          AND id < 6
      )
  )
ORDER BY date_entered DESC, id DESC
LIMIT 3;

---------------------------------------------

// Task 4 — Authentication 

// 1. Login — Admin

POST `http://localhost:3000/api/auth/login`


{
    "email": "admin@test.com",
    "password": "Admin@123"
}

**Output — 200 OK**

{
    "success": true,
    "data": {
        "accessToken": "...",
        "refreshToken": "...",
        "expiresIn": 900
    }
}


---

// 2. Login — Team Lead

POST `http://localhost:3000/api/auth/login`

{
    "email": "lead@test.com",
    "password": "Lead@123"
}


**Output — 200 OK**

Returns an access token and refresh token.

---

### 3. Login — Normal User

POST `http://localhost:3000/api/auth/login`

{
    "email": "user@test.com",
    "password": "User@123"
}


**Output — 200 OK**

Returns an access token and refresh token.

---

// 4. Protected Leads API

GET `http://localhost:3000/api/leads`

**Without Token**

**Output — 401 Unauthorized**

```text
Authentication token is required
```

**With Valid Access Token**

```text
Authorization: Bearer <ACCESS_TOKEN>
```

**Output — 200 OK**

Leads data is returned.

---

### 5. Refresh Access Token

POST `http://localhost:3000/api/auth/refresh`

{
    "refreshToken": "<REFRESH_TOKEN>"
}

**Output — 200 OK**

{
    "success": true,
    "data": {
        "accessToken": "...",
        "expiresIn": 900
    }
}

---

// 6. Logout

POST `http://localhost:3000/api/auth/logout`

{
    "refreshToken": "<REFRESH_TOKEN>"
}

**Output — 200 OK**

{
    "success": true,
    "data": {
        "message": "Logout successful"
    }
}


After logout, the same refresh token cannot be used again.

---

// 7. Role-Based Authorization

GET `http://localhost:3000/api/auth/role-test`

**Admin / Team Lead**

**Output — 200 OK**

```text
You have the required role
```

**Normal User**

**Output — 403 Forbidden**

```text
You do not have permission to access this resource
```

---

### 8. Database Verification — Refresh Token

Refresh tokens are stored in the database as a SHA-256 hash.

```sql
SELECT
    id,
    user_id,
    token_hash,
    expires_at,
    revoked,
    created_at
FROM refresh_tokens
ORDER BY id DESC;
```

**Sample Output**

```text
id:         1
user_id:    1
token_hash: 823e3965565f1beb5d7220bb375669e8f646ea5f039aa996e739c39124b4aecf
expires_at: 2026-09-03 19:25:40.131312
revoked:    false
created_at: 2026-08-27 19:25:40.131312
```
------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------
## Task 7: Bulk Lead Import System

### 1. Overview

Implemented bulk lead import using CSV and Excel files, background job processing, batch database inserts, import status tracking, and error reporting.

Key features:
- CSV and Excel (`.xlsx`) file uploads.
- Asynchronous processing using BullMQ and Redis.
- Batch processing with a batch size of 500 rows.
- Duplicate and invalid-row handling.
- Import progress and status tracking.
- Downloadable error reports.
- Automatic recovery of queued jobs after Redis becomes available again.

### 2. Technologies and Libraries Used

| Technology / Library | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API and upload endpoints |
| Multer | Handles uploaded files |
| `csv-parse` | Parses CSV files |
| `exceljs` | Reads Excel files |
| BullMQ | Manages background import jobs |
| ioredis | Connects BullMQ to Redis |
| PostgreSQL (`pg`) | Stores lead records and import job status |
| React | Bulk import user interface |
| Axios | Sends API requests from the frontend |
| Vite | Frontend development and production build |
| Docker | Runs Redis locally in a container |

### 3. Backend Installation

Open PowerShell and navigate to the backend folder:

```powershell
# Navigate to the backend directory.
cd "C:\Users\Sahil Pawar\CDAC\Intership\Task 2\Lead-Management-System\backend"

# Install backend dependencies.
npm install

# Install background job and Redis libraries.
npm install bullmq ioredis
```

Important libraries used for file import:

```powershell
# Install file upload and CSV/Excel processing libraries if missing.
npm install multer csv-parse exceljs

# Install the PostgreSQL driver if missing.
npm install pg
```

### 4. Redis Setup Using Docker

Install Docker Desktop and make sure it is running.

```powershell
# Create and start a Redis container.
docker run -d --name leads-redis -p 6379:6379 redis:7-alpine

# Verify that Redis is responding.
docker exec leads-redis redis-cli ping
```

Expected response:

```text
PONG
```

If the container already exists but is stopped:

```powershell
# Start the existing Redis container.
docker start leads-redis
```

### 5. Environment Configuration

Add or verify these settings in `backend/.env`:

```env
# Redis connection used by BullMQ.
REDIS_URL=redis://127.0.0.1:6379

# Number of import jobs processed concurrently by the worker.
IMPORT_WORKER_CONCURRENCY=1
```

Keep the existing PostgreSQL and authentication environment variables. Do not commit passwords, JWT secrets, or other credentials to Git.

------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------


## Task 8 — Generic File Upload Service

### Packages

```bash
npm install file-type yauzl
```

**Purpose:**
- `multer` — Handles multipart file uploads.
- `file-type` — Detects binary file signatures.
- `yauzl` — Inspects ZIP-based XLSX workbook structures.
- `crypto` — Generates unique file identifiers (built into Node.js).

### 1. Upload a Valid Image

**POST**

`http://localhost:3000/api/files`

**Authorization:**

```text
Authorization: Bearer <ACCESS_TOKEN>
```

**Body → form-data**

| Key | Type | Value |
|---|---|---|
| `file` | File | `test-image.png` |

**Expected Output — 201 Created**

```json
{
  "success": true,
  "data": {
    "fileId": "<GENERATED_FILE_ID>",
    "url": "/api/files/<GENERATED_FILE_ID>",
    "type": "image/png",
    "size": 12345
  }
}
```

The file ID and size are generated from the actual upload. The values above are examples.

---

### 2. Upload a Valid PDF

**POST**

`http://localhost:3000/api/files`

**Body → form-data**

| Key | Type | Value |
|---|---|---|
| `file` | File | `valid-test.pdf` |

**Expected Output — 201 Created**

The response contains the generated file ID, URL, verified MIME type (`application/pdf`), and actual file size.

---

### 3. Upload a Valid CSV File

**POST**

`http://localhost:3000/api/files`

**Body → form-data**

| Key | Type | Value |
|---|---|---|
| `file` | File | `test-leads.csv` |

**Sample CSV Data**

```csv
first_name,last_name,email,phone_mobile,status
Aarav,Sharma,aarav.sharma@example.com,9876543210,New
Priya,Patel,priya.patel@example.com,9876543211,Contacted
Rahul,Verma,rahul.verma@example.com,9876543212,Qualified
```

**Expected Output — 201 Created**

The file is uploaded and stored. Uploading the CSV does not automatically import its rows into the leads database.

---

### 4. Upload a Valid Excel File

**POST**

`http://localhost:3000/api/files`

**Body → form-data**

| Key | Type | Value |
|---|---|---|
| `file` | File | `test-leads.xlsx` |

**Expected Output — 201 Created**

The service accepts the workbook if its extension, signature, structure, and configured limits are valid.

---

### 5. Reject an Unsupported File Type

**POST**

`http://localhost:3000/api/files`

**Body → form-data**

| Key | Type | Value |
|---|---|---|
| `file` | File | `unsupported-test.txt` |

**Expected Output — 415 Unsupported Media Type**

```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_FILE_TYPE",
    "message": "Unsupported file type"
  }
}
```

The exact error response depends on the configured error handler.

---

### 6. Reject a File with a Mismatched Signature

Create a plain text file named `fake.pdf` containing:

```text
This is plain text, not a real PDF file.
```

**POST**

`http://localhost:3000/api/files`

**Body → form-data**

| Key | Type | Value |
|---|---|---|
| `file` | File | `fake.pdf` |

**Expected Output — 415 Unsupported Media Type**

The file must be rejected because its actual content does not match the expected PDF signature.

---

### 7. Reject an Oversized File

**POST**

`http://localhost:3000/api/files`

**Body → form-data**

| Key | Type | Value |
|---|---|---|
| `file` | File | A file exceeding the configured size limit |

**Example Limits**

| File Type | Maximum Size |
|---|---:|
| PNG/JPG | 5 MB |
| PDF/DOC | 20 MB |
| XLSX | 50 MB |
| CSV | 50 MB |

**Expected Output — 413 Payload Too Large**

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Uploaded file exceeds the maximum allowed size"
  }
}
```

The global upload limit must be enforced while receiving the file. To enforce the smaller per-type limits before the complete file is written, use a streaming handler that identifies the format early and stops when that type's limit is exceeded.

---

### 8. Upload Without a File

**POST**

`http://localhost:3000/api/files`

**Body → form-data**

Do not add the `file` field.

**Expected Output — 400 Bad Request**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Select a file to upload"
  }
}
```

---

### 9. Upload Without Authentication

**POST**

`http://localhost:3000/api/files`

Remove the Bearer token from the Authorization tab.

**Body → form-data**

| Key | Type | Value |
|---|---|---|
| `file` | File | `valid-test.pdf` |

**Expected Output — 401 Unauthorized**

```json
{
  "success": false,
  "error": {
    "message": "Authentication token is required"
  }
}
```

The exact response depends on the existing authentication middleware.

---

### 10. Retrieve an Uploaded File

**GET**

`http://localhost:3000/api/files/<FILE_ID>`

**Authorization:**

```text
Authorization: Bearer <ACCESS_TOKEN>
```

Replace `<FILE_ID>` with the ID returned after a successful upload.

**Expected Output — 200 OK**

The file is returned or downloaded if the GET endpoint is implemented and the authenticated user is authorized to access it.

---

### 11. Verify Uploaded File Metadata in PostgreSQL

Run the following query in PostgreSQL:

```sql
SELECT
    file_id,
    original_name,
    mime_type,
    size_bytes,
    uploaded_by,
    created_at
FROM uploaded_files
ORDER BY created_at DESC;
```

**Expected Result**

Successful uploads have corresponding metadata records containing the file ID, original filename, MIME type, file size, uploader ID, and timestamp.

Before Pm2 & Ngnix 

Task 9 — Baseline Load Test

Environment: Before PM2/Nginx
Tool:k6
Endpoint:GET /api/leads?limit=50
Virtual users: 10
Duration: 30 seconds

| Metric | Baseline |
|---|---:|
| Total HTTP requests | 2,830 |
| Throughput | 94.06 requests/second |
| p50 response time | 1.88 ms |
| p95 response time | 13.34 ms |
| p99 response time | 68.83 ms |
| HTTP failure rate | 0.00% |


