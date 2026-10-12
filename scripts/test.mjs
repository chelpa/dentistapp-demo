import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const directory = mkdtempSync(join(tmpdir(), 'dentistapp-tests-'));
try {
  const compile = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.tests.json', '--outDir', directory], { stdio: 'inherit' });
  if (compile.status !== 0) process.exitCode = compile.status ?? 1;
  else {
    const result = spawnSync(process.execPath, ['--test', join(directory, 'tests/calendar.test.js')], { stdio: 'inherit' });
    process.exitCode = result.status ?? 1;
  }
} finally { rmSync(directory, { recursive: true, force: true }); }
