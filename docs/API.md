# API Documentation

This doc covers all the API endpoints I built. The backend runs on **http://localhost:3001** by default.

## Base URL
```
http://localhost:3001
```

All responses are in JSON format.

---

## Endpoints

### 1. Get Dashboard Stats
Get the main KPI numbers for the dashboard.

**Endpoint:** `GET /stats`

**Response:**
```json
{
  "totalSpendYTD": 12679.25,
  "invoiceCount": 47,
  "pendingInvoices": 39,
  "overdueInvoices": 6
}
```

**What it does:**
- `totalSpendYTD` - Sum of all invoice amounts this year
- `invoiceCount` - Total number of invoices
- `pendingInvoices` - Invoices with status PENDING
- `overdueInvoices` - Invoices with status OVERDUE

**Example usage:**
```javascript
fetch('http://localhost:3001/stats')
  .then(res => res.json())
  .then(data => console.log(data))
```

---

### 2. Get Invoice Trends
Monthly invoice data for trend charts.

**Endpoint:** `GET /invoice-trends`

**Response:**
```json
[
  {
    "month": "2025-11",
    "count": 47,
    "totalSpend": 12679.25
  },
  {
    "month": "2025-10", 
    "count": 0,
    "totalSpend": 0
  }
]
```

**What it does:**
- Groups invoices by month (issue date)
- Counts invoices per month
- Sums total amounts per month
- Returns last 6 months

**SQL behind the scenes:**
```sql
SELECT 
  TO_CHAR("issueDate", 'YYYY-MM') as month,
  COUNT(*) as count,
  SUM("totalAmount") as totalSpend
FROM "Invoice"
WHERE "issueDate" >= NOW() - INTERVAL '6 months'
GROUP BY month
ORDER BY month DESC
```

---

### 3. Get Top 10 Vendors
Vendors ranked by total spending.

**Endpoint:** `GET /vendors/top10`

**Response:**
```json
[
  {
    "name": "Acme Software GmbH",
    "totalSpend": 4572.00,
    "invoiceCount": 38
  },
  {
    "name": "TechVendor Inc",
    "totalSpend": 3653.30,
    "invoiceCount": 1
  }
]
```

**What it does:**
- Joins Vendor and Invoice tables
- Groups by vendor name
- Sums total amounts
- Sorts by total spend (highest first)
- Limits to top 10

---

### 4. Get Category Spending
Breakdown of spending by vendor category.

**Endpoint:** `GET /category-spend`

**Response:**
```json
[
  {
    "category": "Software",
    "totalSpend": 8453.25,
    "percentage": 66.7
  },
  {
    "category": "Hardware",
    "totalSpend": 2840.00,
    "percentage": 22.4
  },
  {
    "category": "Services",
    "totalSpend": 1386.00,
    "percentage": 10.9
  }
]
```

**What it does:**
- Groups invoices by vendor category
- Calculates total spend per category
- Computes percentage of total

---

### 5. Get Cash Outflow Forecast
Predicted cash outflow based on due dates.

**Endpoint:** `GET /cash-outflow`

**Response:**
```json
[
  {
    "month": "2025-11",
    "outflow": 5420.50,
    "invoiceCount": 12
  },
  {
    "month": "2025-12",
    "outflow": 3200.00,
    "invoiceCount": 8
  }
]
```

**What it does:**
- Groups unpaid invoices by due date month
- Sums amounts due each month
- Returns next 12 months
- Only includes PENDING, OVERDUE, PARTIAL statuses

**Use case:** Planning when you need cash for upcoming payments

---

### 6. Get Invoices with Vendors
List all invoices with vendor details.

**Endpoint:** `GET /invoices`

**Query Parameters:**
- `status` (optional) - Filter by status (PENDING, PAID, OVERDUE, etc.)
- `vendor` (optional) - Filter by vendor name
- `limit` (optional) - Max results (default: 100)
- `offset` (optional) - For pagination (default: 0)

**Response:**
```json
[
  {
    "id": "cmhrf5qt10003vn34euhxevun",
    "invoiceNumber": "INV-001",
    "vendor": {
      "id": "vendor123",
      "name": "Acme Corp",
      "category": "Software"
    },
    "customer": {
      "id": "cust456",
      "name": "Tech Solutions"
    },
    "status": "PENDING",
    "issueDate": "2025-11-01T00:00:00.000Z",
    "dueDate": "2025-11-30T00:00:00.000Z",
    "totalAmount": 1190.00,
    "createdAt": "2025-11-09T07:55:58.837Z"
  }
]
```

**Example with filters:**
```
GET /invoices?status=OVERDUE&limit=20
GET /invoices?vendor=Acme&limit=50
```

---

### 7. Chat with Data (AI Feature)
Ask questions in natural language, get SQL results.

**Endpoint:** `POST /chat-with-data`

**Request Body:**
```json
{
  "question": "Show me all overdue invoices"
}
```

**Response:**
```json
{
  "sql": "SELECT * FROM \"Invoice\" WHERE \"status\" = 'OVERDUE'",
  "columns": ["id", "invoiceNumber", "vendorId", "status", "totalAmount"],
  "rows": [
    ["id1", "INV-001", "vendor1", "OVERDUE", 1500.00],
    ["id2", "INV-002", "vendor2", "OVERDUE", 850.00]
  ]
}
```

**What it does:**
1. Sends question to Vanna AI service (Python/FastAPI)
2. Vanna generates SQL using Groq LLM
3. Executes SQL on PostgreSQL
4. Returns SQL + results

**Example questions:**
- "How many invoices are pending?"
- "Top 5 vendors by spending"
- "Show me invoices due this month"
- "What's the average invoice amount?"

**Error response:**
```json
{
  "error": "Vanna service returned 500"
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

**200 OK** - Success
```json
{ "data": [...] }
```

**400 Bad Request** - Invalid request
```json
{ "error": "Question is required" }
```

**500 Internal Server Error** - Server error
```json
{ "error": "Database connection failed" }
```

---

## Testing the API

### Using curl
```bash
# Get stats
curl http://localhost:3001/stats

# Get invoices
curl http://localhost:3001/invoices

# Chat with data
curl -X POST http://localhost:3001/chat-with-data \
  -H "Content-Type: application/json" \
  -d '{"question": "How many invoices?"}'
```

### Using browser
Just open these URLs:
- http://localhost:3001/stats
- http://localhost:3001/invoices
- http://localhost:3001/vendors/top10

---

That's all the API endpoint. Pretty straightforward REST API that feeds data to the dashboard 

- GET /cash-outflow
  - Expected cash outflow by aging bucket
  - Response: [{"bucket":"Overdue","cash_outflow":"0"}, ...]

- GET /invoices?q=<query>&status=<PENDING|PAID|OVERDUE|PARTIAL>
  - Searchable, filterable list of invoices
  - Response: Array of invoices with vendor included

- POST /chat-with-data
  - Body: {"question":"What's the total spend in the last 90 days?"}
  - Proxies request to Vanna AI service and returns { sql, columns, rows }
