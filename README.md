# NEXUS Workflow

> **Autonomous Multi-Agent AI Workflow Orchestration with Human-in-the-Loop Governance**

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791.svg)](https://supabase.com/)
[![AI Engine](https://img.shields.io/badge/Gemini-3.8--Flash-8E75B2.svg)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Product Overview

**NEXUS Workflow** is a production-minded agentic AI workflow orchestration platform. It gives cross-functional teams one unified, observable workspace to submit high-level operational goals and have specialized AI agents **autonomously plan, reason, collaborate, and execute multi-step tasks**, while preserving authoritative human oversight over consequential actions.

### Core Problems Solved:
- **Eliminates Manual Coordination Latency**: Autonomous agents triage incoming requests, analyze telemetry, and assemble procedural checklists in seconds rather than hours.
- **Enforces Safety via Human-in-the-Loop (HITL)**: High-impact actions (e.g. refunds, service restarts, contract authorizations) automatically pause execution and await operator review.
- **Zero Hallucinated State**: All state transitions, tasks, checklists, and generated artifacts are persisted directly in **Supabase PostgreSQL**.
- **Defense in Depth**: Untrusted model outputs pass through strict Zod schemas and SSRF-protected tool sandboxes.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, React Router, Tailwind CSS, Lucide React icons, Axios.
- **Backend**: Node.js, Express.js, TypeScript, Zod schema validation, bcrypt, JWT session handling, Helmet, rate-limiting.
- **Database**: Supabase PostgreSQL with versioned SQL migrations (`001_initial_schema.sql`, `002_workflow_engine.sql`, `003_seed_templates.sql`) and dual-mode local development engine (`pg-mem`).
- **AI Service**: Google Gemini API via official `@google/genai` SDK (`gemini-3.8-flash`), wrapped in a resilient server-side abstraction with retries, timeouts, and structured JSON output.
- **Containerization & Deployment**: Docker multi-stage container, Docker Compose, `vercel.json` (Vercel), `netlify.toml` (Netlify), `render.yaml` (Render).

---

## 3. Quickstart & Local Setup

### Prerequisites
- **Node.js** `>= 20.x` (verified on Node `v24.18.0`)
- **npm** `>= 10.x`
- *(Optional)* Supabase account and Google Gemini API key.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/nexus-workflow.git
cd nexus-workflow
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Configure Environment Variables
Copy the backend example configuration:
```bash
cp backend/.env.example backend/.env
```
*(On Windows PowerShell: `Copy-Item backend/.env.example backend/.env`)*

> **Zero-Friction Local Development**: By default, `DATABASE_URL` can be left blank in local development. The backend automatically boots with an embedded, high-fidelity in-memory PostgreSQL engine (`pg-mem`) and runs all SQL migrations and seeds. To connect your live Supabase cloud database, simply add your Supabase connection string to `DATABASE_URL`.

### 4. Run the Full Stack
Start both backend (Port `5000`) and frontend (Port `5173`) concurrently:
```bash
npm run dev
```

Visit the application at: **[http://localhost:5173](http://localhost:5173)**

---

## 4. Evaluator Demo Account

For rapid evaluation, the local development environment comes pre-seeded with sample workflows and a dedicated operator account:

- **Email**: `demo@nexusworkflow.ai`
- **Password**: `NexusDemo2026!`
- *(Or click the **"Fill Demo"** button on the login screen for 1-click login!)*

---

## 5. System Architecture & Lifecycle

```
[Request Intake] ──> [Planner Agent] ──> [Specialist Roles] ──> [Tool Registry] ──> [HITL Approval] ──> [QA Reviewer] ──> [Artifacts]
```

1. **Intake**: Operator submits title, goal, context, constraints, and priority (or selects a pre-built template).
2. **Planning**: The Planner Agent interprets the goal and deconstructs it into a bounded, ordered execution DAG.
3. **Specialist Roles**:
   - `triage_specialist`: Severity classification and parameter diagnosis.
   - `researcher`: Policy cross-referencing and telemetry analysis.
   - `executor`: Real database mutations (`db_task_create`, `db_checklist_manage`, `db_artifact_save`).
   - `reviewer`: Post-execution quality validation and executive summary synthesis.
4. **Governance Gate**: Any action evaluated with high risk halts execution in `awaiting_approval`. Operators inspect proposed arguments and click **Approve** or **Reject**.
5. **Durable Persistence**: All artifacts, checklists, and audit events are saved to PostgreSQL with full correlation IDs.

---

## 6. Seeded Operational Templates

NEXUS includes 5 general-purpose blueprints:
1. **IT Incident & Request Triage**: Log investigation, connection pool bottleneck detection, incident checklists, and RCA generation.
2. **Vendor Security & Compliance Review**: Evaluation of vendor data processing addendum, SOC2 Type II checks, and CISO human sign-off gate.
3. **Customer Billing Dispute Resolution**: Compute usage reconciliation, policy rule validation, and approval-gated refund processing.
4. **Employee Onboarding Coordination**: IT account provisioning, hardware dispatch checklists, and manager approval sign-off.
5. **Competitive Intelligence & Market Synthesis**: Industry trend collection, SWOT matrix formulation, and executive briefings.

---

## 7. Running Automated Tests & Builds

### Backend Test Suite (Vitest)
```bash
npm --prefix backend test
```
*Executes 14 unit and integration tests covering authentication, workflow DAG execution, tool execution, SSRF security blocks, and role authorization.*

### Production Builds
```bash
# Build backend TypeScript
npm --prefix backend run build

# Build frontend production bundle
npm --prefix frontend run build
```

---

## 8. Repository Documentation Index

All required hackathon submission deliverables are prepared in the repository:

- 📄 [Problem Statement](docs/PROBLEM_STATEMENT.md) — Detailed explanation of operational coordination challenges.
- 🏗️ [Solution Description](docs/SOLUTION_DESCRIPTION.md) — Comprehensive technical architecture and agent interaction model.
- 🚀 [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) — Step-by-step instructions for Supabase, Render, Railway, Fly.io, and Vercel.
- 🛡️ [Security & Operations Notes](docs/SECURITY_OPERATIONS.md) — Threat modeling, SSRF defenses, and secret hygiene.
- 🎥 [Demo Walkthrough Script](docs/DEMO_GUIDE.md) — Truthful 3–5 minute video narration guide.
- 📋 [GitHub Submission Checklist](docs/GITHUB_SUBMISSION_CHECKLIST.md) — Pre-submission verification checklist.
- 📋 [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md) — Production host and URL verification guide.
- 🔌 [OpenAPI 3.0 Specification](docs/openapi.yaml) — Formal API route specifications.
- 📦 [Postman Collection](docs/nexus_workflow_api_collection.json) — Ready-to-import API test suite.

---

## 9. License

MIT License. Designed and built for the Agentic AI Workflow Orchestration challenge.
