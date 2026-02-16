import { NestAppSingleton } from './e2e-context';

export default async () => {
  const postgres = (global as any).__POSTGRES__;

  if (postgres) {
    await postgres.stop();
  }
};
