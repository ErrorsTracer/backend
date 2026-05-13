import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { migrateTestDatabase } from './support/db-migrate';
import { seedTestDatabase } from './support/db-seed';

const envFile = join(__dirname, '.test-db-env.json');

export default async function globalSetup() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.ACCESS_TOKEN_SECRET =
    process.env.ACCESS_TOKEN_SECRET ?? 'test-access-token-secret';
  process.env.REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET ?? 'test-refresh-token-secret';

  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('errortracer_test')
    .withUsername('errortracer_test')
    .withPassword('errortracer_test')
    .start();

  const env = {
    NODE_ENV: 'test',
    DB_HOST: container.getHost(),
    DB_PORT: container.getPort().toString(),
    DB_USER: container.getUsername(),
    DB_PASSWORD: container.getPassword(),
    DB_NAME: container.getDatabase(),
    DATABASE_URL: container.getConnectionUri(),
    JWT_SECRET: process.env.JWT_SECRET,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  };

  Object.assign(process.env, env);
  writeFileSync(envFile, JSON.stringify(env, null, 2));

  try {
    await migrateTestDatabase();
    await seedTestDatabase();
  } catch (error) {
    await container.stop();
    if (existsSync(envFile)) {
      unlinkSync(envFile);
    }
    throw error;
  }

  (
    globalThis as typeof globalThis & {
      __ERRORTRACER_POSTGRES__?: typeof container;
    }
  ).__ERRORTRACER_POSTGRES__ = container;
}
