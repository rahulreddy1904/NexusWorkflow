import bcrypt from 'bcryptjs';
import { query, initDb } from './connection.js';
import { runMigrations } from './migrator.js';

export async function seedDevelopmentData(): Promise<void> {
  console.log('[Seed] Seeding development/demo records...');

  await runMigrations();

  // 1. Create Default Demo User
  const demoUserId = 'usr_demo_nexus_01';
  const demoEmail = 'demo@nexusworkflow.ai';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('NexusDemo2026!', salt);

  await query(`
    INSERT INTO users (id, email, password_hash, name, avatar_url)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email) DO UPDATE SET password_hash = $3, name = $4;
  `, [
    demoUserId,
    demoEmail,
    passwordHash,
    'Alex Vance (Ops Lead)',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  ]);

  // 2. Create Workspace
  const workspaceId = 'ws_acme_ops_01';
  await query(`
    INSERT INTO workspaces (id, name, slug, join_code, owner_id)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (slug) DO UPDATE SET name = $2, join_code = $4;
  `, [
    workspaceId,
    'Acme Global Operations',
    'acme-ops',
    'NX-DEMO-2026',
    demoUserId
  ]);

  // 3. Workspace Membership
  await query(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = $4;
  `, [
    'wsm_demo_01',
    workspaceId,
    demoUserId,
    'owner'
  ]);

  // 4. Sample Completed Workflow Run: IT Incident Triage
  const run1Id = 'run_sample_it_triage_01';
  await query(`
    INSERT INTO workflow_runs (
      id, workspace_id, template_id, user_id, title, goal, context,
      constraints, priority, status, current_step_index, total_steps,
      plan_summary, risk_assessment, final_summary
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14, $15
    ) ON CONFLICT (id) DO NOTHING;
  `, [
    run1Id,
    workspaceId,
    'tmpl_it_incident_triage',
    demoUserId,
    'Checkout Gateway Latency Spike Triage',
    'Investigate checkout latency spike, analyze telemetry logs, create diagnostic checklist, and draft remediation memo.',
    'P99 latency surged to 2400ms at 14:15 UTC. Redis cache hit ratio plummeted from 94% to 41%.',
    JSON.stringify(['Preserve audit trail', 'Enforce SOC2 compliance', 'Do not reboot live cluster']),
    'high',
    'completed',
    4,
    4,
    'Multi-agent plan: (1) Ingest telemetry metrics, (2) Correlate Redis connection saturation, (3) Generate mitigation tasks, (4) Publish incident RCA artifact.',
    JSON.stringify({ risk_level: 'medium', impact_score: 65, human_review_required: false }),
    'Triage completed successfully. Identified Redis connection leak in worker node pool. Mitigation tasks created and dispatched.'
  ]);

  // Steps for Run 1
  const step1Id = 'stp_sample_01_1';
  await query(`
    INSERT INTO workflow_steps (
      id, workflow_run_id, step_index, title, description, assigned_agent,
      status, tool_name, tool_arguments, tool_result, agent_reasoning
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11
    ) ON CONFLICT (id) DO NOTHING;
  `, [
    step1Id,
    run1Id,
    1,
    'Telemetry Ingestion & Anomaly Detection',
    'Ingest CloudWatch metrics and correlate database vs cache response times.',
    'triage_specialist',
    'completed',
    'db_task_create',
    JSON.stringify({ title: 'Inspect Redis Client Pool', assigned_to: 'infra-team' }),
    JSON.stringify({ task_id: 'tsk_01', status: 'created' }),
    'Telemetry indicates checkout service hit 100% max connection limit on cluster redis-east-01.'
  ]);

  const step2Id = 'stp_sample_01_2';
  await query(`
    INSERT INTO workflow_steps (
      id, workflow_run_id, step_index, title, description, assigned_agent,
      status, tool_name, tool_arguments, tool_result, agent_reasoning
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11
    ) ON CONFLICT (id) DO NOTHING;
  `, [
    step2Id,
    run1Id,
    2,
    'Diagnostic Checklist Formulation',
    'Formulate standardized incident response checklist for operations staff.',
    'executor',
    'completed',
    'db_checklist_manage',
    JSON.stringify({ items: ['Drain idle connections', 'Verify DNS fallback', 'Monitor checkout p99'] }),
    JSON.stringify({ items_count: 3 }),
    'Checklist populated and assigned to site reliability team.'
  ]);

  const step3Id = 'stp_sample_01_3';
  await query(`
    INSERT INTO workflow_steps (
      id, workflow_run_id, step_index, title, description, assigned_agent,
      status, tool_name, tool_arguments, tool_result, agent_reasoning
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11
    ) ON CONFLICT (id) DO NOTHING;
  `, [
    step3Id,
    run1Id,
    3,
    'Incident Remediation Memo Artifact',
    'Produce formal Root Cause Analysis (RCA) artifact.',
    'reviewer',
    'completed',
    'db_artifact_save',
    JSON.stringify({ title: 'RCA: Redis Connection Saturation Incident', type: 'document' }),
    JSON.stringify({ artifact_id: 'art_01', bytes: 1420 }),
    'RCA document compiled with timeline, impact, and prevention recommendations.'
  ]);

  // Artifact for Run 1
  await query(`
    INSERT INTO workflow_artifacts (
      id, workflow_run_id, step_id, title, type, content, metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7
    ) ON CONFLICT (id) DO NOTHING;
  `, [
    'art_01',
    run1Id,
    step3Id,
    'Root Cause Analysis: Redis Saturation',
    'document',
    '# Incident Summary\n\n- **Impact**: Checkout latency increased by 1800% for 22 minutes.\n- **Root Cause**: Unbounded connection acquisition in payment callback worker.\n- **Mitigation**: Pool cap set to 250 connections and keepalive timeout enforced.',
    JSON.stringify({ generated_by: 'reviewer_agent', version: '1.0' })
  ]);

  // 5. Sample Run Awaiting Approval: Vendor Security Review
  const run2Id = 'run_sample_vendor_review_02';
  await query(`
    INSERT INTO workflow_runs (
      id, workspace_id, template_id, user_id, title, goal, context,
      constraints, priority, status, current_step_index, total_steps,
      plan_summary, risk_assessment
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14
    ) ON CONFLICT (id) DO NOTHING;
  `, [
    run2Id,
    workspaceId,
    'tmpl_vendor_compliance_review',
    demoUserId,
    'Security Evaluation: CloudMetrics Analytics',
    'Perform security posture audit on CloudMetrics Analytics, evaluate SOC2 Type II report, and classify vendor risk tier.',
    'CloudMetrics requests read-only telemetry data feed. Company is based in Germany with AWS Frankfurt data residency.',
    JSON.stringify(['Require Legal sign-off for Tier 1 vendors', 'Zero raw customer PII transfer permitted']),
    'urgent',
    'awaiting_approval',
    2,
    3,
    'Plan: (1) Validate SOC2 Type II controls, (2) Evaluate cross-border data transfer compliance (Awaiting Human Approval), (3) Issue final risk certificate.',
    JSON.stringify({ risk_level: 'high', impact_score: 85, human_review_required: true })
  ]);

  const stepApprovalId = 'stp_sample_02_2';
  await query(`
    INSERT INTO workflow_steps (
      id, workflow_run_id, step_index, title, description, assigned_agent,
      status, tool_name, tool_arguments, requires_approval, approval_id, agent_reasoning
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12
    ) ON CONFLICT (id) DO NOTHING;
  `, [
    stepApprovalId,
    run2Id,
    2,
    'Authorize Enterprise Data Processing Addendum (DPA)',
    'Sign off on standard contractual clauses for CloudMetrics Frankfurt infrastructure.',
    'executor',
    'awaiting_approval',
    'policy_compliance_check',
    JSON.stringify({ action: 'approve_dpa_agreement', vendor: 'CloudMetrics GmbH', data_tier: 'aggregated_telemetry' }),
    true,
    'appr_sample_01',
    'Agent completed initial assessment: ISO 27001 is valid, but enterprise policy mandates explicit human Security Officer sign-off for all external telemetry access.'
  ]);

  // Approval record
  await query(`
    INSERT INTO workflow_approvals (
      id, workflow_run_id, step_id, workspace_id, action_type, action_summary,
      risk_level, risk_reason, status
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9
    ) ON CONFLICT (id) DO NOTHING;
  `, [
    'appr_sample_01',
    run2Id,
    stepApprovalId,
    workspaceId,
    'vendor_dpa_authorization',
    'Authorize Data Processing Addendum for CloudMetrics Analytics GmbH',
    'high',
    'Grants third-party vendor access to aggregated operational analytics stream. Requires human verification of SOC2 audit report scope.',
    'pending'
  ]);

  console.log('[Seed] Development data seeding completed successfully.');
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  seedDevelopmentData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[Seed CLI] Failed:', err);
      process.exit(1);
    });
}
