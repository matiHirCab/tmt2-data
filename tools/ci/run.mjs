import fs from 'node:fs';
import path from 'node:path';
import {config, preflight, lockWorkspace, manifest, writeSnapshot, supervise, root} from '../workspace/core.mjs';
import {verifyPins} from './pins.mjs';
import {coreGrep, networkGrep, networkTests} from './policy.mjs';
const node = (cwd, args, label) => ({file: process.execPath, args, cwd, label});
const npm = (cwd, args, label) => ({file: 'npm', args, cwd, label});
try {
  const [mode, ...extra] = process.argv.slice(2);
  if (!['core', 'network'].includes(mode) || extra.length) throw Error('Usage: run.mjs core|network');
  const c = config(); preflight(c); verifyPins(c);
  const release = lockWorkspace();
  try {
    console.log(`CI mode: ${mode}. Live-network tests ${mode === 'core' ? 'NOT RUN here; separate diagnostic' : 'RUN with real exit status'}:`);
    console.log(networkTests.join('\n'));
    const commands = mode === 'network' ? [
      node(c.server, ['node_modules/mocha/bin/mocha.js', '--no-config', 'test/main.js', 'test/server/ip-tools.js',
        '--grep', networkGrep, '--reporter', 'spec', '--timeout', '2000', '--exit'], 'live DNS diagnostics (not mocked)'),
    ] : [
      npm(c.data, ['test'], 'data and coordination tests'),
      npm(c.data, ['run', 'typecheck'], 'data typecheck'),
      npm(c.data, ['run', 'seed:validate'], 'selected bounded seed contract (fixtures cannot pass production)'),
      node(c.server, ['build'], 'pinned server build'),
      node(c.client, ['build'], 'pinned client normal build; no index/data pulls'),
      npm(c.server, ['run', 'lint'], 'server lint'),
      npm(c.server, ['run', 'tsc'], 'server typecheck'),
      node(c.server, ['node_modules/mocha/bin/mocha.js', '--grep', coreGrep, '--forbid-only'], 'server tests excluding exactly two live DNS cases and upstream (slow)'),
      npm(c.client, ['test'], 'client normal build, typechecks, lint and asset-dependent tests'),
    ];
    process.exitCode = await supervise(commands);
    if (!process.exitCode && mode === 'core') {
      const first = JSON.stringify(manifest(c), null, 2) + '\n';
      writeSnapshot(first);
      const second = JSON.stringify(manifest(c), null, 2) + '\n';
      if (first !== second || fs.readFileSync(path.join(root, '.local/compatibility.json'), 'utf8') !== second) {
        throw Error('CI manifest is not reproducible');
      }
      console.log('Reproducible source snapshot (not production certification):\n' + first);
    }
  } finally { release(); }
  if (!process.exitCode && mode === 'core') {
    process.exitCode = await supervise([node(c.data, ['tools/ci/smoke.mjs'], 'coordinated lifecycle smoke')]);
  }
} catch (e) { console.error(`[ci] ${e.message}`); process.exitCode = 1; }
