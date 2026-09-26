# Next-Gen ITSM — Enterprise IT Service Management Platform

A modern, production-grade IT Service Management (ITSM) platform built with **React**, **Vite**, **Tailwind CSS**, **Node.js/Express**, **TypeScript**, and **Prisma ORM (PostgreSQL)**.

---

## ⚡ Zero-Setup Quick Start: Run with Just ONE Command

You can run the entire platform locally by simply typing:

```bash
npm run dev
```

That's it! Nothing else needed.

The intelligent runner (`scripts/dev.js`) automatically:
1. **Checks & installs all dependencies** for root, backend, and frontend if missing.
2. **Configures `.env`** files from templates automatically.
3. **Auto-detects or starts PostgreSQL** (connects to running instance or starts local dev cluster).
4. **Synchronizes Prisma schema & seeds default accounts** (incidents, service requests, catalog items, knowledge base).
5. **Spawns Frontend & Backend concurrently** with live reloading.

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:4000/api](http://localhost:4000/api)

### 🔑 Default Demo Accounts:
| Role | Email | Password |
|---|---|---|
| **System Administrator** | `admin@itsm.com` | `admin123` |
| **IT Technician / Agent** | `tech@itsm.com` | `tech123` |
| **Employee / End User** | `user@itsm.com` | `user123` |

*(Note: The login page includes 1-click demo buttons that pre-fill these credentials for instant testing).*

---

## 🐳 Alternative: Run Anywhere with Docker

If you prefer containers:

```bash
docker compose up --build
```

- **Unified Web App**: [http://localhost:4000](http://localhost:4000)
- **Database**: PostgreSQL 16 Alpine on `localhost:5432`

To stop:
```bash
docker compose down
```

---

## 🚀 Cloud Deployment Options

### Option A: 1-Click Deployment on Render.com (Recommended)
This repository contains a pre-configured [`render.yaml`](./render.yaml) blueprint:
1. Push this project to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** → **Blueprint**.
3. Connect your repository. Render will automatically spin up:
   - A managed PostgreSQL database.
   - The unified Web Service (builds frontend, pushes Prisma schema, runs seed, and serves the app).
4. Done!

### Option B: Deploy to Railway / Fly.io / VPS with Docker
You can deploy directly using the root [`Dockerfile`](./Dockerfile):
- **Railway**: Connect your GitHub repo, add a PostgreSQL plugin, and set `DATABASE_URL`. Railway automatically detects the `Dockerfile` and builds the production container.
- **Fly.io**: Run `fly launch` in this directory.

### Option C: Deploying to Vercel (Why 404 Happens & How to Fix)

When deploying a React/Vite app on Vercel, Vercel hosts only the frontend client. When you try to log in, the browser makes an API request to `/api/auth/login`. If Vercel has no backend or proxy configured, it returns **`404 Not Found`**.

We have added two ways to solve this:

#### Way 1: Split Deployment (Vercel Frontend + Render/Railway Backend)
1. Deploy your backend on Render or Railway where PostgreSQL runs (e.g. `https://your-backend.onrender.com`).
2. Go to your **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**.
3. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend.onrender.com/api`
4. Go to the **Deployments** tab, click **`...`** on the latest deployment, and select **Redeploy**.

#### Way 2: Unified Vercel Deployment (Serverless API + Frontend)
This repository includes a [`vercel.json`](./vercel.json) and [`api/index.ts`](./api/index.ts) serverless bridge:
1. Connect your repository to Vercel.
2. In Vercel Project Settings → **Environment Variables**, set:
   - `DATABASE_URL`: A remote PostgreSQL database connection string (e.g., from [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) — both offer free PostgreSQL).
3. Deploy! Vercel will host both the frontend and execute `/api` routes via Serverless Functions.

---

## 📂 Project Structure

```
vibe/
├── api/
│   └── index.ts              # Vercel serverless function entrypoint
├── scripts/
│   └── dev.js                # All-in-one orchestrator (auto-deps, auto-db, auto-seed, concurrent run)
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Complete enterprise schema (Incidents, Requests, KB, Assets, etc.)
│   │   └── seed.ts           # Enterprise demo seeder
│   ├── src/
│   │   ├── controllers/      # REST API route controllers
│   │   ├── middleware/       # Auth, RBAC, error handling, validation
│   │   ├── routes/           # Express API routers
│   │   └── index.ts          # Express server with SPA static serving
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios API client with auto baseURL
│   │   ├── components/       # UI layout, Navbar, Sidebar, Modals
│   │   ├── context/          # Auth and State contexts
│   │   ├── pages/            # Incidents, Service Catalog, Requests, Knowledge, Problems, Changes, Assets
│   │   └── App.tsx           # Declarative React Router routes
│   ├── vercel.json           # Frontend SPA rewrite rule
│   └── package.json
├── Dockerfile                # Production multi-stage Docker build
├── docker-compose.yml        # Local full-stack container environment
├── render.yaml               # 1-Click Render blueprint
├── vercel.json               # Fullstack Vercel deployment configuration
└── package.json              # Unified root scripts
```
