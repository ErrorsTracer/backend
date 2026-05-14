import request from 'supertest';
import { registerAndLogin } from '../support/auth';
import { resetTestData } from '../support/db-reset';
import { createE2eApp, E2eAppContext } from '../support/e2e-app';
import {
  createApplicationFixture,
  inviteUserToApplication,
} from '../support/fixtures';
import { authHeader } from '../support/http';

describe('Users API (e2e)', () => {
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

  it('covers profile and notification endpoints', async () => {
    const owner = await registerAndLogin(context.httpServer, 'owner');
    const member = await registerAndLogin(context.httpServer, 'member');
    const application = await createApplicationFixture(context, owner);
    await inviteUserToApplication(context, owner, application.id, member.email);

    await request(context.httpServer).get('/v0.1/users/profile').expect(401);

    await request(context.httpServer)
      .get('/v0.1/users/profile')
      .set(authHeader(owner.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            email: owner.email,
            firstName: 'owner',
            lastName: 'User',
          }),
        );
        expect(body.password).toBeUndefined();
      });

    const notificationsResponse = await request(context.httpServer)
      .get('/v0.1/users/notifications')
      .set(authHeader(member.accessToken))
      .expect(200);

    expect(notificationsResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          isRead: false,
          message: expect.stringContaining('invited'),
        }),
      ]),
    );

    const notificationId = notificationsResponse.body[0].id;

    await request(context.httpServer)
      .patch(`/v0.1/users/notifications/${notificationId}/read`)
      .expect(401);

    await request(context.httpServer)
      .patch(`/v0.1/users/notifications/${notificationId}/read`)
      .set(authHeader(owner.accessToken))
      .expect(404);

    await request(context.httpServer)
      .patch(`/v0.1/users/notifications/${notificationId}/read`)
      .set(authHeader(member.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          message: 'Notification marked as read successfully',
        });
      });

    await request(context.httpServer)
      .get('/v0.1/users/notifications')
      .set(authHeader(member.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body[0]).toEqual(
          expect.objectContaining({ id: notificationId, isRead: true }),
        );
      });
  });
});
