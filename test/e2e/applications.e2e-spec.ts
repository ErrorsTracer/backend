import request from 'supertest';
import { registerAndLogin } from '../support/auth';
import { resetTestData } from '../support/db-reset';
import { createE2eApp, E2eAppContext } from '../support/e2e-app';
import {
  createApplicationFixture,
  getReactFrameworkId,
  inviteUserToApplication,
} from '../support/fixtures';
import { authHeader } from '../support/http';

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

    const frameworksResponse = await request(context.httpServer)
      .get('/v0.1/applications/frameworks')
      .expect(200);
    expect(frameworksResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: 'React.js',
        }),
      ]),
    );

    await request(context.httpServer)
      .post('/v0.1/applications')
      .set(authHeader(owner.accessToken))
      .send({ name: '', envName: '', framework: 'not-a-uuid' })
      .expect(400);

    const frameworkId = await getReactFrameworkId(context);
    const application = await createApplicationFixture(context, owner);
    let appKey = application.appKey;

    await request(context.httpServer)
      .post('/v0.1/errors/ingest')
      .set('X-ErrorTracer-Key', appKey)
      .send({ projectId: application.id, message: 'ProductionDisabledSmoke' })
      .expect(400);

    await request(context.httpServer)
      .post('/v0.1/applications')
      .set(authHeader(owner.accessToken))
      .send({
        name: application.name,
        envName: 'production',
        about: 'Duplicate',
        framework: frameworkId,
      })
      .expect(400);

    const listResponse = await request(context.httpServer)
      .get('/v0.1/applications')
      .set(authHeader(owner.accessToken))
      .expect(200);
    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: application.id,
          totalErrors: 0,
          criticalErrors: 0,
        }),
      ]),
    );

    await request(context.httpServer)
      .get(`/v0.1/applications/${application.id}`)
      .set(authHeader(owner.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            errorsCount: 0,
            criticalCount: 0,
          }),
        );
        expect(typeof body.errorsCount).toBe('number');
        expect(typeof body.criticalCount).toBe('number');
      });

    await request(context.httpServer)
      .get(`/v0.1/applications/${application.id}/credentials`)
      .set(authHeader(owner.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          appKey,
          isEnabled: false,
        });
      });

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
      .put(`/v0.1/applications/${application.id}/credentials/rotate`)
      .set(authHeader(member.accessToken))
      .expect(404);

    const rotateResponse = await request(context.httpServer)
      .put(`/v0.1/applications/${application.id}/credentials/rotate`)
      .set(authHeader(owner.accessToken))
      .expect(200);
    expect(rotateResponse.body).toEqual({
      appKey: expect.any(String),
      isEnabled: false,
      applicationId: application.id,
    });
    expect(rotateResponse.body.appKey).not.toBe(appKey);

    await request(context.httpServer)
      .post('/v0.1/errors/ingest')
      .set('X-ErrorTracer-Key', appKey)
      .send({ projectId: application.id, message: 'OldRotatedKeySmoke' })
      .expect(401);

    appKey = rotateResponse.body.appKey;

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
      .post('/v0.1/errors/ingest')
      .set('X-ErrorTracer-Key', appKey)
      .send({ projectId: application.id, message: 'NormalErrorSmoke' })
      .expect(201);

    await request(context.httpServer)
      .post('/v0.1/errors/ingest')
      .set('X-ErrorTracer-Key', appKey)
      .send({
        projectId: application.id,
        message: 'CriticalErrorSmoke',
        level: 'fatal',
      })
      .expect(201);

    await request(context.httpServer)
      .post('/v0.1/errors/ingest')
      .set('X-ErrorTracer-Key', appKey)
      .send({
        projectId: application.id,
        message: 'WarningErrorSmoke',
        level: 'warning',
      })
      .expect(201);

    await request(context.httpServer)
      .post('/v0.1/errors/ingest')
      .set('X-ErrorTracer-Key', appKey)
      .send({
        projectId: application.id,
        message: 'NamedErrorSmoke',
        name: 'RepeatedTypeErrorSmoke',
        level: 'error',
      })
      .expect(201);

    await request(context.httpServer)
      .post('/v0.1/errors/ingest')
      .set('X-ErrorTracer-Key', appKey)
      .send({
        projectId: application.id,
        message: 'NamedErrorSmokeAgain',
        name: 'RepeatedTypeErrorSmoke',
        level: 'error',
      })
      .expect(201);

    await request(context.httpServer)
      .get(`/v0.1/applications/${application.id}/errors?limit=101`)
      .set(authHeader(owner.accessToken))
      .expect(400);

    await request(context.httpServer)
      .get(`/v0.1/applications/${application.id}/errors?limit=1`)
      .set(authHeader(member.accessToken))
      .expect(404);

    const firstErrorsPage = await request(context.httpServer)
      .get(`/v0.1/applications/${application.id}/errors?limit=2`)
      .set(authHeader(owner.accessToken))
      .expect(200);
    expect(firstErrorsPage.body).toEqual({
      data: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          error: expect.any(String),
          level: expect.any(String),
        }),
      ]),
      pageInfo: {
        limit: 2,
        hasMore: true,
        nextCursor: expect.any(String),
      },
    });
    expect(firstErrorsPage.body.data).toHaveLength(2);

    const secondErrorsPage = await request(context.httpServer)
      .get(
        `/v0.1/applications/${application.id}/errors?limit=2&cursor=${firstErrorsPage.body.pageInfo.nextCursor}`,
      )
      .set(authHeader(owner.accessToken))
      .expect(200);
    expect(secondErrorsPage.body.pageInfo).toEqual({
      limit: 2,
      hasMore: true,
      nextCursor: expect.any(String),
    });
    expect(secondErrorsPage.body.data).toHaveLength(2);

    const thirdErrorsPage = await request(context.httpServer)
      .get(
        `/v0.1/applications/${application.id}/errors?limit=2&cursor=${secondErrorsPage.body.pageInfo.nextCursor}`,
      )
      .set(authHeader(owner.accessToken))
      .expect(200);
    expect(thirdErrorsPage.body.pageInfo).toEqual({
      limit: 2,
      hasMore: false,
      nextCursor: null,
    });
    expect(thirdErrorsPage.body.data).toHaveLength(1);

    const firstPageIds = firstErrorsPage.body.data.map(
      (item: { id: string }) => item.id,
    );
    const secondPageIds = secondErrorsPage.body.data.map(
      (item: { id: string }) => item.id,
    );
    const thirdPageIds = thirdErrorsPage.body.data.map(
      (item: { id: string }) => item.id,
    );
    expect(
      new Set([...firstPageIds, ...secondPageIds, ...thirdPageIds]).size,
    ).toBe(5);

    await request(context.httpServer)
      .get(`/v0.1/applications/${application.id}/errors/recent?limit=10`)
      .set(authHeader(owner.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.pageInfo).toEqual({
          limit: 10,
          hasMore: false,
        });
        expect(body.data).toHaveLength(4);
        expect(body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'RepeatedTypeErrorSmoke',
              errorName: 'RepeatedTypeErrorSmoke',
              repeated: 2,
            }),
            expect.objectContaining({
              error: 'NormalErrorSmoke',
              errorName: 'NormalErrorSmoke',
              repeated: 1,
            }),
          ]),
        );
        expect(
          body.data.filter(
            (item: { errorName: string }) =>
              item.errorName === 'RepeatedTypeErrorSmoke',
          ),
        ).toHaveLength(1);
        expect(typeof body.data[0].repeated).toBe('number');
      });

    const repeatedError = firstErrorsPage.body.data.find(
      (item: { name: string | null }) => item.name === 'RepeatedTypeErrorSmoke',
    );
    expect(repeatedError).toEqual(
      expect.objectContaining({
        id: expect.any(String),
      }),
    );

    await request(context.httpServer)
      .get(`/v0.1/applications/${application.id}/errors/${repeatedError.id}`)
      .set(authHeader(member.accessToken))
      .expect(404);

    await request(context.httpServer)
      .get(`/v0.1/applications/${application.id}/errors/${repeatedError.id}`)
      .set(authHeader(owner.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            id: repeatedError.id,
            name: 'RepeatedTypeErrorSmoke',
            errorName: 'RepeatedTypeErrorSmoke',
            repeated: 2,
          }),
        );
        expect(typeof body.repeated).toBe('number');
      });

    await request(context.httpServer)
      .get(
        `/v0.1/applications/${application.id}/errors/00000000-0000-0000-0000-000000000000`,
      )
      .set(authHeader(owner.accessToken))
      .expect(404);

    await request(context.httpServer)
      .get(`/v0.1/applications/${application.id}`)
      .set(authHeader(owner.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            errorsCount: 5,
            criticalCount: 1,
          }),
        );
        expect(typeof body.errorsCount).toBe('number');
        expect(typeof body.criticalCount).toBe('number');
      });

    await request(context.httpServer)
      .get('/v0.1/applications')
      .set(authHeader(owner.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: application.id,
              totalErrors: 5,
              criticalErrors: 1,
            }),
          ]),
        );
        const listedApplication = body.find(
          (item: { id: string }) => item.id === application.id,
        );
        expect(typeof listedApplication.totalErrors).toBe('number');
        expect(typeof listedApplication.criticalErrors).toBe('number');
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
