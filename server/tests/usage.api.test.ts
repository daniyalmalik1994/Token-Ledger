import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { buildContainer } from '../src/container';
import { createApp } from '../src/interfaces/http/app';

let app: Express;
let token: string;

beforeAll(async () => {
  app = createApp(buildContainer({ file: ':memory:', secret: 'test-secret' }));
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'demo@token-ledger.dev', password: 'demo1234' });
  token = login.body.token;
});

describe('POST /api/auth/login', () => {
  it('returns a token and the signed-in user', () => {
    expect(token).toBeTypeOf('string');
  });

  it('rejects a wrong password without saying which field was wrong', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@token-ledger.dev', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('unauthorized');
  });
});

describe('POST /api/usage', () => {
  it('records a call and returns what it cost', async () => {
    const response = await request(app)
      .post('/api/usage')
      .set('Authorization', `Bearer ${token}`)
      .send({ model: 'gpt-4o', promptTokens: 2000, completionTokens: 500, latencyMs: 800 });

    expect(response.status).toBe(201);
    expect(response.body.cost).toBeCloseTo(0.01, 6);
    expect(response.body.event.provider).toBe('azure-openai');
  });

  it('refuses a model that is not on the price list', async () => {
    const response = await request(app)
      .post('/api/usage')
      .set('Authorization', `Bearer ${token}`)
      .send({ model: 'gpt-9-ultra', promptTokens: 10, completionTokens: 10 });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe('unknown_model');
  });

  it('needs a bearer token', async () => {
    const response = await request(app).post('/api/usage').send({ model: 'gpt-4o', promptTokens: 1, completionTokens: 1 });
    expect(response.status).toBe(401);
  });
});

describe('GET /api/usage/ledger', () => {
  it('reports totals, ledger lines and budget state', async () => {
    const response = await request(app).get('/api/usage/ledger').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.summary.calls).toBeGreaterThan(0);
    expect(response.body.lines.length).toBeGreaterThan(0);
    expect(response.body.budget.monthly).toBe(25);
  });

  it('validates query parameters instead of guessing', async () => {
    const response = await request(app)
      .get('/api/usage/ledger?days=999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});
