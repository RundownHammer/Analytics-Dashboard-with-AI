# Quick Deployment Guide 🚀

**TL;DR:** Get your app deployed in 30 minutes.

---

## Prerequisites
- GitHub account
- Groq API key (get free at https://console.groq.com)
- Your code pushed to GitHub (WITHOUT .env files!)

---

## Step 1: Database (5 min) - Neon

1. **Sign up:** https://neon.tech
2. **Create project:** "analytics-dashboard"
3. **Copy connection string** - it looks like:
   ```
   postgresql://user:pass@ep-something.neon.tech/neondb?sslmode=require
   ```
4. **Run migrations:**
   ```bash
   export DATABASE_URL="your-neon-connection-string"
   npx prisma db push
   npx prisma generate
   ```

---

## Step 2: Vanna AI (10 min) - Render

1. **Sign up:** https://render.com
2. **New Web Service** → Connect your GitHub repo
3. **Configure:**
   - Name: `analytics-vanna-ai`
   - Root Directory: `services/vanna`
   - Runtime: `Python 3.11`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables:**
   - `DATABASE_URL` = your Neon connection string
   - `GROQ_API_KEY` = your Groq key
   - `PORT` = `8000`
5. **Deploy** → Wait 2-3 minutes
6. **Copy URL:** `https://analytics-vanna-ai.onrender.com`

**Test:** `curl https://analytics-vanna-ai.onrender.com/health`

---

## Step 3: Frontend (15 min) - Vercel

1. **Sign up:** https://vercel.com
2. **Import Project** → Select your GitHub repo
3. **Configure:**
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && npm install && npm run build --filter=web`
4. **Environment Variables** (click "Add"):
   ```
   NEXT_PUBLIC_API_BASE=/api
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   DATABASE_URL=<neon-connection-string>
   VANNA_SERVICE_URL=https://analytics-vanna-ai.onrender.com
   GROQ_API_KEY=<your-groq-key>
   PORT=3001
   ```
5. **Deploy** → Wait 2-3 minutes
6. **Copy URL:** `https://your-app.vercel.app`
7. **Update** `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
8. **Redeploy**

---

## Step 4: Test Everything ✅

1. **Visit:** `https://your-app.vercel.app/dashboard`
2. **Check:** Stats cards, charts, invoice table
3. **Visit:** `https://your-app.vercel.app/chat`
4. **Test:** Click a suggested query
5. **Verify:** Results + chart appear

---

## Costs

**Free Tier:**
- Neon: Free (512MB storage)
- Render: Free (spins down after 15min)
- Vercel: Free (100GB bandwidth)
- **Total: $0/month** ✅

**Production Tier:**
- Neon Pro: $19/mo (always-on, 10GB)
- Render Starter: $7/mo (no spin-down)
- Vercel Pro: $20/mo (more bandwidth)
- **Total: ~$46/month**

---

## Troubleshooting

**Build fails?**
- Check Vercel logs
- Try `npm run build` locally first

**Database error?**
- Verify connection string has `?sslmode=require`
- Check Neon dashboard

**Chat not working?**
- Check VANNA_SERVICE_URL is correct
- Verify Groq API key is valid
- Check Render logs

**Vanna timeout?**
- Free tier spins down → first request takes 30s
- Upgrade to Starter for always-on

---

## What's Deployed?

```
User
  ↓
Vercel (Frontend + API)
https://your-app.vercel.app
  ↓
Render (Vanna AI)
https://analytics-vanna-ai.onrender.com
  ↓
Neon (PostgreSQL)
Database
```

---

## Next Steps

1. ✅ Share on LinkedIn/portfolio
2. 📊 Monitor usage and costs
3. 🔒 Set up alerts (optional)
4. 🎨 Customize and improve
5. 📈 Scale as needed

---

## Full Documentation

- **Complete Guide:** `docs/DEPLOYMENT.md`
- **Security Audit:** `docs/SECURITY_AUDIT.md`
- **Detailed Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **API Reference:** `docs/API.md`

---

**That's it!** Your app is now live. 🎉

**Your URLs:**
- Dashboard: `https://your-app.vercel.app/dashboard`
- Chat: `https://your-app.vercel.app/chat`

Share it with the world! 🚀
