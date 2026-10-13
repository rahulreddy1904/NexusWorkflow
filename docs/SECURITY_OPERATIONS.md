# NEXUS Workflow — Security, Privacy & Operational Governance

## 1. Threat Model & Security Posture

NEXUS Workflow is designed under the principle of **Defensive Agentic Architecture**. In an autonomous multi-agent environment, the model's outputs are treated as **untrusted input**. The system defends against prompt injection, unconstrained tool invocation, SSRF, secret leakage, and unauthorized tenant access.

---

## 2. Authentication & Authorization Controls

- **Password Storage**: Passwords are cryptographically hashed using **bcrypt** with a work factor of 10. Plaintext passwords or hashes are never returned across API boundaries.
- **Session Tokens**: Uses signed JSON Web Tokens (JWT) signed with HMAC-SHA256 using `JWT_SECRET` (minimum 32 characters in production).
- **Session Transport**: Issued as both HTTP-only, secure, `SameSite=Lax` browser cookies and authorization bearer tokens for cross-origin or native API consumption.
- **Role-Based Access Control (RBAC)**: Workspaces enforce distinct roles: `owner`, `admin`, `operator`, `viewer`. Every query is scoped by `workspace_id`.
- **OAuth Server-Side Code Exchange**: Google and Facebook OAuth flows use server-to-server token exchange. Client-submitted email addresses are never trusted without verified provider signatures.

---

## 3. Defense Against Prompt Injection & Rogue Agents

1. **Schema-Gated Tool Invocations**:
   - Model outputs proposing tool calls are strictly parsed and validated using **Zod schemas**.
   - If an argument fails type validation, the engine rejects the call before any mutation can occur.
2. **Restricted Tool Capability Matrix**:
   - Agents can ONLY execute explicitly registered server-side tools (`db_task_create`, `db_checklist_manage`, etc.).
   - Model output CANNOT execute arbitrary shell commands, raw SQL strings, eval, or unvetted scripts.
3. **SSRF (Server-Side Request Forgery) Defense**:
   - The `http_data_fetch` tool strictly inspects destination URLs.
   - It blocks access to loopback (`localhost`, `127.0.0.1`, `::1`), private networks (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`), and cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).

---

## 4. Human-in-the-Loop (HITL) Governance Safeguards

- **Risk Score Policy**: Tool actions evaluate risk parameters. Actions with risk score $\ge 70$ or classified as consequential operations (such as payments, external contracts, access elevation) are gated by mandatory human sign-off.
- **Durable Suspension**: Gated workflows enter `awaiting_approval` and freeze progression in PostgreSQL. Server restarts or network interruptions do not bypass approval gates.

---

## 5. Secret Hygiene & Data Protection

- **Zero Client Bundle Exposure**:
  - `GEMINI_API_KEY`, `JWT_SECRET`, database credentials, and OAuth secrets are restricted to backend environment variables.
  - The frontend bundle never bundles API keys or database service keys.
- **Automatic Log Redaction**:
  - The structured logging utility (`logger.ts`) automatically scrubs keys containing `password`, `token`, `secret`, `gemini_api_key`, `authorization`, and `api_key`.

---

## 6. Denial-of-Service & Rate Limiting

- **Rate Limits**:
  - Authentication endpoints (`/api/v1/auth/*`): 100 requests per 15-minute window.
  - Core API endpoints (`/api/v1/workflows/*`): 300 requests per minute per IP.
- **Payload Restrictions**:
  - Request bodies capped at 2MB (`express.json({ limit: '2mb' })`).
  - Maximum steps per workflow enforced (`WORKFLOW_MAX_STEPS = 12`).
  - Bounded retries (`WORKFLOW_MAX_RETRIES = 3`) with exponential backoff prevent infinite loops.
