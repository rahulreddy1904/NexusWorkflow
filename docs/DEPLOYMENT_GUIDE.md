# NEXUS Workflow — Production Deployment Guide

This guide provides step-by-step instructions to deploy NEXUS Workflow to production across **Supabase (PostgreSQL)**, **Render / Railway / Fly.io (Backend)**, and **Vercel / Netlify (Frontend)**.

---

## 1. Database Provisioning: Supabase PostgreSQL

1. Log into [Supabase](https://supabase.com) and click **New Project**.
2. Set a secure database password and choose your nearest AWS region.
3. Once provisioned, navigate to **Project Settings > Database**.
4. Under **Connection string**, select **URI** and choose **Transaction Pooler (Port 6543)** or **Direct Connection (Port 5432)**:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
   ```
5. Apply versioned schema migrations from the repository:
   ```bash
   cd backend
   DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require" npm run migrate
   ```
   *Alternatively, copy the contents of `backend/src/db/migrations/001_initial_schema.sql`, `002_workflow_engine.sql`, and `003_seed_templates.sql` into the Supabase SQL Editor and click **Run**.*

---

## 2. Backend Deployment: Render / Railway / Fly.io

### Option A: Render (Blueprint Deployment)
1. Fork or push this repository to GitHub.
2. In Render, select **New > Blueprint**.
3. Select the repository; Render will detect `render.yaml`.
4. Configure the following environment variables in the Render Dashboard:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string.
   - `DATABASE_SSL`: `true`
   - `JWT_SECRET`: Random 32+ character secret string.
   - `GEMINI_API_KEY`: Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
   - `GEMINI_MODEL`: `gemini-3.8-flash`
   - `CLIENT_ORIGIN`: Your production frontend URL (e.g. `https://nexus-workflow.vercel.app`).
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: (Optional) Google OAuth credentials.
   - `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`: (Optional) Facebook OAuth credentials.
5. Click **Apply**. The backend will build, migrate, and start on port `10000`.
6. Verify deployment by visiting `https://your-backend.onrender.com/health/ready`.

### Option B: Docker Container (Railway / Fly.io)
The repository contains a production multi-stage `Dockerfile`:
```bash
# Build & run container locally or deploy to Railway/Fly.io
docker build -t nexus-workflow .
docker run -p 5000:5000 \
  -e DATABASE_URL="your-supabase-url" \
  -e JWT_SECRET="your-32-char-secret" \
  -e GEMINI_API_KEY="your-gemini-key" \
  nexus-workflow
```

---

## 3. Frontend Deployment: Vercel / Netlify

### Option A: Vercel
1. In Vercel, select **Add New > Project** and import the repository.
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy! The included `vercel.json` ensures all client-side routes redirect cleanly to `index.html`.

### Option B: Netlify
1. In Netlify, select **Add new site > Import an existing project**.
2. Select repository; Netlify will read `netlify.toml`:
   - Base directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `frontend/dist`
3. Click **Deploy**.

---

## 4. Google & Facebook OAuth Configuration

### Google Cloud Console:
1. Go to [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials).
2. Create **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized redirect URIs**, add:
   ```
   https://your-backend.onrender.com/api/v1/auth/oauth/google/callback
   ```
   *(For local testing: `http://localhost:5000/api/v1/auth/oauth/google/callback`)*
4. Copy Client ID and Client Secret into your backend environment.

### Meta for Developers (Facebook):
1. Go to [developers.facebook.com](https://developers.facebook.com/apps/) and create an app.
2. Add **Facebook Login** product.
3. Under **Valid OAuth Redirect URIs**, add:
   ```
   https://your-backend.onrender.com/api/v1/auth/oauth/facebook/callback
   ```
4. Copy App ID and App Secret into backend environment.

---

## 5. Health Verification & Rollback

### Health Checks:
- Liveness check: `GET /health` (returns HTTP 200 `{ status: "healthy" }`)
- Readiness check: `GET /health/ready` (tests database query latency)
- Configuration verification: `GET /api/v1/config/status` (checks provider readiness without exposing secrets)

### Rollback Strategy:
- Database schema changes are versioned in `backend/src/db/migrations/` and tracked in `schema_migrations`.
- Deployments on Render and Vercel support one-click instant rollbacks to previous build commits.
