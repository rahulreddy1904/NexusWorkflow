# NEXUS Workflow — Solution Description & System Architecture

## 1. Product Overview

**NEXUS Workflow** is a production-minded agentic AI workflow orchestration platform. It enables enterprise operations teams to submit complex operational requests and have collaborative AI agents **autonomously plan, reason, execute multi-step tasks, and generate durable artifacts**, while ensuring that humans retain authoritative governance over high-risk or consequential decisions.

Unlike brittle scripts or conversational chat bots, NEXUS Workflow uses a durable state machine backed by **Supabase PostgreSQL**, reasons using **Google Gemini 3.8 Flash**, executes strictly typed backend tools, and halts execution automatically when policy triggers a Human-in-the-Loop (HITL) review.

---

## 2. Multi-Agent Collaboration Architecture

NEXUS Workflow structures work into clear, bounded specialist roles:

```
[Operational Request]
        │
        ▼
┌─────────────────────────────────┐
│       Planner Agent (AI)        │ ──> Decomposes goal into bounded DAG plan
└─────────────────────────────────┘     Estimates risk, maps tools & constraints
        │
        ├─────────────────────────────────────────────────┐
        ▼                                                 ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│   Triage Specialist Agent     │               │     Research Agent (AI)       │
│  - Severity classification    │               │  - Policy cross-referencing   │
│  - Missing context detection  │               │  - Metric & data analysis     │
└───────────────────────────────┘               └───────────────────────────────┘
        │                                                 │
        └───────────────────────┬─────────────────────────┘
                                ▼
                ┌───────────────────────────────┐
                │   Execution Specialist Agent  │
                │  - Creates DB tasks           │
                │  - Generates checklists       │
                │  - Dispatches notifications   │
                └───────────────────────────────┘
                                │
               [Risk Score >= 70 or Policy Trigger?]
                                │
                 ┌──────────────┴──────────────┐
              Yes│                             │No
                 ▼                             ▼
   ┌───────────────────────────┐   ┌───────────────────────────┐
   │  Human-in-the-Loop Gate   │   │   Tool Execution Engine   │
   │  - Workflow pauses        │   │  - Typed Zod validation   │
   │  - Operator reviews note  │   │  - SSRF protection gates  │
   │  - Approve or Reject      │   │  - DB mutation executed   │
   └───────────────────────────┘   └───────────────────────────┘
                 │                             │
                 └──────────────┬──────────────┘
                                ▼
                ┌───────────────────────────────┐
                │   Quality Reviewer Agent      │
                │  - Validates goal completion  │
                │  - Checks constraint adherence│
                │  - Compiles executive summary │
                └───────────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │   Durable Artifact & Audit    │
                │  - Persisted in PostgreSQL    │
                │  - Exportable Markdown / JSON │
                └───────────────────────────────┘
```

### Specialist Agent Personas:
1. **Planner Agent**: Interprets goals, parses constraints, calculates systemic risk impact, and generates an ordered execution DAG with step-level tool assignments.
2. **Triage Specialist Agent**: Gathers incoming telemetry, isolates missing context, and categorizes operational urgency.
3. **Research Agent**: Cross-references internal policies, validates regulatory guidelines, and analyzes telemetry datasets.
4. **Execution Specialist Agent**: Executes registered application tools to mutate database tasks, assemble compliance checklists, and notify workspace stakeholders.
5. **Quality Reviewer Agent**: Evaluates the collective execution against the original objective, rates output quality, and synthesizes a formal completion verdict.

---

## 3. Safe, Functional Tool Registry

NEXUS agents execute only registered, server-side tools with strict Zod validation schemas. Raw model outputs never run arbitrary code, shell commands, or unparameterized SQL.

| Registered Tool | Purpose | Risk Level | Governance Rules |
| :--- | :--- | :--- | :--- |
| `db_task_create` | Inserts actionable tasks into `workflow_tasks` table | Low | Auto-permitted |
| `db_task_update` | Updates status (`todo`, `in_progress`, `completed`, `blocked`) | Low | Auto-permitted |
| `db_checklist_manage` | Generates procedural compliance checklist items | Low | Auto-permitted |
| `db_artifact_save` | Compiles and persists formal markdown / JSON artifacts | Low | Auto-permitted |
| `policy_compliance_check` | Evaluates enterprise policy thresholds & calculates risk score (0-100) | Medium / High | Gates workflow if risk score >= 70 |
| `system_notification_dispatch` | Dispatches in-app alerts to operators | Low | Auto-permitted |
| `http_data_fetch` | Fetches external JSON/API status (SSRF protected) | Medium | Strictly blocks loopback, private RFC1918 IPs, & cloud metadata |

---

## 4. Human-in-the-Loop (HITL) Governance Model

NEXUS Workflow firmly rejects unconstrained, reckless automation. The engine features an explicit governance layer:
- **Automatic Gating**: When a step's action involves financial thresholds, permission changes, or sensitive data transfer, the step is tagged with `requires_approval = true`.
- **Durable Pausing**: The engine transitions the workflow run to `awaiting_approval`, records an `approval.requested` audit event, and dispatches a notification.
- **Operator Review Console**: Authorized operators inspect the proposed action, risk rationale, and agent reasoning.
- **Decision Resolution**:
  - **Approve**: Operator provides an optional note. The engine sets the step status to `pending`, resumes execution, and emits an `approval.decided` audit event.
  - **Reject**: The step is marked `failed` with the operator's rejection explanation, preventing unauthorized execution.

---

## 5. Seeded Operational Blueprints (General-Purpose)

NEXUS Workflow includes five realistic operational templates for diverse team workflows:
1. **IT Incident & Request Triage**: Severity classification, log anomaly investigation, remediation checklist generation, and RCA compilation.
2. **Vendor Security & Compliance Review**: Vendor security posture audit, SOC2/GDPR validation, and CISO human sign-off gate.
3. **Customer Billing Dispute Resolution**: Ledger reconciliation, compute hours audit, and approval-gated refund processing.
4. **Employee Onboarding Coordination**: IT account provisioning, hardware dispatch checklists, and manager approval gates.
5. **Competitive Intelligence & Market Synthesis**: Emerging trend aggregation, SWOT matrix formulation, and executive briefing synthesis.
