# Analytics Dashboard 📊

Hey! This is an analytics dashboard I built for visualizing invoice data with an AI-powered chat feature. You can ask questions in plain English and it generates SQL queries automatically.

## What It Does

- **Dashboard** - Shows KPIs, charts, and invoice tables
- **AI Chat** - Ask questions like "Show me overdue invoices" and get instant results
- **Auto Charts** - Automatically generates bar/line/pie charts based on your queries
- **Real-time Insights** - Calculates totals, averages, and key metrics

## Tech Stack

**Frontend:**
- Next.js 15 (React)
- Tailwind CSS + shadcn/ui
- Recharts (for visualizations)

**Backend:**
- Express.js (REST API)
- PostgreSQL + Prisma ORM
- Python FastAPI (AI service)

**AI:**
- Groq LLM (llama-3.3-70b-versatile)
- Custom SQL generation
- Natural language processing

---

## Quick Start

### What You Need
- Node.js 18+
- PostgreSQL 14+
- Python 3.11+

### 1. Install Everything
```bash
cd d:/Projects/analytics
npm install
```

### 2. Setup Database
```bash
# Create database
createdb analytics

# Run migrations
npx prisma migrate dev

# Load sample data
npm run seed
```

### 3. Configure Environment

Create `.env` file in the root (copy from `.env.example`):
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/analytics
GROQ_API_KEY your_groq_api_key_here
VANNA_SERVICE_URL=<your-render-service-url>
PORT=3001
```

Create `services/vanna/.env` (copy from `services/vanna/.env.example`):
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/analytics
GROQ_API_KEY your_groq_api_key_here
PORT=8000
```

**Get your Groq API key:** Sign up at https://console.groq.com (free tier available)

### 4. Start All Services

**Terminal 1 - Backend API:**
```bash
npm run dev:api
```

**Terminal 2 - Frontend:**
```bash
npm run dev:web
```

**Terminal 3 - AI Service:**
```bash
cd services/vanna
pip install -r requirements.txt
python app.py
```

### 5. Open the App
Go to **http://localhost:3000/dashboard**

---

## Project Structure

```
analytics/
├── apps/
│   ├── api/                 # Express backend (port 3001)
│   │   └── src/
│   │       ├── controllers/  # Business logic
│   │       ├── routes/      # API endpoints
│   │       └── services/    # Database queries
│   │
│   └── web/                 # Next.js frontend (port 3000)
│       ├── app/            # Pages (dashboard, chat)
│       ├── components/     # React components
│       └── lib/           # Utilities
│
├── services/
│   └── vanna/              # Python AI service (port 8000)
│       ├── app.py         # FastAPI app
│       └── requirements.txt
│
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # DB migrations
│
├── data/
│   └── Analytics_Test_Data.json  # Sample data
│
└── docs/
    ├── QUICKSTART.md      # Setup guide
    ├── DATABASE.md        # Schema explanation
    ├── API.md            # API documentation
    └── CHAT_WORKFLOW.md  # How AI chat works
```

---

## Features

### Dashboard
- 📈 **KPI Cards** - Total spend, invoice count, pending/overdue stats
- 📊 **Charts** - Invoice trends, top vendors, category breakdown, cash forecast
- 📋 **Invoice Table** - Searchable, filterable list of all invoices

### AI Chat
- 💬 **Natural Language** - Ask questions in plain English
- 🔍 **SQL Generation** - Groq AI converts questions to SQL
- 📊 **Auto Visualization** - Generates charts based on results
- 💡 **Smart Insights** - Calculates totals, averages automatically

**Example Questions:**
- "Show me all overdue invoices"
- "Top 5 vendors by spending"
- "Monthly invoice trends for the last 6 months"
- "What's the average invoice amount?"

---

## Documentation

### Getting Started
- **[QUICKSTART.md](docs/QUICKSTART.md)** - Detailed setup instructions for local development
- **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - Deploy to production in 30 minutes

### Technical Docs
- **[DATABASE.md](docs/DATABASE.md)** - Database schema and relationships
- **[API.md](docs/API.md)** - All API endpoints and examples
- **[CHAT_WORKFLOW.md](docs/CHAT_WORKFLOW.md)** - How the AI chat works

### Deployment
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Complete deployment guide (Vercel + Render + Neon)
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md)** - Security review and best practices

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stats` | GET | Dashboard KPIs |
| `/invoice-trends` | GET | Monthly invoice data |
| `/vendors/top10` | GET | Top vendors by spend |
| `/category-spend` | GET | Spending by category |
| `/cash-outflow` | GET | Payment forecast |
| `/invoices` | GET | Invoice list |
| `/chat-with-data` | POST | AI query endpoint |

See [API.md](docs/API.md) for detailed examples.

---

## Database Schema

**Tables:**
- `Vendor` - Vendor information
- `Customer` - Customer data
- `Invoice` - Main invoice records
- `LineItem` - Invoice line items
- `Payment` - Payment records

**Key Relationships:**
```
Vendor ──> Invoice <─── Customer
              ├──> LineItem
              └──> Payment
```

See [DATABASE.md](docs/DATABASE.md) for full schema details.

---

## Troubleshooting

**Port already in use:**
```bash
# Change port in .env
PORT=3002
```

**Database connection error:**
```bash
# Check PostgreSQL is running
pg_isready
```

**Prisma client not found:**
```bash
npx prisma generate
```

**Vanna service errors:**
```bash
# Check service is running
# Prefer using the proxy from the Next.js app
curl https://<your-vercel-domain>/api/chat-with-data
```

---

## TODO / Ideas for Improvement

- [ ] Add user authentication (NextAuth.js)
- [ ] Implement pagination for invoice table
- [ ] Add CSV export functionality
- [ ] Custom date range filters
- [ ] Dark mode toggle
- [ ] Mobile responsive improvements
- [ ] Add unit tests
- [ ] Set up CI/CD
- [ ] Better error handling

---

## How It Works

The AI chat follows this flow:

```
User Question
    ↓
Frontend (Next.js)
    ↓
Backend API (Express)
    ↓
Vanna AI (Python + Groq LLM)
    ↓
SQL Generation
    ↓
PostgreSQL Database
    ↓
Results + Charts
```

See [CHAT_WORKFLOW.md](docs/CHAT_WORKFLOW.md) for detailed explanation.

---

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [Express](https://expressjs.com/) - Backend API
- [Prisma](https://www.prisma.io/) - Database ORM
- [PostgreSQL](https://www.postgresql.org/) - Database
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- [Groq](https://groq.com/) - AI/LLM provider
- [Recharts](https://recharts.org/) - Chart library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components

---

Built by an intern trying to learn full-stack development! 🚀
