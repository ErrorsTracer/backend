import request from 'supertest';
import { registerAndLogin } from './support/auth';
import { createE2eApp, E2eAppContext } from './support/e2e-app';
import { resetTestData } from './support/db-reset';

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
});
