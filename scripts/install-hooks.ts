import { chmodSync } from 'fs';
import { spawnSync } from 'child_process';

const hookPath = '.githooks/pre-push';

chmodSync(hookPath, 0o755);

const gitConfig = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  stdio: 'inherit',
});

if (gitConfig.status !== 0) {
  process.exit(gitConfig.status ?? 1);
}

console.log(`Git hooks installed from .githooks; ${hookPath} is executable.`);
