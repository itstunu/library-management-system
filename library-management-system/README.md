# LibraryOS — Library Management System

A full-featured Library Management System with book borrowing, returns, and fine calculation.  
Built with **HTML + CSS + JavaScript** frontend and **Vercel Serverless Functions** + **Vercel Postgres** backend.

---

## Features

- **Dashboard** — Live stats: total books, members, borrowed, overdue, fines collected
- **Books** — Add, edit, delete, search books with availability tracking
- **Members** — Register members, auto-generated member IDs
- **Borrow Book** — 3-step wizard: search book → search member → confirm
- **Return Book** — Search active borrowings, auto-calculate fine (৳5/day), mark fine as paid
- **All Borrowings** — Filter by status (all, borrowed, returned, overdue), search records
- **Responsive** — Works on desktop and mobile

---

## Deployment Guide (GitHub → Vercel + Postgres)

### Prerequisites
- GitHub account (free)
- Vercel account (free at vercel.com — sign up with GitHub)

---

### Step 1 — Push code to GitHub

1. Go to **github.com** → click **"New repository"**
2. Name it `library-management-system`, set to **Public**, click **Create repository**
3. On your computer, open a terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit: LibraryOS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/library-management-system.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

### Step 2 — Deploy to Vercel

1. Go to **vercel.com** and log in with your GitHub account
2. Click **"Add New Project"** → **"Import Git Repository"**
3. Find and select your `library-management-system` repo → click **Import**
4. Leave all settings as default (Framework: Other)
5. Click **"Deploy"** — Vercel will build and deploy in ~30 seconds
6. You'll get a live URL like: `https://library-management-system-xxx.vercel.app`

---

### Step 3 — Add Vercel Postgres Database

1. In your Vercel project dashboard, click the **"Storage"** tab
2. Click **"Create Database"** → select **"Postgres"** → click **Create**
3. Name it `library-db`, choose a region close to you (e.g., Singapore for BD)
4. Click **"Create"** and then **"Connect"** to link it to your project
5. Vercel automatically adds the `POSTGRES_URL` environment variable — no manual setup needed!

---

### Step 4 — Redeploy with Database

After connecting the database:

1. Go to the **"Deployments"** tab in your Vercel project
2. Click the **⋯** menu on the latest deployment → **"Redeploy"**
3. Wait ~20 seconds for the new deployment

---

### Step 5 — Initialize the Database

Open your browser and visit:
```
https://YOUR-PROJECT-URL.vercel.app/api/init-db
```

You should see:
```json
{"success": true, "message": "Database initialized successfully"}
```

This creates the tables and adds sample data (8 books, 3 members).

---

### Step 6 — You're Live!

Visit your app URL. Everything is ready to use.

**Default sample data:**
- 8 books pre-loaded (Fiction, Technology, History, etc.)
- 3 demo members: Alice Rahman, Bob Islam, Carol Ahmed

---

## Fine Calculation

- Loan period: **14 days**
- Fine rate: **৳5 per day** after due date
- Fine is calculated automatically when returning a book
- Librarian can mark fine as "collected" during return

---

## Local Development (Optional)

```bash
# Install Vercel CLI
npm install -g vercel

# Install dependencies
npm install

# Link to your Vercel project
vercel link

# Pull environment variables (including POSTGRES_URL)
vercel env pull .env.local

# Run locally
vercel dev
```

Visit `http://localhost:3000`

---

## File Structure

```
library-management-system/
├── api/
│   ├── init-db.js       # DB setup & seeding
│   ├── books.js         # Books CRUD API
│   ├── members.js       # Members CRUD API
│   ├── borrowings.js    # Borrow/Return + fine API
│   └── stats.js         # Dashboard stats API
├── public/
│   ├── index.html       # Single-page app
│   ├── css/style.css    # All styles
│   └── js/app.js        # All frontend logic
├── package.json
├── vercel.json          # Routing config
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | Vercel Postgres (PostgreSQL) |
| Hosting | Vercel (free tier) |
| Fonts | Google Fonts (Syne + Inter) |
