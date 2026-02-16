import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { config } from 'dotenv';
import { NestAppSingleton } from './e2e-context';

export default async () => {
  const env: any = config({ path: '.env.test' }).parsed;

  const postgres = await new PostgreSqlContainer('postgres:latest')
    .withDatabase(env.DB_NAME)
    .withUsername(env.DB_USER)
    .withPassword(env.DB_PASSWORD)
    .start();

  process.env.DB_HOST = postgres.getHost();
  process.env.DB_PORT = postgres.getPort().toString();
  process.env.DB_USERNAME = postgres.getUsername();
  process.env.DB_PASSWORD = postgres.getPassword();
  process.env.DB_NAME = postgres.getDatabase();

  (global as any).__POSTGRES_CONTAINER__ = postgres;
};
