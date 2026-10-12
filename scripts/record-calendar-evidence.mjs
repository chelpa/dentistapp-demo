import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

// Run from the repo root. Records failures as evidence; it never installs,
// repairs dependencies, commits, merges or deploys.
const output = join('docs', 'calendar-001', 'evidence');
mkdirSync(output, { recursive: true });
const hash = value => createHash('sha256').update(value).digest('hex');
const git = args => spawnSync('git', args, { encoding: 'utf8' }).stdout?.trim();
const files = [...new Set(git(['ls-files', '-co', '--exclude-standard']).split('\n'))]
  .filter(file => /^(src\/|tests\/|scripts\/|package(?:-lock)?\.json$|tsconfig.*\.json$|next\.config|tailwind\.config|postcss\.config|\.github\/workflows\/)/.test(file)).sort();
const sources = files.map(path => ({ path, sha256: hash(readFileSync(path)) }));
const sourceDigest = hash(JSON.stringify(sources));
const runs = [];
const commands = [
  ['tests', 'npm', ['test']],
  ['typecheck', 'npm', ['run', 'typecheck']],
  ['static-build', 'npm', ['run', 'build:static']],
  ['dependency-tree', 'npm', ['ls', 'next', 'postcss', 'sharp', 'source-map-js']],
  ['production-audit', 'npm', ['audit', '--omit=dev', '--json']],
  ['diff-check', 'git', ['diff', '--check']],
];
for (const [name, command, args] of commands) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, { encoding: 'utf8', env: { ...process.env, DENTISTAPP_BASE_PATH: '/dentistapp-demo' }, maxBuffer: 8 * 1024 * 1024 });
  const log = (result.stdout ?? '') + (result.stderr ?? '') + (result.error ? `\n${result.error.message}\n` : '');
  const file = `${name}.log`;
  writeFileSync(join(output, file), log);
  runs.push({ name, command: [command, ...args].join(' '), startedAt, endedAt: new Date().toISOString(), exitCode: result.status, signal: result.signal, log: file, logSha256: hash(log) });
  process.stdout.write(`${name}: ${result.status === 0 ? 'PASS' : 'HOLD'} (exit ${result.status})\n`);
}
let vulnerabilities = null;
try { vulnerabilities = JSON.parse(readFileSync(join(output, 'production-audit.log'), 'utf8')).metadata?.vulnerabilities ?? null; } catch { /* Unavailable endpoint is HOLD, never zero vulnerabilities. */ }
const subjectAfter = files.map(path => ({ path, sha256: hash(readFileSync(path)) }));
const manifest = {
  case: 'DENTISTAPP-CALENDAR-001', capturedAt: new Date().toISOString(),
  baseline: 'aaa83077c462b4de8b7a509ee76946ce69fdc89a',
  checkoutHead: git(['rev-parse', 'HEAD']), branch: git(['branch', '--show-current']),
  runtime: { node: process.version, npm: spawnSync('npm', ['--version'], { encoding: 'utf8' }).stdout.trim(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  sourceDigest, sources, sourceUnchangedDuringChecks: hash(JSON.stringify(subjectAfter)) === sourceDigest,
  runs, vulnerabilities,
  gates: { G2: runs.filter(r => ['tests', 'typecheck', 'static-build', 'dependency-tree', 'diff-check'].includes(r.name)).every(r => r.exitCode === 0) ? 'PASS_TECHNICAL' : 'HOLD', G3: vulnerabilities?.total === 0 && runs.find(r => r.name === 'production-audit').exitCode === 0 ? 'PASS_AUDIT_ONLY' : 'HOLD', G4: 'SEE_SEPARATE_BROWSER_EVIDENCE', G5: 'HOLD_B_C_COMPARISON', G6: 'HOLD_NO_PUBLICATION_AUTHORITY' },
  limits: ['Source hashes bind these checks; checkoutHead may be the pre-commit base.', 'Build PASS does not establish UI, security or authority.', 'Audit failure or unavailable metadata is HOLD.', 'localStorage provides no atomic concurrent booking guarantee.'],
};
writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
if (manifest.gates.G2 !== 'PASS_TECHNICAL' || !manifest.sourceUnchangedDuringChecks) process.exitCode = 1;
