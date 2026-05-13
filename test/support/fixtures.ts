import { getModelToken } from '@nestjs/sequelize';
import request from 'supertest';
import { ApplicationTypes } from '../../src/database/models/application-types.model';
import { Credentials } from '../../src/database/models/credentials.model';
import { AuthSession } from './auth';
import { E2eAppContext } from './e2e-app';
import { authHeader } from './http';

let appCounter = 0;

export type ApplicationFixture = {
  id: string;
  name: string;
  appKey: string;
};

export async function getReactAppTypeId(context: E2eAppContext) {
  const appTypesModel = context.app.get<typeof ApplicationTypes>(
    getModelToken(ApplicationTypes),
  );
  const appType = await appTypesModel.findOne({ where: { type: 'React' } });

  if (!appType) {
    throw new Error('React application type seed is missing');
  }

  return appType.id;
}

export async function createApplicationFixture(
  context: E2eAppContext,
  owner: AuthSession,
): Promise<ApplicationFixture> {
  appCounter += 1;

  const createResponse = await request(context.httpServer)
    .post('/v0.1/applications')
    .set(authHeader(owner.accessToken))
    .send({
      name: `E2E App ${appCounter}`,
      about: 'Created by e2e tests',
      appType: await getReactAppTypeId(context),
    })
    .expect(201);

  const credentialsModel = context.app.get<typeof Credentials>(
    getModelToken(Credentials),
  );
  const credential = await credentialsModel.findOne({
    where: { applicationId: createResponse.body.id },
  });

  if (!credential) {
    throw new Error('Application credential was not created');
  }

  return {
    id: createResponse.body.id,
    name: createResponse.body.name,
    appKey: credential.appKey,
  };
}

export async function enableProductionCredentials(
  context: E2eAppContext,
  owner: AuthSession,
  applicationId: string,
) {
  await request(context.httpServer)
    .put(`/v0.1/applications/${applicationId}/credentials/production`)
    .set(authHeader(owner.accessToken))
    .expect(200);
}

export async function inviteUserToApplication(
  context: E2eAppContext,
  owner: AuthSession,
  applicationId: string,
  invitedEmail: string,
) {
  await request(context.httpServer)
    .post(`/v0.1/applications/${applicationId}/invite`)
    .set(authHeader(owner.accessToken))
    .send({ emails: [invitedEmail] })
    .expect(201);
}
