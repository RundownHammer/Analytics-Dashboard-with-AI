from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import psycopg
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Debug: Print loaded environment variables
print(f"DATABASE_URL loaded: {os.getenv('DATABASE_URL') is not None}")
print(f"GROQ_API_KEY loaded: {os.getenv('GROQ_API_KEY') is not None}")
print(f"PORT: {os.getenv('PORT', '8000')}")

app = FastAPI()
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
origin_list = [o.strip() for o in allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origin_list if origin_list != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    question: str

def get_schema(db_url: str) -> str:
    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            # Get table and column information
            cur.execute(
                """
                SELECT table_name, column_name, data_type, udt_name
                FROM information_schema.columns
                WHERE table_schema='public' AND table_name NOT LIKE '_prisma%'
                ORDER BY table_name, ordinal_position
                """
            )
            rows = cur.fetchall()
            
            # Get enum values for InvoiceStatus
            cur.execute(
                """
                SELECT enumlabel 
                FROM pg_enum 
                JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
                WHERE pg_type.typname = 'InvoiceStatus'
                """
            )
            enum_values = [r[0] for r in cur.fetchall()]
    
    schema_lines = []
    schema_lines.append("Tables and Columns:")
    for table, col, dtype, udt_name in rows:
        if dtype == 'USER-DEFINED':
            schema_lines.append(f'  "{table}"."{col}" (enum InvoiceStatus: {", ".join(enum_values)})')
        else:
            schema_lines.append(f'  "{table}"."{col}" ({dtype})')
    
    schema_lines.append("\nKey Relationships:")
    schema_lines.append('  "Invoice"."vendorId" -> "Vendor"."id"')
    schema_lines.append('  "Invoice"."customerId" -> "Customer"."id"')
    schema_lines.append('  "LineItem"."invoiceId" -> "Invoice"."id"')
    schema_lines.append('  "Payment"."invoiceId" -> "Invoice"."id"')
    
    return "\n".join(schema_lines)

def generate_sql(question: str, db_url: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        # Fallback heuristic SQL for common questions
        lower = question.lower()
        if "overdue" in lower:
            return (
                'SELECT id, "invoiceNumber", "vendorId", "issueDate", "dueDate", "totalAmount", status '
                'FROM "Invoice" WHERE status = \"OVERDUE\" ORDER BY "dueDate" ASC;'
            )
        if "top" in lower and "vendor" in lower:
            return (
                'SELECT v.name, SUM(i."totalAmount") AS spend FROM "Invoice" i '
                'JOIN "Vendor" v ON v.id = i."vendorId" GROUP BY v.name ORDER BY spend DESC LIMIT 5;'
            )
        return 'SELECT COUNT(*) AS count FROM "Invoice";'

    client = Groq(api_key=api_key)
    schema = get_schema(db_url)
    prompt = f"""You are a PostgreSQL expert. Generate a SQL query based on the user's question and the schema below.

CRITICAL RULES:
1. ALL table names MUST be in double quotes: "Invoice", "Vendor", "Customer", "LineItem", "Payment"
2. ALL column names MUST be in double quotes: "id", "vendorId", "totalAmount", etc.
3. InvoiceStatus enum values are UPPERCASE: 'PENDING', 'PAID', 'OVERDUE', 'PARTIAL', 'CANCELLED'
4. Only SELECT queries - no INSERT, UPDATE, DELETE, DROP, or ALTER
5. Return ONLY the SQL query - no markdown, no explanations, no formatting

{schema}

Question: {question}

Examples:
- SELECT COUNT(*) FROM "Invoice" WHERE "status" = 'PAID'
- SELECT "name", SUM("totalAmount") FROM "Vendor" v JOIN "Invoice" i ON v."id" = i."vendorId" GROUP BY "name"
"""
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=512,
    )
    sql = completion.choices[0].message.content.strip()
    # Basic guardrails
    forbidden = [";", "--", "drop ", "insert ", "update ", "delete ", "alter "]
    if any(x in sql.lower() for x in forbidden if x != ";"):
        raise HTTPException(status_code=400, detail="Unsafe SQL generated")
    return sql

@app.get('/health')
def health():
    return {"status": "ok"}

@app.post('/query')
def query(q: Query):
    try:
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            raise HTTPException(status_code=500, detail='DATABASE_URL not set')
        
        print(f"Processing question: {q.question}")
        sql = generate_sql(q.question, db_url)
        print(f"Generated SQL: {sql}")
        
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                cols = [d[0] for d in cur.description]
                rows = cur.fetchall()
        
        print(f"Query returned {len(rows)} rows")
        return {"sql": sql, "columns": cols, "rows": rows}
    except psycopg.Error as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        print(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
 
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
