# How the AI Chat Works

So I built this cool "Chat with Data" feature that lets you ask questions in plain English and it generates SQL queries to answer them. Here's how the whole thing works under the hood.

## The Basic Flow

```
You type a question
      ↓
Frontend (Next.js)
      ↓
Backend API (Express)
      ↓
Vanna AI Service (Python + Groq)
      ↓
PostgreSQL Database
      ↓
   Results
```

---

## Step-by-Step Flow

### 1. User Asks a Question

You type something like: **"Show me all overdue invoices"**

The chat page (`apps/web/app/chat/page.tsx`) captures this and sends it to the backend:

```typescript
// Frontend code
const response = await fetch('/api/chat-with-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: input })
})
```

---

### 2. Backend Receives Request

The Express API (`apps/api/src/routes/chat.routes.ts`) receives your question:

```typescript
router.post('/chat-with-data', async (req, res) => {
  const { question } = req.body
  
  // Validate question exists
  if (!question) {
    return res.status(400).json({ error: 'Question is required' })
  }
  
  // Forward to Vanna service...
})
```

The backend doesn't actually do the AI stuff - it just acts as a middleman between the frontend and the Python service.

---

### 3. Forward to Vanna AI Service

The backend proxies the request to the Vanna AI service (running on port 8000):

```typescript
// Use the server-side proxy /api/chat-with-data to avoid browser CORS.
// Direct calls require VANNA_SERVICE_URL to be set on the server.
const vannaUrl = process.env.VANNA_SERVICE_URL

const response = await fetch(`${vannaUrl}/query`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question })
})
```

---

### 4. Vanna AI Processes the Question

This is where the magic happens! The Python service (`services/vanna/app.py`) does several things:

#### 4a. Get Database Schema
First, it fetches the database structure:

```python
def get_schema(db_url):
    # Connects to PostgreSQL
    # Reads all table and column names
    # Returns formatted schema
```

This tells the AI what tables and columns exist.

#### 4b. Generate SQL with Groq LLM
Then it uses Groq's AI model to convert your question into SQL:

```python
def generate_sql(question, db_url):
    schema = get_schema(db_url)
    
    # Build a prompt for the AI
    prompt = f"""
    You are a SQL expert. Convert this question to SQL.
    
    Database Schema:
    {schema}
    
    Question: {question}
    
    Return only the SQL query.
    """
    
    # Call Groq API (using llama-3.3-70b-versatile model)
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    
    sql = completion.choices[0].message.content
    return sql
```

**Example output:**
```sql
SELECT * FROM "Invoice" WHERE "status" = 'OVERDUE'
```

#### 4c. Execute SQL on Database
Finally, it runs that SQL on PostgreSQL:

```python
with psycopg.connect(db_url) as conn:
    with conn.cursor() as cur:
        cur.execute(sql)
        columns = [d[0] for d in cur.description]  # Column names
        rows = cur.fetchall()  # Actual data
```

---

### 5. Return Results

The Vanna service sends back a JSON response:

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

---

### 6. Backend Forwards Response

The Express API just passes this along to the frontend:

```typescript
const data = await response.json()
res.json(data)  // Send to frontend
```

---

### 7. Frontend Displays Results

The chat page receives the response and displays:

1. **Your question** - In a purple bubble
2. **Generated SQL** - In a dark code box
3. **Key insights** - Blue info card with stats
4. **Auto-generated chart** - If the data fits a pattern
5. **Data table** - Scrollable table with all results

The frontend is smart enough to detect what kind of chart to show:
- **Line chart** - For time series data (monthly trends, forecasts)
- **Bar chart** - For comparisons (top vendors, categories)
- **Pie chart** - For distributions (status breakdown)

```typescript
// Frontend logic
const shouldVisualize = (data) => {
  // Check if data has time columns
  const hasTime = columns.some(c => 
    c.includes('date') || c.includes('month')
  )
  if (hasTime) return 'line'
  
  // Check if it's aggregated data
  const hasAggregation = columns.some(c => 
    c.includes('count') || c.includes('total')
  )
  if (hasAggregation) return 'bar'
  
  // Small categorical data
  if (rows.length <= 10) return 'pie'
  
  return null  // Just show table
}
```
---

## Safety Features

The AI service has guardrails to prevent dangerous SQL:

```python
# Check for forbidden keywords
forbidden = ["drop", "insert", "update", "delete", "alter"]
if any(keyword in sql.lower() for keyword in forbidden):
    raise HTTPException(400, "Unsafe SQL generated")
```

This prevents the AI from:
- Deleting data (`DROP TABLE`)
- Modifying data (`UPDATE`, `DELETE`, `INSERT`)
- Changing schema (`ALTER TABLE`)

Only `SELECT` queries are allowed!

---


This is the whole workflow