import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { runMigrations } from '../src/db/migrator.js';
import { seedDevelopmentData } from '../src/db/seed.js';

describe('Workflow Engine & Orchestration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    await runMigrations();
    await seedDevelopmentData();

    // Login demo user
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'demo@nexusworkflow.ai',
        password: 'NexusDemo2026!',
      });
    authToken = res.body.data.token;
  });

  it('should list seeded workflows with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/workflows?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('should create and plan a new workflow request', async () => {
    const res = await request(app)
      .post('/api/v1/workflows')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Q4 Access Credential Audit',
        goal: 'Audit inactive developer AWS keys, revoke expired certificates, and publish compliance report.',
        constraints: ['Zero downtime', 'Log all changes'],
        priority: 'high',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.runId).toBeDefined();
    expect(res.body.data.plan.steps.length).toBeGreaterThanOrEqual(2);
  });

  it('should fetch workflow run details including steps, artifacts, and tasks', async () => {
    const res = await request(app)
      .get('/api/v1/workflows/run_sample_it_triage_01')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('run_sample_it_triage_01');
    expect(res.body.data.steps).toBeInstanceOf(Array);
    expect(res.body.data.artifacts).toBeInstanceOf(Array);
  });

  it('should pause and resume an active workflow', async () => {
    // Pause
    const pauseRes = await request(app)
      .post('/api/v1/workflows/run_sample_it_triage_01/pause')
      .set('Authorization', `Bearer ${authToken}`);
    expect(pauseRes.status).toBe(200);

    // Resume
    const resumeRes = await request(app)
      .post('/api/v1/workflows/run_sample_it_triage_01/resume')
      .set('Authorization', `Bearer ${authToken}`);
    expect(resumeRes.status).toBe(200);
  });
});
