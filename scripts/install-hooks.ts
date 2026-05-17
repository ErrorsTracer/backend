import { chmodSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const hooksDir = '.githooks';
const safeDirectory = process.cwd().replace(/\\/g, '/');

if (existsSync(hooksDir)) {
  for (const hookName of readdirSync(hooksDir)) {
    chmodSync(join(hooksDir, hookName), 0o755);
  }
}

const gitConfig = spawnSync(
  'git',
  [
    '-c',
    `safe.directory=${safeDirectory}`,
    'config',
    'core.hooksPath',
    hooksDir,
  ],
  {
    stdio: 'inherit',
  },
);

if (gitConfig.status !== 0) {
  process.exit(gitConfig.status ?? 1);
}

console.log(`Git hooks installed from ${hooksDir}.`);
