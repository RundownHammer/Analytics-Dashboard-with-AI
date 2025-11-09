# Deployment Guide

This guide walks you through deploying the Analytics Dashboard to production with:
- **Frontend + Backend API** on Vercel
- **Vanna AI Service** on Render
- **Database** on Neon (PostgreSQL)

---

## 🔒 Security Check - CRITICAL!

Before deploying, ensure NO sensitive data is committed to Git:

### ✅ Files that MUST be in `.gitignore`:
```
.env
.env.*
!.env.example
```

### ⚠️ Remove sensitive data from documentation:

**Files to clean:**
1. `README.md` - Remove actual API keys and passwords
2. `docs/QUICKSTART.md` - Use placeholder values
3. `docs/API.md` - Remove any real credentials

**Search for these patterns:**
```bash
# Find potential leaks
grep -r "gsk_" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "postgres:.*@" . --exclude-dir=node_modules --exclude-dir=.git
```

### 🔑 Rotate compromised credentials:
If you've already committed sensitive data:
1. **Groq API Key**: Get new one at https://console.groq.com
2. **Database Password**: Change it in your PostgreSQL instance
3. **Git History**: Consider using `git filter-branch` or BFG Repo-Cleaner

---

## Part 1: Database Setup (Neon)

Neon provides free PostgreSQL hosting with generous limits.

### Step 1.1: Create Neon Account
1. Go to https://neon.tech
2. Sign up with GitHub (easiest)
3. Create a new project: "analytics-dashboard"

### Step 1.2: Get Connection String
After creating the project, you'll get a connection string like:
```
postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Save this!** You'll need it for Vercel and Render.

### Step 1.3: Setup Database Schema
From your local machine:

```bash
# Set the production database URL
export DATABASE_URL="postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Push schema to database (for fresh database)
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed with sample data (optional - currently has schema mismatch, skip for now)
# npm run seed
```

**Note:** The connection string MUST include `?sslmode=require` for Neon.

**Why `db push` instead of `migrate deploy`?**
- `db push` synchronizes your schema directly (perfect for fresh databases)
- `migrate deploy` requires migration history to match (fails on fresh databases)
- For production deployments to existing databases, use `migrate deploy`

---

## Part 2: Vanna AI Service (Render)

Deploy the Python FastAPI service to Render.

### Step 2.1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Connect your repository

### Step 2.2: Create Web Service
1. Click "New +" → "Web Service"
2. Select your repository: `Analytics-Dashboard-with-AI`
3. Configure:

**Settings:**
```
Name: analytics-vanna-ai
Region: Oregon (US West) or closest to you
Branch: master
Root Directory: services/vanna
```

**Build & Deploy:**
```
Runtime: Python 3.11
Build Command: pip install -r requirements.txt
Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Instance Type:**
- Free tier is fine for testing
- Starter ($7/month) for production

### Step 2.3: Add Environment Variables
In Render dashboard, go to "Environment" tab:

```
DATABASE_URL = postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
GROQ_API_KEY = gsk_your_actual_groq_api_key_here
PORT = 8000
```

### Step 2.4: Deploy
1. Click "Create Web Service"
2. Wait for build to complete (~2-3 minutes)
3. Your service will be at: `https://analytics-vanna-ai.onrender.com`

### Step 2.5: Test It
```bash
curl https://analytics-vanna-ai.onrender.com/health
# Should return: {"status":"ok"}
```

**Save the URL!** You'll need it for Vercel.

---

## Part 3: Frontend + Backend API (Vercel)

Deploy both Next.js frontend and Express API to Vercel.

### Step 3.1: Prepare for Deployment

#### Update API for Production
Edit `apps/api/src/server.ts` to handle Vercel serverless:

```typescript
// Add this at the bottom
export default app; // For Vercel serverless
```

#### Update Next.js Config
Edit `apps/web/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For Vercel optimization
  rewrites: async () => [
    {
      source: '/api/:path*',
      destination: 
        process.env.NODE_ENV === 'production'
          ? '/api/:path*' // Vercel will handle this
          : 'http://localhost:3001/:path*', // Local dev
    },
  ],
};

module.exports = nextConfig;
```

### Step 3.2: Create Vercel Project

#### Option A: Using Vercel Dashboard
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New" → "Project"
4. Import your repository
5. Configure:

**Framework Preset:** Next.js

**Root Directory:** `apps/web`

**Build Settings:**
```
Build Command: cd ../.. && npm install && npm run build --filter=web
Output Directory: apps/web/.next
Install Command: npm install
```

**Environment Variables** (click "Add"):
```
NEXT_PUBLIC_API_BASE = /api
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
DATABASE_URL = postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
VANNA_SERVICE_URL = https://analytics-vanna-ai.onrender.com
GROQ_API_KEY = gsk_your_actual_groq_api_key_here
PORT = 3001
```

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from root directory
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: analytics-dashboard
# - Directory: apps/web
```

Then add environment variables:
```bash
vercel env add NEXT_PUBLIC_API_BASE
vercel env add DATABASE_URL
vercel env add VANNA_SERVICE_URL
vercel env add GROQ_API_KEY
```

### Step 3.3: Deploy API as Serverless Functions

Create `apps/api/vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.ts"
    }
  ]
}
```

Create new Vercel project for API:
```bash
cd apps/api
vercel

# Configure:
# Project name: analytics-api
# Build Command: npm run build
# Output Directory: dist
```

Add environment variables in Vercel dashboard.

**Alternative:** Use Vercel's API routes instead. Move API routes to `apps/web/app/api/`.

### Step 3.4: Update CORS Settings

In `apps/api/src/server.ts`, update CORS for production:

```typescript
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',
    'https://*.vercel.app', // All Vercel preview deployments
  ],
  credentials: true,
}));
```

### Step 3.5: Deploy
```bash
# Deploy production
vercel --prod
```

Your app will be live at: `https://your-app.vercel.app`

---

## Part 4: Post-Deployment Configuration

### Step 4.1: Update Environment Variables

**Vercel (Frontend):**
```
NEXT_PUBLIC_API_BASE=/api
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
DATABASE_URL=<neon-connection-string>
VANNA_SERVICE_URL=https://analytics-vanna-ai.onrender.com
GROQ_API_KEY=<your-groq-key>
```

**Render (Vanna AI):**
```
DATABASE_URL=<neon-connection-string>
GROQ_API_KEY=<your-groq-key>
PORT=8000
```

### Step 4.2: Test the Deployment

1. **Frontend:** Visit `https://your-app.vercel.app/dashboard`
2. **API:** Test `https://your-app.vercel.app/api/stats`
3. **Vanna AI:** Test `https://analytics-vanna-ai.onrender.com/health`
4. **Chat Feature:** Go to `/chat` and ask a question

### Step 4.3: Monitor Logs

**Vercel:**
- Dashboard → Your Project → Logs
- Or use CLI: `vercel logs`

**Render:**
- Dashboard → Your Service → Logs
- Real-time logs available in dashboard

### Step 4.4: Set up Custom Domain (Optional)

**Vercel:**
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

**Render:**
1. Go to Service Settings → Custom Domain
2. Add your domain
3. Update DNS records

---

## Part 5: Continuous Deployment

Both Vercel and Render auto-deploy on Git push!

### Workflow:
1. Make changes locally
2. Commit and push to `master` branch
3. Vercel builds frontend automatically
4. Render builds Vanna AI automatically
5. Changes live in ~2-3 minutes

### Branch Deployments:
- **master** → Production
- **other branches** → Preview deployments (Vercel only)

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  User Browser                           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Vercel (Frontend)                      │
│  https://your-app.vercel.app            │
│  - Next.js App                          │
│  - Dashboard UI                         │
│  - Chat Interface                       │
└────────────┬────────────────────────────┘
             │
             ├──────► /api/* routes
             │        (Express API on Vercel)
             │
             ▼
┌─────────────────────────────────────────┐
│  Render (Vanna AI Service)              │
│  https://analytics-vanna-ai.onrender.com│
│  - FastAPI (Python)                     │
│  - Groq LLM Integration                 │
│  - SQL Generation                       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Neon (PostgreSQL Database)             │
│  - Invoice Data                         │
│  - Vendor/Customer Info                 │
│  - Payments                             │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: Vercel build fails
**Solution:** Check build logs. Common issues:
- Missing environment variables
- Prisma client not generated: Add `npx prisma generate` to build command
- TypeScript errors: Fix locally first

### Issue: API returns 500 errors
**Solution:** 
- Check Vercel logs for errors
- Verify DATABASE_URL is correct
- Ensure Prisma schema is deployed: `npx prisma migrate deploy`

### Issue: Vanna AI service timeout
**Solution:**
- Render free tier spins down after inactivity
- First request takes ~30s to wake up
- Upgrade to Starter plan for always-on service
- Or implement a ping/warmup endpoint

### Issue: CORS errors
**Solution:**
- Check CORS configuration in `server.ts`
- Add your Vercel domain to allowed origins
- Include `credentials: true` if using cookies

### Issue: Database connection errors
**Solution:**
- Verify connection string includes `?sslmode=require`
- Check Neon dashboard for connection limits
- Ensure DATABASE_URL is set in all environments

### Issue: Chat feature not working
**Solution:**
- Test Vanna service directly: `curl https://analytics-vanna-ai.onrender.com/health`
- Check VANNA_SERVICE_URL environment variable
- Verify GROQ_API_KEY is valid
- Check Render logs for Python errors

---

## Cost Breakdown

### Free Tier (Good for Demo/Portfolio)
- **Vercel:** Free (Hobby plan)
  - Unlimited deployments
  - 100GB bandwidth/month
  - Custom domains included
  
- **Render:** Free
  - 750 hours/month (enough for 1 service)
  - Spins down after 15min inactivity
  - Public repo required
  
- **Neon:** Free
  - 512MB storage
  - 1 project
  - Auto-suspend after 5min inactivity

**Total: $0/month** ✅

### Production Tier (Recommended)
- **Vercel Pro:** $20/month
  - More bandwidth
  - No cold starts
  - Better support
  
- **Render Starter:** $7/month
  - Always-on service
  - No spin-down
  - 512MB RAM
  
- **Neon Pro:** $19/month
  - 10GB storage
  - Always-active compute
  - Better performance

**Total: ~$46/month**

---

## Security Best Practices

### 1. Environment Variables
✅ **DO:**
- Use environment variables for all secrets
- Use different keys for dev/staging/prod
- Rotate API keys regularly

❌ **DON'T:**
- Commit `.env` files to Git
- Hardcode credentials in code
- Share API keys in documentation

### 2. Database
✅ **DO:**
- Use SSL connections (`sslmode=require`)
- Limit database user permissions
- Enable connection pooling
- Set up regular backups

❌ **DON'T:**
- Use default passwords
- Expose database publicly
- Grant superuser access to app

### 3. API Security
✅ **DO:**
- Implement rate limiting
- Validate all inputs
- Use HTTPS everywhere
- Log errors (but not sensitive data)

❌ **DON'T:**
- Expose internal errors to users
- Skip input validation
- Allow SQL injection
- Log passwords/tokens

### 4. Frontend
✅ **DO:**
- Only expose `NEXT_PUBLIC_*` vars to client
- Implement CSP headers
- Use secure cookies

❌ **DON'T:**
- Put API keys in client code
- Trust user input
- Skip CORS configuration

---

## Monitoring & Maintenance

### Health Checks
Create health check endpoints:

**API:** `/health`
```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

**Vanna:** `/health` (already exists)

### Monitoring Services (Optional)
- **Vercel Analytics:** Built-in, free
- **Sentry:** Error tracking ($0-$26/month)
- **BetterStack:** Uptime monitoring (free tier)
- **Render Metrics:** Built-in on paid plans

### Backup Strategy
1. **Database:** Neon auto-backups on Pro plan
2. **Manual Backups:**
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```
3. **Code:** Git is your backup!

---

## Scaling Considerations

### When to Scale:
- Vercel: Upgrade if bandwidth > 100GB/month
- Render: Upgrade if response time > 1s
- Neon: Upgrade if database > 500MB

### Optimization Tips:
1. **Frontend:**
   - Enable Next.js Image Optimization
   - Use static generation where possible
   - Implement lazy loading

2. **API:**
   - Add Redis caching (Upstash free tier)
   - Optimize Prisma queries
   - Implement pagination

3. **Database:**
   - Add indexes for common queries
   - Use connection pooling (PgBouncer)
   - Archive old data

4. **Vanna AI:**
   - Cache common queries
   - Implement request queuing
   - Consider upgrading Render instance

---

## Alternative Hosting Options

### Frontend + API:
- **Railway:** Similar to Render, $5/month
- **Fly.io:** Global edge deployment
- **Netlify:** Alternative to Vercel
- **AWS Amplify:** If you're in AWS ecosystem

### Python Service:
- **Fly.io:** Good for Python apps
- **Railway:** Easy Python deployment
- **Google Cloud Run:** Pay-per-use
- **AWS Lambda:** Serverless option

### Database:
- **Supabase:** PostgreSQL + extras, generous free tier
- **PlanetScale:** MySQL (would need schema changes)
- **Railway:** PostgreSQL included with app hosting
- **Heroku Postgres:** Classic option

---

## Quick Deployment Checklist

### Pre-Deployment:
- [ ] Remove all hardcoded secrets from code
- [ ] Create `.env.example` files
- [ ] Update README with placeholder values
- [ ] Test build locally: `npm run build`
- [ ] Commit and push to GitHub

### Database:
- [ ] Create Neon account
- [ ] Create new project
- [ ] Copy connection string
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed data: `npm run seed`

### Vanna AI (Render):
- [ ] Create Render account
- [ ] Create new Web Service
- [ ] Configure Python 3.11 runtime
- [ ] Set root directory: `services/vanna`
- [ ] Add environment variables
- [ ] Deploy and test `/health` endpoint

### Frontend (Vercel):
- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Deploy and test

### Post-Deployment:
- [ ] Test all pages: `/dashboard`, `/chat`
- [ ] Test API endpoints
- [ ] Test chat feature end-to-end
- [ ] Set up custom domain (optional)
- [ ] Enable monitoring

---

## Support & Resources

### Documentation:
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs
- Prisma Docs: https://www.prisma.io/docs

### Community:
- Vercel Discord: https://vercel.com/discord
- Render Community: https://community.render.com
- Next.js Discord: https://nextjs.org/discord

### Getting Help:
1. Check the logs first (Vercel/Render dashboards)
2. Search GitHub Issues
3. Ask in relevant Discord servers
4. Stack Overflow with specific error messages

---

## Next Steps

After successful deployment:
1. Share the link! 🎉
2. Add it to your portfolio/resume
3. Consider adding features:
   - User authentication (NextAuth.js)
   - Email notifications
   - PDF export
   - More chart types
4. Monitor usage and costs
5. Collect feedback and iterate

---

Good luck with your deployment! 🚀

If you run into issues, check the Troubleshooting section or reach out to the respective platform support teams.
