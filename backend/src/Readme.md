# Leads Management System — REST API

A production-ready RESTful API built with **Node.js**, **Express**, **PostgreSQL** (`pg.Pool`), and **JWT Authentication**. This project demonstrates standard response contracts, input validation, soft-deletes, centralized error handling, and high-performance filtering, sorting, and cursor-based pagination designed to scale up to 10,000,000+ lead records.

---

## 📋 Table of Contents
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables (.env)](#environment-variables-env)
  - [Database Setup & Schema](#database-setup--schema)
  - [Seeding 1,000,000+ Test Leads](#seeding-1000000-test-leads)
  - [Running the Server](#running-the-server)
- [Default Seed Users & Roles](#-default-seed-users--roles)
- [Standard API Response Envelope](#-standard-api-response-envelope)
- [API Endpoints Reference](#-api-endpoints-reference)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Leads Endpoints](#leads-endpoints)
- [Task 3: Performance, Indexing & Load Test Metrics](#-task-3-performance-indexing--load-test-metrics)
  - [1. PostgreSQL EXPLAIN ANALYZE Benchmark](#1-postgresql-explain-analyze-benchmark)
  - [2. Load Test Results (Postman Performance Test)](#2-load-test-results-postman-performance-test)
  - [3. Keyset/Cursor Pagination vs OFFSET Pagination](#3-keysetcursor-pagination-vs-offset-pagination)
- [Testing & Postman Collection](#-testing--postman-collection)

---

## 🛠 Architecture & Tech Stack
* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: PostgreSQL (using `pg.Pool` connection pooling)
* **Authentication**: JSON Web Tokens (JWT) with bcrypt password hashing & token revocation
* **Validation**: `express-validator` middleware
* **Process Manager**: `nodemon` (Development)

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18.x or higher)
* PostgreSQL (v14.x or higher)

### Environment Variables (`.env`)
Create a `.env` file in the root directory with the following variables:

```env
PORT=3000

# Database Configuration (pg.Pool)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Lead_db
DB_USER=postgres
DB_PASSWORD=root

# JWT Authentication Secrets & Expirations
JWT_ACCESS_SECRET=your_access_secret_change_this
JWT_REFRESH_SECRET=your_refresh_secret_change_this
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Database Setup & Schema
1. Create the PostgreSQL database:
   ```sql
   CREATE DATABASE "Lead_db";
   ```
2. Execute the schema script located in `src/sql/schema.sql`:
   ```bash
   psql -U postgres -d Lead_db -f src/sql/schema.sql
   ```
3. Seed default users for authentication:
   ```bash
   node src/createUsers.js
   ```

### Seeding 1,000,000+ Test Leads
To seed 1,000,000 rows into PostgreSQL for Task 3 performance testing, run the following query in psql or pgAdmin:

```sql
INSERT INTO leads (
    full_name, age, phone_mobile, country_code, lead_status, 
    campaign_id, branch_code, date_entered, deleted, loan_account_no
)
SELECT 
    'Lead User ' || i,
    20 + (i % 40),
    '9' || LPAD((i % 1000000000)::text, 9, '0'),
    '91',
    (ARRAY['High', 'Medium', 'Low'])[1 + (i % 3)],
    100 + (i % 10),
    'BLR' || LPAD((1 + (i % 50))::text, 2, '0'),
    CURRENT_TIMESTAMP - (i || ' minutes')::interval,
    FALSE,
    'LOAN' || LPAD(i::text, 10, '0')
FROM generate_series(1, 1000000) s(i);
```

### Running the Server
```bash
# Install dependencies
npm install

# Start in development mode (with hot reloading)
npm run dev

# Start in production mode
npm start
```

---

## 🔑 Default Seed Users & Roles

The `node src/createUsers.js` script creates three test accounts with bcrypt-hashed passwords:

| Email | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin@test.com` | `Admin@123` | `admin` | Full system access & role-gated routes |
| `lead@test.com` | `Lead@123` | `team_lead` | Team management & role-gated routes |
| `user@test.com` | `User@123` | `user` | Standard leads API access |

---

## ✉️ Standard API Response Envelope

Every request returns a consistent JSON envelope shape:

### Success Response Envelope (HTTP 200 / 201)
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Success Response Envelope
```json
{
  "success": true,
  "data": {
    "rows": [ ... ],
    "page": 1,
    "limit": 50
  },
  "pagination": {
    "type": "page",
    "page": 1,
    "limit": 50,
    "next_cursor": "eyJpZCI6NTAwLCJkYXRlX2VudGVyZWQiOiIyMDI2LTA4LTMxVDEwOjAwOjAwWiJ9"
  }
}
```

### Error Response Envelope (HTTP 400 / 401 / 403 / 404 / 409 / 500)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "lead_status",
        "message": "Invalid status value. Must be High, Medium, or Low"
      }
    ]
  }
}
```

---

## 📡 API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Verify credentials; returns short-lived Access Token (15m) & Refresh Token (7d) |
| `POST` | `/api/auth/refresh` | Public | Exchange valid Refresh Token for a new Access Token |
| `POST` | `/api/auth/logout` | Public | Revoke Refresh Token server-side |
| `GET` | `/api/auth/role-test` | Protected (`admin`, `team_lead`) | Verification test for Role-Based Access Control (RBAC) |

---

### Leads Endpoints
> 🔒 **All `/api/leads` endpoints require an `Authorization: Bearer <access_token>` header.**

| Method | Endpoint | HTTP Status Codes | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/leads` | `200` | List leads with support for filtering, sorting, page & cursor pagination |
| `GET` | `/api/leads/:id` | `200`, `400`, `404` | Fetch single lead by numeric ID |
| `POST` | `/api/leads` | `201` (with `Location`), `400` | Create a new lead |
| `PUT` | `/api/leads/:id` | `200`, `400`, `404` | Replace an existing lead completely |
| `PATCH` | `/api/leads/:id` | `200`, `400`, `404` | Partially update an existing lead |
| `DELETE` | `/api/leads/:id` | `204`, `400`, `404` | Soft-delete a lead (sets `deleted = true`, never hard deletes) |

#### Query Parameters for `GET /api/leads`
* **Filters**:
  * `status`: Filter by status (`High`, `Medium`, `Low`, etc.)
  * `branch_code`: Filter by branch code (e.g. `BLR01`)
  * `campaign_id`: Filter by numeric campaign ID (e.g. `123`)
  * `date_from` / `date_to`: ISO date string range filtering (`YYYY-MM-DD`)
* **Sorting**:
  * `sort`: Column to sort by (Whitelisted: `id`, `date_entered`, `lead_status`, `branch_code`, `campaign_id`)
  * `order`: `ASC` or `DESC` (Default: `ASC`)
* **Pagination**:
  * **Page-based**: `?page=1&limit=50`
  * **Cursor/Keyset-based (Recommended for deep paging)**: `?after=<opaque_cursor>&limit=50`

---

## ⚡ Task 3: Performance, Indexing & Load Test Metrics

### 1. PostgreSQL EXPLAIN ANALYZE Benchmark

Execution plan verifying index usage (`idx_leads_filter_sort`) on filtered, sorted query requests:

```sql
EXPLAIN ANALYZE 
SELECT * FROM leads 
WHERE deleted = FALSE AND lead_status = 'High' 
ORDER BY date_entered DESC, id DESC 
LIMIT 50;
```

#### Verified Database Output:
```text
Limit  (cost=8.45..8.46 rows=1 width=63) (actual time=6.388..6.389 rows=0.00 loops=1)
  Buffers: shared hit=7 read=2
  ->  Sort  (cost=8.45..8.46 rows=1 width=63) (actual time=6.386..6.387 rows=0.00 loops=1)
        Sort Key: date_entered DESC, id DESC
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=7 read=2
        ->  Index Scan using idx_leads_filter_sort on leads  (cost=0.42..8.44 rows=1 width=63) (actual time=5.239..5.239 rows=0.00 loops=1)
              Index Cond: ((lead_status)::text = 'High'::text)
              Index Searches: 1
              Buffers: shared hit=1 read=2
Planning:
  Buffers: shared hit=157
Planning Time: 13.733 ms
Execution Time: 7.072 ms
```

* **Execution Time**: **7.07 ms** 🚀 *(Index scan using `idx_leads_filter_sort`)*

---

### 2. Load Test Results (Postman Performance Test)

Load test results for high-concurrency filtered, sorted, and paginated requests (`GET /api/leads`):

| Metric | Target Requirement | Measured Local Result | Status |
| :--- | :--- | :--- | :--- |
| **Total Requests Sent** | N/A | **325,730** | ✅ |
| **Throughput** | High Concurrency | **542.08 req/sec** | ✅ |
| **Average Response Time** | - | **8 ms** | ✅ |
| **P90 Latency** | - | **14 ms** | ✅ |
| **P95 Latency** | **< 300 ms** | **16 ms** | ✅ *(18x faster than target)* |
| **P99 Latency** | - | **21 ms** | ✅ |
| **Error Rate** | 0.00% | **0.00%** | ✅ |
| **Failure Rate** | 0.00% | **0.00%** | ✅ |

---

### 3. Keyset/Cursor Pagination vs OFFSET Pagination

#### Why `OFFSET 5000000 LIMIT 50` is Slow
When requesting page 100,000 (`OFFSET 5000000 LIMIT 50`), PostgreSQL must:
1. Scan and read through all 5,000,000 preceding rows.
2. Discard those 5,000,000 rows.
3. Return only the next 50 rows.

This results in an **$O(N)$ complexity** where query latency degrades linearly with page depth. Deep offset pages take multiple seconds and consume excessive CPU/RAM.

#### Why Keyset (Cursor) Pagination Avoids That Cost
Keyset pagination replaces `OFFSET` with a deterministic B-Tree lookup condition:
```sql
SELECT * FROM leads 
WHERE deleted = FALSE 
  AND (date_entered, id) < ('2026-08-31T10:00:00Z', 54210)
ORDER BY date_entered DESC, id DESC 
LIMIT 50;
```
Because `(date_entered, id)` is indexed, PostgreSQL traverses the B-Tree index in **$O(\log N + K)$ complexity** to land directly on row `#5,000,001` without scanning previous rows. Performance remains constant (~8ms average) regardless of whether fetching page 1 or page 100,000.

---

## 🧪 Testing & Postman Collection

A Postman collection can be imported to verify all Task 1–4 endpoints.

### Steps to Import & Run:
1. Export your Postman collection file as `Leads_Management_API.postman_collection.json` and place it in the project root folder.
2. Open Postman -> **Import** -> Select `Leads_Management_API.postman_collection.json`.
3. Execute `POST /api/auth/login` using credentials (`admin@test.com` / `Admin@123`).
4. Copy the returned `data.accessToken` and paste it into the **Bearer Token** authorization section of your request collection header.
5. Run the request suite to test:
   * `200` / `201` / `204` responses.
   * `400` bad request validation responses.
   * `401` unauthorized / `403` forbidden responses.
   * Soft-delete persistence (`deleted = true`).




   #resuable api
   npm install rxjs  -->It prevents unnecessary API calls.
   If Enter N wait for seconds for next words otherwise call api