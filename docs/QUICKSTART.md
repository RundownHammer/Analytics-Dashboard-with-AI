# Quickstart

Minimal steps to run the project (frontend + API + AI service + database).

## Requirements
Node 18+  |  PostgreSQL 14+  |  Python 3.11+  |  npm or pnpm

## 1. Install deps
```bash
npm install
```

## 2. Environment
Copy example and fill values.
```bash
cp .env.example .env
cp services/vanna/.env.example services/vanna/.env  # if exists
```
Root .env (example):
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/analytics
GROQ_API_KEY=sk_your_groq_key
VANNA_SERVICE_URL=http://localhost:8000
```

## 3. Database schema + seed
```bash
npx prisma db push
npm run seed
```

## 4. Run services (2 terminals)
Terminal 1 (Next.js app with API routes):
```bash
npm run dev:web
```
Terminal 2 (AI service):
```bash
cd services/vanna
pip install -r requirements.txt
uvicorn app:app --reload
```

## 5. Open
Frontend: http://localhost:3000
Dashboard: /dashboard
Chat: /chat (first load may wait for AI service wake)

## 6. Production env vars (Vercel / Render)
Vercel project (set and redeploy):
- DATABASE_URL
- VANNA_SERVICE_URL (Render FastAPI URL)
- GROQ_API_KEY
- (Optional) NEXT_PUBLIC_VANNA_URL (not required; proxy used)

Render (FastAPI) env:
- DATABASE_URL (if service queries DB)
- GROQ_API_KEY
- ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app

## 7. Health checks
App proxy health: GET /api/chat-with-data
Vanna direct (server side only): GET {VANNA_SERVICE_URL}/health

## 8. Typical issues
- 500 on /api/chat-with-data: missing VANNA_SERVICE_URL or Groq key.
- CORS error: ALLOWED_ORIGINS not set on Render.
- Empty charts: database not seeded or DATABASE_URL wrong.

## 9. Commands reference
Prisma Studio: `npx prisma studio`
Build (web): `npm run build --workspace=@analytics/web`
Seed: `npm run seed`

## 10. Cleanup / security
- Never commit real API keys.
- Rotate GROQ_API_KEY if exposed.
- Use server proxy for AI health instead of client direct calls.

Done.
