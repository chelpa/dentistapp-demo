import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
// Compiles tests/*.test.ts (and the pure src/lib modules they import) to a temp dir and runs them with node:test.
const directory = mkdtempSync(join(tmpdir(), 'dentistapp-tests-'));
try {
  const compile = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.tests.json', '--outDir', directory], { stdio: 'inherit' });
  if (compile.status !== 0) process.exitCode = compile.status ?? 1;
  else {
    const files = readdirSync('tests').filter(name => name.endsWith('.test.ts')).sort().map(name => join(directory, 'tests', name.replace(/\.ts$/, '.js')));
    const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
    process.exitCode = result.status ?? 1;
  }
} finally { rmSync(directory, { recursive: true, force: true }); }
