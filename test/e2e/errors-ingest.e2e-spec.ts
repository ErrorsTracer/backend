import { getModelToken } from '@nestjs/sequelize';
import request from 'supertest';
import { Errors } from '../../src/database/models/errors.model';
import { Usage } from '../../src/database/models/usage.model';
import { UsageRepository } from '../../src/modules/usage/usage.repo';
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
  let usageModel: typeof Usage;

  beforeAll(async () => {
    context = await createE2eApp();
    errorsModel = context.app.get<typeof Errors>(getModelToken(Errors));
    usageModel = context.app.get<typeof Usage>(getModelToken(Usage));
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
    const payload = {
      projectId: application.id,
      message: 'Unhandled TypeError',
    };

    const response = await postIngest(application.appKey, payload).expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      status: 'accepted',
    });

    const usage = await usageModel.findOne({
      where: { applicationId: application.id },
    });

    expect(usage).toEqual(
      expect.objectContaining({
        applicationId: application.id,
        userId: expect.any(String),
        totalErrorBytes: String(
          Buffer.byteLength(JSON.stringify(payload), 'utf8'),
        ),
        totalErrorCount: '1',
      }),
    );
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

  it('tracks the raw request body size when it is available', async () => {
    const application = await createIngestionTarget();
    const rawPayload = `{
  "projectId": "${application.id}",
  "message": "Raw body size smoke"
}`;

    await request(context.httpServer)
      .post('/v0.1/errors/ingest')
      .set('X-ErrorTracer-Key', application.appKey)
      .set('Content-Type', 'application/json')
      .send(rawPayload)
      .expect(201);

    const usage = await usageModel.findOne({
      where: { applicationId: application.id },
    });

    expect(usage?.totalErrorBytes).toBe(
      String(Buffer.byteLength(rawPayload, 'utf8')),
    );
  });

  it('rolls back the error when usage persistence fails', async () => {
    const application = await createIngestionTarget();
    const usageCreate = jest
      .spyOn(UsageRepository.prototype, 'incrementForApplication')
      .mockRejectedValueOnce(new Error('usage persistence failed'));

    try {
      await postIngest(application.appKey, {
        projectId: application.id,
        message: 'Atomic ingest smoke',
      }).expect(500);

      expect(await errorsModel.count()).toBe(0);
      expect(await usageModel.count()).toBe(0);
    } finally {
      usageCreate.mockRestore();
    }
  });

  it('increments one aggregate row safely for concurrent ingestion', async () => {
    const application = await createIngestionTarget('concurrent-owner');
    const payloads = Array.from({ length: 20 }, (_, index) => ({
      projectId: application.id,
      message: `Concurrent ingestion ${index}`,
    }));

    await Promise.all(
      payloads.map((payload) =>
        postIngest(application.appKey, payload).expect(201),
      ),
    );

    const usages = await usageModel.findAll({
      where: { applicationId: application.id },
    });
    const expectedBytes = payloads.reduce(
      (total, payload) =>
        total + Buffer.byteLength(JSON.stringify(payload), 'utf8'),
      0,
    );

    expect(usages).toHaveLength(1);
    expect(usages[0].totalErrorCount).toBe('20');
    expect(usages[0].totalErrorBytes).toBe(String(expectedBytes));
  });

  it('accepts database-shaped payloads that use error as the message field', async () => {
    const application = await createIngestionTarget();

    await postIngest(application.appKey, {
      error: 'Submitted profile payload failed server-side validation',
      environment: 'production',
      framework: 'NestJS',
      language: 'TypeScript',
      runtime: 'server',
      level: 'error',
      name: 'ValidationError',
      fingerprint: 'dummy:users:validationerror',
      handled: true,
      timestamp: '2026-05-20T23:39:27.000Z',
      transaction: 'PATCH /api/profile',
      extra: { serverName: 'api-4', durationMs: 4095 },
    }).expect(201);

    const persisted = await errorsModel.findOne({
      where: { applicationId: application.id },
    });

    expect(persisted?.error).toBe(
      'Submitted profile payload failed server-side validation',
    );
    expect(persisted?.fingerprint).toBe('dummy:users:validationerror');
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

    expect(await usageModel.count()).toBe(0);
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
