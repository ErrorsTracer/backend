import { getModelToken } from '@nestjs/sequelize';
import request from 'supertest';
import { Errors } from '../../src/database/models/errors.model';
import { registerAndLogin } from '../support/auth';
import { resetTestData } from '../support/db-reset';
import { createE2eApp, E2eAppContext } from '../support/e2e-app';
import {
  createApplicationFixture,
  enableProductionEnvironment,
} from '../support/fixtures';

describe('Generic error ingestion API (e2e)', () => {
  let context: E2eAppContext;
  let errorsModel: typeof Errors;

  beforeAll(async () => {
    context = await createE2eApp();
    errorsModel = context.app.get<typeof Errors>(getModelToken(Errors));
  });

  beforeEach(async () => {
    await resetTestData();
  });

  afterAll(async () => {
    await context.app.close();
  });

  async function createIngestionTarget(prefix = 'owner') {
    const owner = await registerAndLogin(context.httpServer, prefix);
    const application = await createApplicationFixture(context, owner);
    await enableProductionEnvironment(context, owner, application.id);

    return application;
  }

  function postIngest(appKey: string, payload: Record<string, unknown>) {
    return request(context.httpServer)
      .post('/v0.1/errors/ingest')
      .set('X-ErrorTracer-Key', appKey)
      .send(payload);
  }

  it('successfully ingests a minimal valid error payload', async () => {
    const application = await createIngestionTarget();

    const response = await postIngest(application.appKey, {
      projectId: application.id,
      message: 'Unhandled TypeError',
    }).expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      status: 'accepted',
    });
  });

  it('successfully ingests a rich React/browser payload', async () => {
    const application = await createIngestionTarget();

    await postIngest(application.appKey, {
      projectId: application.id,
      environment: 'production',
      framework: 'react',
      language: 'typescript',
      runtime: 'browser',
      level: 'error',
      message: 'Unhandled TypeError: Cannot read properties of undefined',
      name: 'TypeError',
      stack: 'TypeError\n    at BillingPage (https://example.com/app.js:10:20)',
      handled: false,
      release: '1.2.3',
      url: 'https://example.com/dashboard',
      transaction: 'GET /dashboard',
      user: { id: 'user-123', email: 'user@example.com' },
      request: { method: 'GET', url: '/dashboard', headers: {} },
      tags: { region: 'us-east-1', feature: 'billing' },
      extra: { component: 'BillingPage' },
      breadcrumbs: [
        {
          timestamp: '2026-05-14T10:29:59.000Z',
          category: 'ui.click',
          message: 'Clicked checkout button',
          level: 'info',
          data: {},
        },
      ],
      contexts: {
        browser: { name: 'Chrome', version: '124' },
        os: { name: 'macOS', version: '14' },
      },
    }).expect(201);

    const persisted = await errorsModel.findOne({
      where: { applicationId: application.id },
    });

    expect(persisted?.framework).toBe('react');
    expect(persisted?.runtime).toBe('browser');
    expect(persisted?.tags).toEqual({
      region: 'us-east-1',
      feature: 'billing',
    });
  });

  it('successfully ingests a Laravel/server-style payload', async () => {
    const application = await createIngestionTarget();

    await postIngest(application.appKey, {
      projectId: application.id,
      framework: 'laravel',
      language: 'php',
      runtime: 'server',
      level: 'fatal',
      message: 'SQLSTATE[42S02]: Base table or view not found',
      name: 'Illuminate\\Database\\QueryException',
      stack: '#0 /var/www/app/Http/Controllers/BillingController.php(42)',
      transaction: 'POST /billing/checkout',
      serverName: 'web-1',
      request: {
        method: 'POST',
        url: '/billing/checkout',
        headers: { host: 'example.com' },
      },
      contexts: { os: { name: 'linux' } },
    }).expect(201);

    const persisted = await errorsModel.findOne({
      where: { applicationId: application.id },
    });

    expect(persisted?.framework).toBe('laravel');
    expect(persisted?.runtime).toBe('server');
    expect(persisted?.extra).toEqual({ serverName: 'web-1' });
  });

  it('defaults level to error when omitted', async () => {
    const application = await createIngestionTarget();

    await postIngest(application.appKey, {
      projectId: application.id,
      message: 'Default level smoke',
    }).expect(201);

    const persisted = await errorsModel.findOne({
      where: { applicationId: application.id },
    });
    expect(persisted?.level).toBe('error');
  });

  it('defaults environment to production when omitted', async () => {
    const application = await createIngestionTarget();

    await postIngest(application.appKey, {
      projectId: application.id,
      message: 'Default environment smoke',
    }).expect(201);

    const persisted = await errorsModel.findOne({
      where: { applicationId: application.id },
    });
    expect(persisted?.environment).toBe('production');
  });

  it('defaults timestamp to server time when omitted', async () => {
    const application = await createIngestionTarget();
    const before = Date.now();

    await postIngest(application.appKey, {
      projectId: application.id,
      message: 'Default timestamp smoke',
    }).expect(201);

    const after = Date.now();
    const persisted = await errorsModel.findOne({
      where: { applicationId: application.id },
    });

    expect(persisted?.timestamp?.getTime()).toBeGreaterThanOrEqual(before);
    expect(persisted?.timestamp?.getTime()).toBeLessThanOrEqual(after);
  });

  it('rejects payload missing message', async () => {
    const application = await createIngestionTarget();

    await postIngest(application.appKey, {
      projectId: application.id,
    }).expect(400);
  });

  it('rejects invalid level', async () => {
    const application = await createIngestionTarget();

    await postIngest(application.appKey, {
      projectId: application.id,
      message: 'Invalid level smoke',
      level: 'panic',
    }).expect(400);
  });

  it('rejects invalid runtime', async () => {
    const application = await createIngestionTarget();

    await postIngest(application.appKey, {
      projectId: application.id,
      message: 'Invalid runtime smoke',
      runtime: 'lambda',
    }).expect(400);
  });

  it('rejects missing API key', async () => {
    const application = await createIngestionTarget();

    await request(context.httpServer)
      .post('/v0.1/errors/ingest')
      .send({
        projectId: application.id,
        message: 'Missing key smoke',
      })
      .expect(401);
  });

  it('rejects invalid API key', async () => {
    const application = await createIngestionTarget();

    await postIngest('invalid-key', {
      projectId: application.id,
      message: 'Invalid key smoke',
    }).expect(401);
  });

  it('rejects projectId/key mismatch when both are provided', async () => {
    const first = await createIngestionTarget('first');
    const second = await createIngestionTarget('second');

    await postIngest(first.appKey, {
      projectId: second.id,
      message: 'Mismatch smoke',
    }).expect(403);
  });

  it('redacts sensitive request headers/body fields before saving', async () => {
    const application = await createIngestionTarget();

    await postIngest(application.appKey, {
      projectId: application.id,
      message: 'Sensitive data smoke',
      request: {
        headers: {
          authorization: 'Bearer secret',
          cookie: 'session=secret',
        },
        body: {
          password: 'secret',
          token: 'secret',
          profile: { apiKey: 'secret', safe: 'kept' },
        },
      },
    }).expect(201);

    const persisted = await errorsModel.findOne({
      where: { applicationId: application.id },
    });

    expect(persisted?.request).toEqual({
      headers: {
        authorization: '[Redacted]',
        cookie: '[Redacted]',
      },
      body: {
        password: '[Redacted]',
        token: '[Redacted]',
        profile: { apiKey: '[Redacted]', safe: 'kept' },
      },
    });
  });

  it('enforces payload size limit', async () => {
    const application = await createIngestionTarget();

    await postIngest(application.appKey, {
      projectId: application.id,
      message: 'Large payload smoke',
      extra: { blob: 'x'.repeat(120_000) },
    }).expect(413);
  });

  it('persists the event and verifies it exists in the database', async () => {
    const application = await createIngestionTarget();

    const response = await postIngest(application.appKey, {
      projectId: application.id,
      message: 'Persistence smoke',
      fingerprint: 'manual-fingerprint',
    }).expect(201);

    const persisted = await errorsModel.findByPk(response.body.id);

    expect(persisted?.applicationId).toBe(application.id);
    expect(persisted?.error).toBe('Persistence smoke');
    expect(persisted?.fingerprint).toBe('manual-fingerprint');
  });

  it('ensures response does not leak sensitive data', async () => {
    const application = await createIngestionTarget();

    const response = await postIngest(application.appKey, {
      projectId: application.id,
      message: 'Response leak smoke',
      request: {
        headers: { authorization: 'Bearer secret' },
        body: { password: 'secret' },
      },
    }).expect(201);

    expect(JSON.stringify(response.body)).not.toContain('secret');
    expect(response.body).toEqual({
      id: expect.any(String),
      status: 'accepted',
    });
  });
});
