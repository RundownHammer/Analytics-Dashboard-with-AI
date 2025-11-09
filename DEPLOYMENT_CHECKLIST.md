# Pre-Deployment Checklist ✅

Complete this checklist before deploying to production.

---

## 🔒 Security (CRITICAL!)

### 1. Rotate API Keys ⚠️ MANDATORY
- [ ] Get new Groq API key at https://console.groq.com/keys
- [ ] Delete old key from Groq dashboard
- [ ] Update `.env` with new key (DO NOT COMMIT!)
- [ ] Update `services/vanna/.env` with new key
- [ ] Test locally to verify new key works

**Why:** The old API key was in documentation examples and should be considered compromised.

### 2. Verify Git Security
- [ ] Run: `git log --all -- .env` (should be empty)
- [ ] Run: `git log --all -- services/vanna/.env` (should be empty)
- [ ] Confirm `.gitignore` includes `.env` and `.env.*`
- [ ] Verify no hardcoded secrets in code

**If .env was ever committed:**
```bash
# Stop and clean Git history first!
# See docs/SECURITY_AUDIT.md for instructions
```

### 3. Clean Documentation
- [ ] ✅ README.md - credentials removed
- [ ] ✅ docs/QUICKSTART.md - credentials removed
- [ ] ✅ .env.example files created
- [ ] All docs use placeholder values

---

## 📦 Code Preparation

### 4. Dependencies
- [ ] Run: `npm install` (root)
- [ ] Run: `cd apps/web && npm install`
- [ ] Run: `cd apps/api && npm install`
- [ ] Run: `cd services/vanna && pip install -r requirements.txt`
- [ ] All packages installed successfully

### 5. Build Test
- [ ] Run: `npm run build` from root
- [ ] No TypeScript errors
- [ ] No build failures
- [ ] Prisma client generated

### 6. Local Testing
- [ ] Dashboard works: http://localhost:3000/dashboard
- [ ] Chat works: http://localhost:3000/chat
- [ ] API responds: http://localhost:3001/stats
- [ ] Vanna AI works: http://localhost:8000/health
- [ ] All features functional

---

## 🗄️ Database Setup

### 7. Production Database (Neon)
- [ ] Created account at https://neon.tech
- [ ] Created new project: "analytics-dashboard"
- [ ] Copied connection string
- [ ] Connection string includes `?sslmode=require`
- [ ] Saved connection string securely (password manager)

### 8. Database Migration
```bash
# Set production DATABASE_URL temporarily
export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Push schema to database (for fresh Neon database)
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed sample data (optional - skip if seed script has issues)
# npm run seed

# Verify tables exist
npx prisma studio
```

- [ ] Schema pushed successfully
- [ ] Prisma Client generated
- [ ] Verified tables exist in Neon dashboard

**Note:** Use `npx prisma db push` for fresh databases. Use `npx prisma migrate deploy` only if you have existing migration history.

---

## 🐍 Vanna AI Service (Render)

### 9. Create Render Account
- [ ] Signed up at https://render.com
- [ ] Connected GitHub account
- [ ] Repository connected

### 10. Deploy Vanna Service
- [ ] Created new Web Service
- [ ] Selected repository
- [ ] Configured settings:
  - Name: `analytics-vanna-ai`
  - Root Directory: `services/vanna`
  - Runtime: Python 3.11
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### 11. Environment Variables (Render)
- [ ] Added: `DATABASE_URL` (Neon connection string)
- [ ] Added: `GROQ_API_KEY` (new rotated key)
- [ ] Added: `PORT=8000`
- [ ] Deployed service

### 12. Test Vanna Service
- [ ] Service deployed successfully
- [ ] Copied service URL: `https://analytics-vanna-ai.onrender.com`
- [ ] Test health endpoint: `curl https://analytics-vanna-ai.onrender.com/health`
- [ ] Returns: `{"status":"ok"}`

---

## 🌐 Frontend + API (Vercel)

### 13. Create Vercel Account
- [ ] Signed up at https://vercel.com
- [ ] Connected GitHub account
- [ ] Ready to import project

### 14. Configure Project
- [ ] Imported repository
- [ ] Framework: Next.js
- [ ] Root Directory: `apps/web`
- [ ] Build Command: `cd ../.. && npm install && npm run build --filter=web`

### 15. Environment Variables (Vercel)
Add these in Vercel dashboard → Settings → Environment Variables:

- [ ] `NEXT_PUBLIC_API_BASE=/api`
- [ ] `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app` (update after first deploy)
- [ ] `DATABASE_URL=` (Neon connection string)
- [ ] `VANNA_SERVICE_URL=` (Render service URL)
- [ ] `GROQ_API_KEY=` (new rotated key)
- [ ] `PORT=3001`

### 16. Deploy Frontend
- [ ] Clicked "Deploy"
- [ ] Build succeeded
- [ ] Copied deployment URL
- [ ] Updated `NEXT_PUBLIC_APP_URL` with actual URL
- [ ] Redeployed to apply URL change

---

## 🧪 Post-Deployment Testing

### 17. Frontend Testing
- [ ] Visit: `https://your-app.vercel.app`
- [ ] Homepage loads
- [ ] Navigate to `/dashboard`
- [ ] Stats cards display data
- [ ] Charts render correctly
- [ ] Invoice table shows data

### 18. API Testing
Test each endpoint:
- [ ] `GET /api/stats` - returns dashboard stats
- [ ] `GET /api/invoice-trends` - returns trend data
- [ ] `GET /api/vendors/top10` - returns vendors
- [ ] `GET /api/invoices` - returns invoice list

```bash
curl https://your-app.vercel.app/api/stats
```

### 19. Chat Feature Testing
- [ ] Navigate to `/chat`
- [ ] Suggested queries appear
- [ ] Click a suggested query
- [ ] Results display correctly
- [ ] Charts auto-generate
- [ ] Insights panel shows calculations
- [ ] Try custom query: "Show me overdue invoices"
- [ ] Works end-to-end

### 20. Error Handling
- [ ] Try invalid query: "delete all data"
- [ ] See appropriate error message
- [ ] No crash or 500 error
- [ ] Try query with no results
- [ ] Handles gracefully

---

## 🔍 Monitoring Setup

### 21. Vercel Monitoring
- [ ] Opened Vercel dashboard
- [ ] Reviewed deployment logs
- [ ] No errors in logs
- [ ] Analytics enabled (optional)

### 22. Render Monitoring
- [ ] Opened Render dashboard
- [ ] Reviewed service logs
- [ ] No errors in logs
- [ ] Service status: "Live"

### 23. Neon Monitoring
- [ ] Opened Neon dashboard
- [ ] Checked database connections
- [ ] Reviewed query performance
- [ ] No connection issues

---

## 📄 Documentation Updates

### 24. Update README
- [ ] Added deployment URL to README
- [ ] Updated demo screenshot (optional)
- [ ] Verified all links work
- [ ] No credentials in README

### 25. Create Production .env.example
Already done:
- [x] `.env.example` in root
- [x] `services/vanna/.env.example`
- [x] Both use placeholder values only

---

## 🚀 Optional Enhancements

### 26. Custom Domain (Optional)
If you have a domain:
- [ ] Added domain in Vercel settings
- [ ] Updated DNS records
- [ ] SSL certificate issued
- [ ] Updated environment variables with new domain

### 27. Performance Optimization
- [ ] Enabled Vercel Analytics
- [ ] Checked Lighthouse scores
- [ ] Optimized images (if any)
- [ ] Reviewed bundle size

### 28. Continuous Deployment
- [ ] Verified auto-deploy works
- [ ] Pushed test commit to GitHub
- [ ] Vercel auto-deployed
- [ ] Render auto-deployed (if configured)

---

## 📊 Final Verification

### 29. Complete System Test
Do a full workflow test:
- [ ] Visit production URL
- [ ] View dashboard - all data loads
- [ ] Navigate to chat
- [ ] Ask: "Show me pending invoices"
- [ ] Results display with chart
- [ ] Ask: "Top 5 vendors by spending"
- [ ] Bar chart generates automatically
- [ ] All features working smoothly

### 30. Performance Check
- [ ] Page load time < 3 seconds
- [ ] API responses < 1 second
- [ ] Vanna AI responds within 5 seconds (first request may take 30s on free tier)
- [ ] No console errors in browser
- [ ] Mobile responsive (test on phone)

---

## ✅ Launch Checklist

### Critical Items (Must Complete):
- [x] Groq API key rotated
- [ ] Database migrated to Neon
- [ ] Vanna AI deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] All environment variables configured
- [ ] End-to-end testing passed
- [ ] No credentials in Git repository
- [ ] Documentation updated

### Nice to Have:
- [ ] Custom domain configured
- [ ] Monitoring/analytics enabled
- [ ] Error tracking (Sentry)
- [ ] Performance optimization
- [ ] README updated with live URL

---

## 🎉 You're Ready to Launch!

Once all critical items are checked:

1. **Share your project:**
   - Add to portfolio
   - Update resume
   - Share on LinkedIn
   - Tweet about it

2. **Monitor for first 24 hours:**
   - Check logs regularly
   - Watch for errors
   - Monitor costs (should be $0 on free tier)
   - Test from different devices

3. **Gather feedback:**
   - Ask friends to test
   - Note any issues
   - Plan improvements

---

## 📞 Need Help?

### Common Issues:

**Build fails on Vercel:**
- Check build logs for specific error
- Verify all dependencies in package.json
- Try building locally first

**Vanna AI timeout:**
- Free tier spins down after 15 min
- First request takes ~30s to wake up
- Upgrade to Starter plan ($7/mo) for always-on

**Database connection error:**
- Verify connection string has `?sslmode=require`
- Check Neon dashboard for connection status
- Ensure environment variables are set correctly

**Chat not working:**
- Check VANNA_SERVICE_URL is correct
- Verify Groq API key is valid
- Review Render logs for Python errors
- Test Vanna service directly

### Resources:
- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **Security Audit:** `docs/SECURITY_AUDIT.md`
- **API Docs:** `docs/API.md`
- **Chat Workflow:** `docs/CHAT_WORKFLOW.md`

### Support:
- Vercel: https://vercel.com/support
- Render: https://render.com/docs
- Neon: https://neon.tech/docs

---

**Last Updated:** November 9, 2025

Good luck with your deployment! 🚀
