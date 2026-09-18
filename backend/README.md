//Packages
npm install express pg dotenv express-validator

npm install jsonwebtoken

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

