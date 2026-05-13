import request from 'supertest';
import { registerAndLogin } from './support/auth';
import { resetTestData } from './support/db-reset';
import { createE2eApp, E2eAppContext } from './support/e2e-app';
import {
  createApplicationFixture,
  enableProductionCredentials,
} from './support/fixtures';

describe('Registry API (e2e)', () => {
  let context: E2eAppContext;

  beforeAll(async () => {
    context = await createE2eApp();
  });

  beforeEach(async () => {
    await resetTestData();
  });

  afterAll(async () => {
    await context.app.close();
  });

  it('records React errors only for valid production credentials', async () => {
    const owner = await registerAndLogin(context.httpServer, 'owner');
    const application = await createApplicationFixture(context, owner);

    await request(context.httpServer)
      .post('/v0.1/registry/react')
      .send({
        credentials: { appKey: 'invalid-key' },
        error: { error: 'ReferenceError', stack: 'stack trace' },
      })
      .expect(400);

    await request(context.httpServer)
      .post('/v0.1/registry/react')
      .send({
        credentials: { appKey: application.appKey },
        error: { error: 'ProductionDisabledSmoke' },
      })
      .expect(400);

    await enableProductionCredentials(context, owner, application.id);

    await request(context.httpServer)
      .post('/v0.1/registry/react')
      .send({
        credentials: { appKey: application.appKey },
        error: {
          error: 'ReferenceError',
          stack: 'stack trace',
          href: 'https://example.com',
          host: 'example.com',
          agent: 'supertest',
          platform: 'node',
          additionalData: JSON.stringify({ suite: 'e2e' }),
        },
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({ message: 'Error registry created!' });
      });
  });
});
