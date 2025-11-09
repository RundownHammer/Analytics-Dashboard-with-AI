# Getting Started

Hey! So I built this analytics dashboard and wanted to document how to get it running. It's a bit involved but I'll walk you through it step by step.

## What You'll Need

- **Node.js** (v18 or newer) - for the frontend and API
- **PostgreSQL** (v14+) - for the database
- **Python** (v3.11+) - for the AI chat feature
- **npm** or **pnpm** - package manager

Don't worry if you don't have all of these, I'll show you where to get them!

---

## Step 1: Get the Code Running

First, navigate to the project folder and install all the JavaScript dependencies:

```bash
cd d:/Projects/analytics
npm install
```

This installs everything for the monorepo. It might take a few minutes 

---

## Step 2: Setup PostgreSQL Database

You need a PostgreSQL database running. Here are two ways to do it:

### Option A: If you already have PostgreSQL installed locally

```bash
# Create a new database called 'analytics'
createdb analytics

# Or if you prefer using psql:
psql -U postgres
CREATE DATABASE analytics;
\q
```

### Option B: Using Docker (easier if you don't have PostgreSQL)

```bash
docker run --name analytics-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=analytics \
  -p 5432:5432 \
  -d postgres:14
```

---

## Step 3: Configure Environment Variables

Copy the example environment files and fill in your values:

```bash
# Copy root .env
cp .env.example .env

# Copy Vanna service .env
cp services/vanna/.env.example services/vanna/.env
```

Edit `.env` in the root and add your actual values:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/analytics
GROQ_API_KEY=your_groq_api_key_here
VANNA_SERVICE_URL=http://localhost:8000
PORT=3001
```

**Note:** Get your free Groq API key at https://console.groq.com

---

## Step 4: Create Database Tables

Run the Prisma migrations to set up all the tables:

```bash
npx prisma migrate dev
```

This creates tables for Invoices, Vendors, Customers, LineItems, and Payments.

You can check if it worked by opening Prisma Studio:
```bash
npx prisma studio
```
This opens a browser at http://localhost:5555 where you can see your (empty) database tables.

---

## Step 5: Load Sample Data

I included some test data in `data/Analytics_Test_Data.json`. Run the seed script to load it:

```bash
npm run seed
```

You should see output like:
```
  Processing 47 invoices...
  Created vendors
  Created customers  
  Created invoices
  Done! Successfully loaded 47 invoices
```

---

## Step 6: Start the Servers

You need to run **three separate servers**. Open three terminal windows:

### Terminal 1 - Backend API (Express)
```bash
cd d:/Projects/analytics
npm run dev:api
```
Should say: `Server running on http://localhost:3001`

### Terminal 2 - Frontend (Next.js)
```bash
cd d:/Projects/analytics  
npm run dev:web
```
Should say: `Ready on http://localhost:3000`

### Terminal 3 - AI Service (Python/FastAPI)
```bash
cd d:/Projects/analytics/services/vanna
pip install -r requirements.txt
python app.py
```
Should say: `Uvicorn running on http://0.0.0.0:8000`

---

## Step 7: Open the App

Go to **http://localhost:3000/dashboard** in your browser.

You should see:
- Stats cards at the top (total spend, invoices, etc.)
- Charts showing invoice trends, vendor spending, categories
- A table of invoices at the bottom

Try clicking on **Chat** in the sidebar to test the AI feature!

---

## What I Built

This is basically a dashboard for analyzing invoice data with an AI chat feature.

**Tech Stack:**
- **Frontend:** Next.js 15 (React framework)
- **Backend API:** Express.js (Node.js server)
- **Database:** PostgreSQL with Prisma ORM
- **AI Chat:** Python FastAPI + Groq LLM + custom SQL generation
- **Charts:** Recharts library
- **Styling:** Tailwind CSS + shadcn/ui components

**Main Features:**
- Dashboard with KPI cards and various charts
- Invoice table with search/filter
- AI-powered chat that converts questions to SQL
- Auto-generated visualizations based on query results

---
