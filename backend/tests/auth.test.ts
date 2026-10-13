import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { runMigrations } from '../src/db/migrator.js';
import { seedDevelopmentData } from '../src/db/seed.js';

describe('Authentication & Identity Tests', () => {
  beforeAll(async () => {
    await runMigrations();
    await seedDevelopmentData();
  });

  it('should authenticate demo user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'demo@nexusworkflow.ai',
        password: 'NexusDemo2026!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('demo@nexusworkflow.ai');
    expect(res.body.data.workspace.id).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'demo@nexusworkflow.ai',
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should register a new unique user and workspace', async () => {
    const uniqueEmail = `test_${Date.now()}@testcorp.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail,
        password: 'StrongTestPassword2026!',
        name: 'Sarah Connor',
        workspaceName: 'Cyberdyne Operations',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(uniqueEmail);
    expect(res.body.data.workspace.name).toBe('Cyberdyne Operations');
  });

  it('should reject registration if email is already taken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'demo@nexusworkflow.ai',
        password: 'AnotherPassword2026!',
        name: 'Imposter',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('USER_EXISTS');
  });

  it('should check OAuth provider status truthfully', async () => {
    const res = await request(app).get('/api/v1/auth/oauth/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.google).toBeDefined();
    expect(res.body.data.facebook).toBeDefined();
    // Default env has no Google client ID, so configured must be false
    expect(res.body.data.google.configured).toBe(false);
  });
});
