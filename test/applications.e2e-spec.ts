import request from 'supertest';
import { registerAndLogin } from './support/auth';
import { resetTestData } from './support/db-reset';
import { createE2eApp, E2eAppContext } from './support/e2e-app';
import {
  createApplicationFixture,
  getReactAppTypeId,
  inviteUserToApplication,
} from './support/fixtures';
import { authHeader } from './support/http';

describe('Applications API (e2e)', () => {
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

  it('covers application endpoint contracts and authorization', async () => {
    const owner = await registerAndLogin(context.httpServer, 'owner');
    const member = await registerAndLogin(context.httpServer, 'member');

    await request(context.httpServer).get('/v0.1/applications').expect(401);

    const typesResponse = await request(context.httpServer)
      .get('/v0.1/applications/types')
      .expect(200);
    expect(typesResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          type: 'React',
        }),
      ]),
    );

    await request(context.httpServer)
      .post('/v0.1/applications')
      .set(authHeader(owner.accessToken))
      .send({ name: '', appType: 'not-a-uuid' })
      .expect(400);

    const appTypeId = await getReactAppTypeId(context);
    const application = await createApplicationFixture(context, owner);

    await request(context.httpServer)
      .post('/v0.1/registry/react')
      .send({
        credentials: { appKey: application.appKey },
        error: { error: 'ProductionDisabledSmoke' },
      })
      .expect(400);

    await request(context.httpServer)
      .post('/v0.1/applications')
      .set(authHeader(owner.accessToken))
      .send({
        name: application.name,
        about: 'Duplicate',
        appType: appTypeId,
      })
      .expect(400);

    const listResponse = await request(context.httpServer)
      .get('/v0.1/applications')
      .set(authHeader(owner.accessToken))
      .expect(200);
    expect(listResponse.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: application.id })]),
    );

    await request(context.httpServer)
      .get(`/v0.1/applications/${application.id}`)
      .set(authHeader(owner.accessToken))
      .expect(200);

    await request(context.httpServer)
      .get(`/v0.1/applications/${application.id}/memberships`)
      .set(authHeader(owner.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              role: 'owner',
              status: 'active',
            }),
          ]),
        );
      });

    await inviteUserToApplication(context, owner, application.id, member.email);

    await request(context.httpServer)
      .put(`/v0.1/applications/${application.id}/suspend`)
      .set(authHeader(member.accessToken))
      .expect(404);

    await request(context.httpServer)
      .put(`/v0.1/applications/${application.id}/suspend`)
      .set(authHeader(owner.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          message: 'Application suspended successfully',
        });
      });

    await request(context.httpServer)
      .put(`/v0.1/applications/${application.id}/activate`)
      .set(authHeader(owner.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          message: 'Application activated successfully',
        });
      });

    await request(context.httpServer)
      .put(`/v0.1/applications/${application.id}/credentials/production`)
      .set(authHeader(owner.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          message: 'Production mode updated successfully',
        });
      });

    await request(context.httpServer)
      .delete(`/v0.1/applications/${application.id}`)
      .set(authHeader(member.accessToken))
      .expect(404);

    await request(context.httpServer)
      .delete(`/v0.1/applications/${application.id}`)
      .set(authHeader(owner.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          message: 'Application deleted successfully',
        });
      });

    await request(context.httpServer)
      .get(`/v0.1/applications/${application.id}`)
      .set(authHeader(owner.accessToken))
      .expect(404);
  });
});
