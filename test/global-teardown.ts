import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const envFile = join(__dirname, '.test-db-env.json');

export default async function globalTeardown() {
  const globalWithContainer = globalThis as typeof globalThis & {
    __ERRORTRACER_POSTGRES__?: { stop: () => Promise<void> };
  };

  try {
    await globalWithContainer.__ERRORTRACER_POSTGRES__?.stop();
  } finally {
    if (existsSync(envFile)) {
      unlinkSync(envFile);
    }
  }
}
