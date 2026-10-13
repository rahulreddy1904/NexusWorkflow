import { describe, it, expect, beforeAll } from 'vitest';
import { executeTool, toolRegistry } from '../src/services/tools/registry.js';
import { runMigrations } from '../src/db/migrator.js';
import { seedDevelopmentData } from '../src/db/seed.js';

describe('Tool Registry & Safe Execution Tests', () => {
  const testContext = {
    workspaceId: 'ws_acme_ops_01',
    workflowRunId: 'run_sample_it_triage_01',
    stepId: 'stp_sample_01_1',
    userId: 'usr_demo_nexus_01',
  };

  beforeAll(async () => {
    await runMigrations();
    await seedDevelopmentData();
  });

  it('should execute db_task_create cleanly', async () => {
    const result = await executeTool('db_task_create', {
      title: 'Deploy Hotfix to Kubernetes Cluster',
      details: 'Patch memory allocation threshold on pod workers',
      assigned_to: 'infra-lead',
    }, testContext);

    expect(result.success).toBe(true);
    expect(result.taskId).toBeDefined();
    expect(result.title).toBe('Deploy Hotfix to Kubernetes Cluster');
  });

  it('should execute db_artifact_save cleanly', async () => {
    const result = await executeTool('db_artifact_save', {
      title: 'Incident Postmortem Report',
      type: 'document',
      content: '# Postmortem\n\nAll systems operational.',
      metadata: { author: 'Reviewer Agent' },
    }, testContext);

    expect(result.success).toBe(true);
    expect(result.artifactId).toBeDefined();
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it('should evaluate policy compliance and trigger human sign-off for high risk', async () => {
    const result = await executeTool('policy_compliance_check', {
      action_type: 'wire_transfer_payment',
      target_resource: 'Vendor Ledger #4992',
      risk_score: 95,
      explanation: 'Exceeds standard automated payment limit of $1,000.',
      requires_human_signoff: true,
    }, testContext);

    expect(result.requiresApproval).toBe(true);
    expect(result.governanceDecision).toBe('GATED_BY_HUMAN_APPROVAL');
  });

  it('should block SSRF requests to localhost or private IPs', async () => {
    await expect(
      executeTool('http_data_fetch', { url: 'http://localhost:8080/admin' }, testContext)
    ).rejects.toThrow(/SSRF Security Violation/);

    await expect(
      executeTool('http_data_fetch', { url: 'http://169.254.169.254/latest/meta-data/' }, testContext)
    ).rejects.toThrow(/SSRF Security Violation/);
  });

  it('should reject unknown tool executions', async () => {
    await expect(
      executeTool('unregistered_arbitrary_shell_exec', { cmd: 'rm -rf /' }, testContext)
    ).rejects.toThrow(/Unknown tool/);
  });
});
