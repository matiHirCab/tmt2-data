import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {execFileSync} from 'node:child_process';
import {config, preflight, manifest, datasetIdentity, supervise, root, lockWorkspace, writeSnapshot, clientAssetStatus} from './core.mjs';
const [command, ...extra] = process.argv.slice(2);
const commands = ['doctor', 'build', 'test', 'dev', 'manifest:write', 'manifest:check', 'data:validate'];
const node = (cwd, args, label) => ({file: process.execPath, args, cwd, label});
async function free(port) {
  await new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(port, '127.0.0.1', () => s.close(resolve));
  });
}
try {
  if (!commands.includes(command) || extra.length) throw Error(`Usage: node tools/workspace/cli.mjs <${commands.join('|')}> (no extra arguments)`);
  const c = config();
  preflight(c);
  if (command === 'doctor') {
    console.log(JSON.stringify({paths: {data: c.data, server: c.server, client: c.client}, node: process.version, npm: execFileSync('npm', ['--version'], {encoding: 'utf8'}).trim(), git: execFileSync('git', ['--version'], {encoding: 'utf8'}).trim(), ports: [c.serverPort, c.clientPort], dataset: datasetIdentity(c), clientAssets: clientAssetStatus(c)}, null, 2));
  } else if (command.startsWith('manifest:')) {
    const release = lockWorkspace();
    try {
      const file = path.join(root, '.local/compatibility.json');
      const content = JSON.stringify(manifest(c), null, 2) + '\n';
      if (command === 'manifest:write') {
        writeSnapshot(content);
        console.log('Wrote .local/compatibility.json (snapshot, not production validation)');
      } else {
        if (fs.readFileSync(file, 'utf8') !== content) throw Error('Compatibility snapshot mismatch; inspect changes before regenerating');
        console.log('Compatibility snapshot matches');
      }
    } finally { release(); }
  } else if (command === 'data:validate') {
    console.log(JSON.stringify(datasetIdentity(c)));
    throw Error('Production validation incomplete: authoritative TMT2 data, schema and provenance checks are not implemented. No artifacts generated.');
  } else {
    const release = lockWorkspace();
    try {
      const builds = [node(c.server, ['build'], 'server build'), node(c.client, ['build'], 'client normal build (no runtime data generation or upstream indexes)')];
      if (command === 'build') process.exitCode = await supervise(builds);
      if (command === 'test') {
        process.exitCode = await supervise([
          node(c.data, ['--test', 'tests/workspace.test.mjs'], 'coordination tests'),
          node(c.data, ['node_modules/typescript/bin/tsc', '--noEmit'], 'data typecheck'),
          {file: 'npm', args: ['test'], cwd: c.server, label: 'server lint, tests, typecheck'},
          {file: 'npm', args: ['test'], cwd: c.client, label: 'client build, typecheck, lint, tests'},
        ]);
      }
      if (command === 'dev') {
        const assets = clientAssetStatus(c);
        if (assets.missing.length) console.warn(`[workspace] Client runtime assets incomplete: ${assets.missing.join(', ')}. Normal build does not generate these; testclient may attempt remote fallbacks. This is not a complete TMT2 client.`);
        await free(c.serverPort); await free(c.clientPort);
        const result = await supervise(builds);
        if (result) process.exitCode = result;
        else process.exitCode = await supervise([
          node(c.server, [path.join(root, 'tools/workspace/server.cjs'), String(c.serverPort)], 'local server'),
          node(c.client, [path.join(root, 'tools/workspace/static.mjs'), path.join(c.client, 'play.pokemonshowdown.com'), String(c.clientPort)], 'local client'),
        ], {services: true, ready: async stopped => {
          const url = `http://127.0.0.1:${c.clientPort}/testclient-new.html?~~localhost:${c.serverPort}`;
          for (let i = 0; i < 150 && !stopped(); i++) {
            try {
              const responses = await Promise.all([fetch(url, {signal: AbortSignal.timeout(500)}), fetch(`http://127.0.0.1:${c.serverPort}/showdown/info`, {signal: AbortSignal.timeout(500)})]);
              if (responses.every(r => r.ok)) { console.log(`[workspace] READY ${url}`); return; }
            } catch {}
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          if (!stopped()) throw Error('Services did not become ready within startup timeout');
        }});
      }
    } finally { release(); }
  }
} catch (e) { console.error(`[workspace] ${e.message}`); process.exitCode = 1; }
