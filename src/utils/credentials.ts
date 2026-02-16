import { randomBytes } from 'crypto';

export function generateCred(length = 26): string {
  const buffer = randomBytes(Math.ceil(length / 2));

  return buffer.toString('hex').slice(0, length);
}
