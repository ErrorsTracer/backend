import request from 'supertest';
import { registerAndLogin } from '../support/auth';
import { createE2eApp, E2eAppContext } from '../support/e2e-app';
import { resetTestData } from '../support/db-reset';
import { authHeader } from '../support/http';

describe('Auth API (e2e)', () => {
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

  it('registers users, rejects duplicates, logs in, and refreshes tokens', async () => {
    const owner = await registerAndLogin(context.httpServer, 'owner');

    await request(context.httpServer)
      .post('/v0.1/auth/register')
      .send({
        firstName: 'Duplicate',
        lastName: 'User',
        email: owner.email,
        password: 'Password123!',
      })
      .expect(422);

    await request(context.httpServer)
      .post('/v0.1/auth/login')
      .send({ email: owner.email, password: 'wrong-password' })
      .expect(401);

    await request(context.httpServer).post('/v0.1/auth/refresh').expect(401);

    const refreshResponse = await request(context.httpServer)
      .post('/v0.1/auth/refresh')
      .set('Cookie', owner.cookie)
      .expect(201);

    expect(refreshResponse.body).toEqual({
      accessToken: expect.any(String),
    });
  });

  it('logs out of the current session', async () => {
    const owner = await registerAndLogin(context.httpServer, 'owner');

    await request(context.httpServer)
      .post('/v0.1/auth/logout')
      .set('Cookie', owner.cookie)
      .expect(204)
      .expect('set-cookie', /refresh_token=;/);

    await request(context.httpServer)
      .post('/v0.1/auth/refresh')
      .set('Cookie', owner.cookie)
      .expect(401);
  });

  it('requires access tokens for protected API endpoints', async () => {
    const owner = await registerAndLogin(context.httpServer, 'owner');

    await request(context.httpServer).get('/v0.1/users/profile').expect(401);

    await request(context.httpServer)
      .get('/v0.1/users/profile')
      .set(authHeader('not-a-valid-access-token'))
      .expect(401);

    await request(context.httpServer)
      .get('/v0.1/users/profile')
      .set('Cookie', owner.cookie)
      .expect(401);

    await request(context.httpServer)
      .get('/v0.1/users/profile')
      .set(authHeader(owner.accessToken))
      .expect(200);
  });

  it('rejects revoked refresh tokens after logout', async () => {
    const owner = await registerAndLogin(context.httpServer, 'owner');

    await request(context.httpServer)
      .post('/v0.1/auth/logout')
      .set('Cookie', owner.cookie)
      .expect(204);

    await request(context.httpServer)
      .post('/v0.1/auth/refresh')
      .set('Cookie', owner.cookie)
      .expect(401);
  });
});
