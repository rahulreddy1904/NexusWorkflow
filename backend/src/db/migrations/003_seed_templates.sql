-- NEXUS WORKFLOW: Seed Operational Workflow Templates (General Purpose & Configurable)

INSERT INTO workflow_templates (
    id, workspace_id, name, category, description,
    default_goal, default_context, default_constraints,
    suggested_tools, approval_policies, is_system
) VALUES 
(
    'tmpl_it_incident_triage',
    NULL,
    'IT Incident & Request Triage',
    'triage',
    'Autonomous triage of production incidents and service requests: severity classification, diagnostic analysis, ticket routing, and remediation drafting.',
    'Investigate the reported API latency anomaly, isolate the root bottleneck, generate an incident checklist, and escalate if customer-impacting.',
    'Reports indicate /api/v1/checkout endpoint p99 response time degraded from 120ms to 2400ms over the past 30 minutes. Payment gateway returns 429 intermittently.',
    '["Do not restart services without human sign-off", "Enforce SOC2 audit trails", "Cap initial triage to 15 minutes"]'::jsonb,
    '["db_task_create", "db_checklist_manage", "policy_compliance_check", "db_artifact_save", "system_notification_dispatch"]'::jsonb,
    '{"requires_approval_on": ["service_restart", "firewall_rule_change", "severity_1_escalation"]}'::jsonb,
    true
),
(
    'tmpl_vendor_compliance_review',
    NULL,
    'Vendor Security & Compliance Review',
    'compliance',
    'Systematic evaluation of new vendor software, data privacy posture, SOC2/ISO certificates, and human sign-off for enterprise risk mitigation.',
    'Perform a multi-point security evaluation of CloudMetrics Analytics Inc, assess GDPR data processing addendum, and determine vendor tier.',
    'Vendor is requesting access to aggregated operational analytics. They claim SOC2 Type II compliance and headquarters in Frankfurt, Germany.',
    '["Check international data transfer safeguards", "Human legal/CISO approval required before final risk classification", "No raw PII exposure"]'::jsonb,
    '["db_checklist_manage", "policy_compliance_check", "db_artifact_save", "db_task_create"]'::jsonb,
    '{"requires_approval_on": ["vendor_approval", "tier_1_risk_acceptance", "contract_exception"]}'::jsonb,
    true
),
(
    'tmpl_customer_billing_dispute',
    NULL,
    'Customer Billing & Refund Dispute Resolution',
    'triage',
    'Autonomous ledger reconciliation, usage analysis, policy validation, and approval-gated refund processing for enterprise accounts.',
    'Reconcile reported overcharge of $2,450 for Acme Corp, calculate actual platform compute hours, draft resolution note, and prepare refund proposal.',
    'Acme Corp asserts billing period 2026-09 had 4 unused enterprise runner nodes active due to a misconfigured webhook trigger.',
    '["Refunds over $500 strictly require Finance Manager approval", "Preserve immutable transaction audit logs"]'::jsonb,
    '["db_task_create", "policy_compliance_check", "db_artifact_save", "system_notification_dispatch"]'::jsonb,
    '{"requires_approval_on": ["execute_refund", "credit_ledger_adjustment"]}'::jsonb,
    true
),
(
    'tmpl_employee_onboarding',
    NULL,
    'Employee Onboarding Coordination',
    'onboarding',
    'Orchestrates IT provisioning, hardware dispatch checklists, team introductions, compliance training schedules, and manager sign-off.',
    'Coordinate end-to-end 30-day onboarding for new Senior Reliability Engineer in London office.',
    'Start date is in 10 business days. Requires GitHub Enterprise access, AWS sandbox, and encrypted laptop delivery.',
    '["Admin privilege grants require Team Lead approval", "Hardware dispatch must verify address consent"]'::jsonb,
    '["db_task_create", "db_checklist_manage", "db_artifact_save", "system_notification_dispatch"]'::jsonb,
    '{"requires_approval_on": ["grant_production_access", "expedited_hardware_spend"]}'::jsonb,
    true
),
(
    'tmpl_market_research_synthesis',
    NULL,
    'Competitive Intelligence & Market Synthesis',
    'research',
    'Autonomous collection, synthesis, SWOT analysis, and executive briefing preparation for strategic initiatives.',
    'Synthesize emerging developments in Agentic AI Workflow Orchestration, map competitor capabilities, and produce executive briefing artifact.',
    'Focus on human-in-the-loop governance, multi-agent collaboration frameworks, and enterprise security compliance trends for 2026.',
    '["Cite verifiable industry sources", "Provide structured comparison matrix", "Highlight differentiation angles"]'::jsonb,
    '["db_artifact_save", "db_task_create", "system_notification_dispatch"]'::jsonb,
    '{"requires_approval_on": ["external_briefing_publication"]}'::jsonb,
    true
)
ON CONFLICT (id) DO NOTHING;
