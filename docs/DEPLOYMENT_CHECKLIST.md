# NEXUS Workflow — Production Deployment & Final Submission Checklist

Complete this checklist when deploying NEXUS Workflow to public infrastructure for hackathon evaluation:

---

## 1. Database Provisioning (Supabase)
- [ ] Create a project on [Supabase](https://supabase.com).
- [ ] Retrieve PostgreSQL Transaction Pooler connection string (Port 6543) from Project Settings > Database.
- [ ] Execute database migrations:
  ```bash
  cd backend
  DATABASE_URL="your-supabase-connection-string" npm run migrate
  ```
- [ ] Verify that all 11 tables (`users`, `workspaces`, `workflow_runs`, `workflow_steps`, etc.) are visible in the Supabase Table Editor.

---

## 2. Backend Cloud Deployment (Render / Railway / Fly.io)
- [ ] Deploy backend service using `render.yaml` on Render, or via `Dockerfile` on Railway/Fly.io.
- [ ] Configure production environment variables in the host dashboard:
  - `NODE_ENV=production`
  - `DATABASE_URL=postgresql://postgres...`
  - `DATABASE_SSL=true`
  - `JWT_SECRET=[secure-32-char-random-key]`
  - `GEMINI_API_KEY=[your-google-ai-studio-key]`
  - `GEMINI_MODEL=gemini-3.8-flash`
  - `CLIENT_ORIGIN=https://[your-frontend-domain].vercel.app`
- [ ] Test public health endpoint:
  ```bash
  curl https://your-backend.onrender.com/health/ready
  # Expected: {"status":"ready","database":{"mode":"supabase_postgres","connected":true}}
  ```

---

## 3. Frontend Cloud Deployment (Vercel / Netlify)
- [ ] Connect GitHub repository to Vercel or Netlify.
- [ ] Root directory set to `frontend`.
- [ ] Build command: `npm run build`, output: `dist`.
- [ ] Ensure reverse proxy or API base URL points to your deployed backend domain.
- [ ] Test direct navigation to subpaths (e.g., `/dashboard`, `/workflows`, `/login`) to verify SPA rewrites work without 404s.

---

## 4. OAuth Configuration Verification (Optional)
- [ ] In Google Cloud Console, add `https://your-backend.onrender.com/api/v1/auth/oauth/google/callback` to Authorized Redirect URIs.
- [ ] In Meta for Developers, add `https://your-backend.onrender.com/api/v1/auth/oauth/facebook/callback` to Valid OAuth Redirect URIs.
- [ ] Verify that clicking Google or Facebook login redirects to provider consent, or triggers the clear, honest unconfigured modal if keys are omitted.

---

## 5. Demo Video & Final Submission Assets
- [ ] Record a 3–5 minute video following `docs/DEMO_GUIDE.md`.
- [ ] Upload video to YouTube (Public or Unlisted) or Loom / Google Drive.
- [ ] Verify audio quality, crisp 1080p resolution, and clear demonstration of the HITL approval gate.
- [ ] Prepare submission payload:
  - **Problem Statement**: Text from `docs/PROBLEM_STATEMENT.md`.
  - **Solution Description**: Text from `docs/SOLUTION_DESCRIPTION.md`.
  - **GitHub Repository URL**: Public repository containing full source.
  - **Live Application URL**: Accessible public URL (e.g. `https://nexus-workflow.vercel.app`).
  - **Demo Video URL**: Public video link.
