import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NestAppSingleton } from './e2e-context';
import { Sequelize } from 'sequelize-typescript';

describe('Orgs Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await NestAppSingleton.getInstance();
    // await app.get(Sequelize).sync();
  });

  afterAll(async () => {
    await NestAppSingleton.close();
    // await app.get(Sequelize).truncate();
  });

  it('/login (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'someone@domain.com', password: '123' })
      .expect(401);
  });
});
