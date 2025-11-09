# Deployment Architecture Diagram

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                            │
│                     (Your Users)                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
        ┌───────────────────────────────────┐
        │         VERCEL (Frontend)         │
        │  https://yourapp.vercel.app       │
        ├───────────────────────────────────┤
        │                                   │
        │  ┌─────────────────────────────┐  │
        │  │     Next.js Frontend        │  │
        │  │  - React Components         │  │
        │  │  - Dashboard Page           │  │
        │  │  - Chat Interface           │  │
        │  │  - Charts & Visualizations  │  │
        │  └─────────────────────────────┘  │
        │                                   │
        │  ┌─────────────────────────────┐  │
        │  │     Express.js API          │  │
        │  │  - GET /api/stats           │  │
        │  │  - GET /api/invoices        │  │
        │  │  - GET /api/vendors/top10   │  │
        │  │  - POST /api/chat-with-data │  │
        │  └─────────────────────────────┘  │
        │            │                      │
        └────────────┼──────────────────────┘
                     │
                     │ Proxies chat queries
                     │ (Server-side call)
                     ▼
        ┌───────────────────────────────────┐
        │      RENDER (AI Service)          │
        │  https://analytics-vanna.onrender │
        ├───────────────────────────────────┤
        │                                   │
        │  ┌─────────────────────────────┐  │
        │  │   FastAPI (Python)          │  │
        │  │  - POST /query              │  │
        │  │  - GET /health              │  │
        │  └─────────────────────────────┘  │
        │                                   │
        │  ┌─────────────────────────────┐  │
        │  │   Groq SDK                  │  │
        │  │  - LLM: llama-3.3-70b       │  │
        │  │  - Natural Language → SQL   │  │
        │  └─────────────────────────────┘  │
        │            │                      │
        └────────────┼──────────────────────┘
                     │
                     │ Executes SQL
                     │ (psycopg2)
                     ▼
        ┌───────────────────────────────────┐
        │      NEON (PostgreSQL)            │
        │  Managed Database                 │
        ├───────────────────────────────────┤
        │                                   │
        │  📊 Tables:                       │
        │  - Vendor (Suppliers)             │
        │  - Customer (Clients)             │
        │  - Invoice (Main records)         │
        │  - LineItem (Invoice details)     │
        │  - Payment (Transactions)         │
        │                                   │
        │  🔒 Features:                     │
        │  - Auto backups                   │
        │  - SSL required                   │
        │  - Auto-suspend (free tier)       │
        │  - Connection pooling             │
        │                                   │
        └───────────────────────────────────┘
```

---

## User Flow

### 1. Dashboard View
```
User → https://yourapp.vercel.app/dashboard
  ↓
Next.js renders page
  ↓
Fetch data from /api/stats, /api/invoice-trends, etc.
  ↓
Express API queries Neon database
  ↓
Returns aggregated data
  ↓
Recharts renders visualizations
```

### 2. AI Chat Flow
```
User types: "Show me overdue invoices"
  ↓
POST /api/chat-with-data
  ↓
Express API proxies to Render
  ↓
Vanna AI (FastAPI) receives question
  ↓
Groq LLM generates SQL:
  SELECT * FROM "Invoice" WHERE "status" = 'OVERDUE'
  ↓
Vanna executes SQL on Neon
  ↓
Results returned to Express
  ↓
Express returns to Next.js
  ↓
Frontend auto-generates:
  - Data table
  - Bar/line/pie chart (based on data)
  - Insights panel (totals, averages)
```

---

## Deployment Platforms

### Vercel (Frontend + API)
```
┌──────────────────────────────┐
│ VERCEL                       │
├──────────────────────────────┤
│ Plan: Free (Hobby)           │
│ Region: Automatic            │
│ Framework: Next.js           │
│ Build: Automatic on push     │
│ SSL: Automatic               │
│ CDN: Global                  │
│ Cost: $0/month               │
└──────────────────────────────┘

Environment Variables:
├─ NEXT_PUBLIC_API_BASE=/api
├─ NEXT_PUBLIC_APP_URL=https://yourapp.vercel.app
├─ DATABASE_URL=<neon-connection>
├─ VANNA_SERVICE_URL=https://analytics-vanna.onrender.com
├─ GROQ_API_KEY=<your-key>
└─ PORT=3001
```

### Render (Python AI Service)
```
┌──────────────────────────────┐
│ RENDER                       │
├──────────────────────────────┤
│ Plan: Free                   │
│ Region: Oregon (US West)     │
│ Runtime: Python 3.11         │
│ Build: pip install           │
│ Start: uvicorn app           │
│ SSL: Automatic               │
│ Spin-down: After 15min       │
│ Cost: $0/month               │
└──────────────────────────────┘

Environment Variables:
├─ DATABASE_URL=<neon-connection>
├─ GROQ_API_KEY=<your-key>
└─ PORT=8000
```

### Neon (PostgreSQL)
```
┌──────────────────────────────┐
│ NEON                         │
├──────────────────────────────┤
│ Plan: Free                   │
│ Region: US East              │
│ Storage: 512MB               │
│ Compute: 0.25 CU             │
│ Auto-suspend: After 5min     │
│ Backups: Automatic           │
│ SSL: Required                │
│ Cost: $0/month               │
└──────────────────────────────┘

Connection String:
postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require
```

---

## Data Flow Diagram

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  Vercel  │────▶│  Render  │────▶│   Neon   │
│ Browser  │     │ Next.js  │     │  Vanna   │     │PostgreSQL│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                 │                │
     │ 1. Request     │ 2. Proxy        │ 3. SQL Query   │
     │ page/data      │ to Vanna        │ to database    │
     │                │                 │                │
     │◀───────────────┤◀────────────────┤◀───────────────┤
     │ 7. Display     │ 6. Return       │ 5. Return      │
     │ results        │ JSON + SQL      │ rows           │
     │                │                 │                │
     │                │                 │ 4. Execute SQL │
     │                │                 │ on PostgreSQL  │
```

**Step by step:**
1. User requests page or submits chat query
2. Vercel (Next.js) handles request
3. For chat: Vercel proxies to Render (Vanna AI)
4. Vanna generates SQL using Groq LLM
5. Vanna executes SQL on Neon database
6. Results flow back through Render → Vercel
7. Vercel returns data to user's browser
8. React renders UI with charts

---

## Network Architecture

```
                    INTERNET
                       │
         ──────────────┼──────────────
        │              │              │
        ▼              ▼              ▼
   CloudFlare      Vercel CDN    Render Proxy
      (DNS)       (Edge Network)     (SSL)
        │              │              │
        └──────────────┼──────────────┘
                       │
                  LOAD BALANCER
                       │
         ──────────────┼──────────────
        │              │              │
        ▼              ▼              ▼
    Frontend       API Routes     Python Service
   (React/Next)  (Express.js)     (FastAPI)
                       │              │
                       └──────┬───────┘
                              │
                              ▼
                        PostgreSQL
                      (Neon Cloud)
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────┐
│                   Security Layers                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. HTTPS/SSL (All traffic encrypted)              │
│     └─ Vercel: Automatic                           │
│     └─ Render: Automatic                           │
│     └─ Neon: Required                              │
│                                                     │
│  2. Environment Variables (Secrets management)     │
│     └─ Vercel: Encrypted env vars                 │
│     └─ Render: Encrypted env vars                 │
│     └─ Never in code                               │
│                                                     │
│  3. Database (Access control)                      │
│     └─ SSL/TLS required                            │
│     └─ IP allowlist (optional)                     │
│     └─ User permissions                            │
│                                                     │
│  4. API (Request validation)                       │
│     └─ CORS enabled                                │
│     └─ Input sanitization                          │
│     └─ SQL injection prevention (Prisma/psycopg2)  │
│                                                     │
│  5. AI Service (Query filtering)                   │
│     └─ Forbidden keywords: DROP, DELETE, UPDATE    │
│     └─ Read-only queries                           │
│     └─ Schema-aware generation                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Scaling Strategy

### Current (Free Tier)
```
Vercel:  100 deployments/day, 100GB bandwidth
Render:  750 hours/month (1 service always on)
Neon:    512MB storage, 1 project
         
Handles: ~1,000 users/month
         ~10,000 API requests/month
         Perfect for: Portfolio, demo, intern showcase
```

### Scale to 10K Users
```
Vercel Pro:     $20/month (unlimited)
Render Starter: $7/month (no spin-down)
Neon Pro:       $19/month (10GB, always-on)

Total: $46/month

Handles: ~10,000 users/month
         ~1M API requests/month
         Perfect for: Small business, startup
```

### Scale to 100K Users
```
Vercel Pro:     $20/month
Render Pro:     $25/month (1GB RAM)
Neon Scale:     $69/month (50GB, better compute)
Redis Cache:    $10/month (Upstash)

Total: $124/month

Handles: ~100,000 users/month
         ~10M API requests/month
         Perfect for: Growing business
```

---

## Monitoring & Logs

```
┌─────────────────────────────────────────┐
│          VERCEL DASHBOARD               │
├─────────────────────────────────────────┤
│  📊 Analytics                           │
│  - Page views                           │
│  - Unique visitors                      │
│  - Top pages                            │
│                                         │
│  📋 Logs                                │
│  - Build logs                           │
│  - Runtime logs                         │
│  - Function logs                        │
│                                         │
│  ⚡ Performance                         │
│  - Core Web Vitals                      │
│  - Load time                            │
│  - Time to Interactive                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          RENDER DASHBOARD               │
├─────────────────────────────────────────┤
│  📊 Metrics                             │
│  - CPU usage                            │
│  - Memory usage                         │
│  - Request count                        │
│                                         │
│  📋 Logs                                │
│  - Build logs                           │
│  - Service logs (stdout/stderr)         │
│  - Error tracking                       │
│                                         │
│  ⏰ Health                              │
│  - Uptime                               │
│  - Response time                        │
│  - Error rate                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          NEON DASHBOARD                 │
├─────────────────────────────────────────┤
│  📊 Database                            │
│  - Storage used                         │
│  - Active connections                   │
│  - Queries per second                   │
│                                         │
│  📋 Operations                          │
│  - Query logs                           │
│  - Slow queries                         │
│  - Connection events                    │
│                                         │
│  💾 Backups                             │
│  - Point-in-time recovery               │
│  - Restore options                      │
│  - Retention period                     │
└─────────────────────────────────────────┘
```

---

## Continuous Deployment

```
Developer Workflow:

1. Make changes locally
   ├─ Edit code
   ├─ Test locally
   └─ Commit to Git

2. Push to GitHub
   └─ git push origin master

3. Automatic Deployment
   ├─ Vercel detects push
   │  ├─ Runs build
   │  ├─ Runs tests
   │  └─ Deploys to production
   │
   └─ Render detects push
      ├─ Runs pip install
      ├─ Starts uvicorn
      └─ Service live

4. Live in ~2-3 minutes
   └─ https://yourapp.vercel.app updated

Branch Strategy:
- master → Production
- develop → Preview deployment
- feature/* → Unique preview URLs
```

---

## Backup & Recovery

```
┌──────────────────────────────────────┐
│          BACKUP STRATEGY             │
├──────────────────────────────────────┤
│                                      │
│  📝 Code                             │
│  ├─ Git (GitHub)                     │
│  ├─ All history preserved            │
│  └─ Can rollback anytime             │
│                                      │
│  🗄️ Database                         │
│  ├─ Neon automatic backups           │
│  ├─ Point-in-time recovery           │
│  └─ Manual pg_dump available         │
│                                      │
│  ⚙️ Configuration                    │
│  ├─ Environment vars in dashboards   │
│  ├─ Document in .env.example         │
│  └─ Password manager for secrets     │
│                                      │
│  🔄 Recovery Time                    │
│  ├─ Code: < 5 minutes (git revert)  │
│  ├─ Database: < 30 minutes (restore) │
│  └─ Full system: < 1 hour            │
│                                      │
└──────────────────────────────────────┘
```

---

## Cost Optimization Tips

```
1. Use Free Tiers First
   ✅ Perfect for: Portfolio, demos, learning
   ⚠️ Limitations: Spin-down delays, resource limits

2. Upgrade Only When Needed
   📊 Metrics to watch:
   - Response time > 2s consistently
   - 429 (rate limit) errors
   - Storage > 400MB
   - Bandwidth > 80GB

3. Optimize Performance
   - Enable caching (Vercel Edge)
   - Optimize images (Next.js Image)
   - Database indexes (already done!)
   - Lazy load components

4. Monitor Costs
   - Set up billing alerts
   - Review dashboards monthly
   - Archive old data
   - Implement pagination
```

---

## Summary

**Your app will be deployed across 3 platforms:**

1. **Vercel** - Frontend & API (same domain)
   - Fast, global CDN
   - Automatic SSL
   - Easy deployment

2. **Render** - Python AI service
   - Separate infrastructure
   - Easy Python deployment
   - Auto-scaling

3. **Neon** - PostgreSQL database
   - Managed, serverless
   - Auto-backups
   - Free tier available

**Total cost:** $0/month (free tier)

**Deployment time:** ~30 minutes

**User experience:** Single domain, seamless!

---

*For step-by-step deployment, see: `QUICK_DEPLOY.md`*
