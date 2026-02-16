import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NestAppSingleton } from './e2e-context';
import { Sequelize } from 'sequelize-typescript';

describe('App Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await NestAppSingleton.getInstance();
    await app.get(Sequelize).sync();
  });

  afterAll(async () => {
    await NestAppSingleton.close();
    // await app.get(Sequelize).truncate();
  });

  it('/register (POST)', async () => {
    const user = {
      email: 'someone@domain.com',
      firstName: 'some',
      lastName: 'one',
      password: '12345678',
      confirmPassword: '12345678',
    };

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);
  });

  it('/login (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'someone@domain.com', password: '123' })
      .expect(401);
  });

  it('/login (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'someone@domain.com', password: '12345678' })
      .expect(201);
  });
});
