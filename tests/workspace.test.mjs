import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawn} from 'node:child_process';
import net from 'node:net';
import {config, manifest, datasetIdentity, preflight, supervise, root, lockWorkspace} from '../tools/workspace/core.mjs';
function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'tmt2 workspace '));
  t.after(() => fs.rmSync(base, {recursive: true, force: true}));
  for (const [dir, name] of [['tmt2-data', 'tmt2-data'], ['Pokemon-Too-Many-Types-2', 'pokemon-showdown'], ['Pokemon-Too-Many-Types-2-client', 'pokemon-showdown-client']]) {
    const cwd = path.join(base, dir); fs.mkdirSync(cwd);
    fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({name}));
    for (const args of [['init', '-q'], ['add', '.'], ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture']]) execFileSync('git', args, {cwd});
  }
  return {base, data: path.join(base, 'tmt2-data')};
}
test('config defaults, alternate paths, strict keys, wrong package and ports', t => {
  const f = fixture(t); const c = config({}, f.data);
  assert.equal(c.serverPort, 8000);
  const filename = path.join(f.base, 'config.json');
  const read = value => { fs.writeFileSync(filename, JSON.stringify(value)); return config({TMT2_WORKSPACE_CONFIG: filename}, f.data); };
  const paths = {server: './Pokemon-Too-Many-Types-2', client: './Pokemon-Too-Many-Types-2-client'};
  assert.equal(read(paths).server, c.server);
  for (const bad of [{...paths, typo: true}, {...paths, serverPort: '8000'}, {...paths, clientPort: 8000}, {...paths, serverPort: 0}, {...paths, server: 'tmt2-data'}, {...paths, dataset: 4}, null]) assert.throws(() => read(bad));
  assert.throws(() => config({TMT2_SERVER_DIR: '/nonexistent'}, f.data));
  fs.writeFileSync(path.join(c.client, 'package.json'), '{"name":"wrong"}');
  assert.throws(() => config({}, f.data), /Wrong client/);
});
test('manifest deterministic, portable and sensitive to edits, new files and commits', t => {
  const f = fixture(t); const c = config({}, f.data);
  const initial = manifest(c);
  assert.deepEqual(manifest(c), initial);
  assert.equal(JSON.stringify(initial).includes(f.base), false);
  assert.equal(initial.dataset.status, 'absent');
  fs.writeFileSync(path.join(c.server, 'new.txt'), 'one');
  const changed = manifest(c); assert.notDeepEqual(changed, initial);
  fs.writeFileSync(path.join(c.server, 'new.txt'), 'two');
  assert.notDeepEqual(manifest(c), changed);
  fs.rmSync(path.join(c.server, 'new.txt'));
  assert.deepEqual(manifest(c), initial);
  execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-qm', 'next'], {cwd: c.server});
  assert.notDeepEqual(manifest(c), initial);
  fs.unlinkSync(path.join(c.client, 'package.json'));
  assert.equal(manifest(c).repositories.client.dirty, true);
});
test('dataset identity never masquerades as production validation; dependencies required', t => {
  const f = fixture(t); const c = config({}, f.data);
  assert.throws(() => preflight(c), /dependencies missing/);
  c.dataset = path.join(f.base, 'fixture.json');
  fs.writeFileSync(c.dataset, JSON.stringify({kind: 'test-fixture', version: 'synthetic-identity-only'}));
  assert.equal(datasetIdentity(c).productionValidated, false);
  fs.writeFileSync(c.dataset, '{}'); assert.throws(() => datasetIdentity(c));
});
test('supervisor propagates failure, stops sequence and handles spawn failure', async t => {
  const f = fixture(t); const output = path.join(f.base, 'must-not-exist');
  const node = code => ({file: process.execPath, args: ['-e', code], cwd: f.base, label: 'synthetic process'});
  assert.equal(await supervise([node('process.exit(7)'), node(`require('fs').writeFileSync(${JSON.stringify(output)}, '')`)], {graceMs: 30}), 7);
  assert.equal(fs.existsSync(output), false);
  assert.equal(await supervise([{file: '/no-such-command', args: [], cwd: f.base, label: 'missing'}], {graceMs: 30}), 1);
  assert.equal(await supervise([node('process.exit(0)')], {services: true, graceMs: 30}), 1);
});
test('service failure kills a stubborn grandchild holding a port', async t => {
  const f = fixture(t); const file = path.join(f.base, 'port');
  const grandchild = `const s=require('net').createServer(); s.listen(0,'127.0.0.1',()=>require('fs').writeFileSync(${JSON.stringify(file)},String(s.address().port)));process.on('SIGTERM',()=>{});`;
  const parent = `require('child_process').spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'ignore'});setInterval(()=>{},1000);process.on('SIGTERM',()=>{});`;
  const failing = `const fs=require('fs'); const timer=setInterval(()=>{if(fs.existsSync(${JSON.stringify(file)})){clearInterval(timer);process.exit(9)}},20);`;
  assert.equal(await supervise([parent, failing].map(code => ({file: process.execPath, args: ['-e', code], cwd: f.base, label: 'cleanup fixture'})), {services: true, graceMs: 100}), 9);
  const port = Number(fs.readFileSync(file));
  await new Promise(resolve => setTimeout(resolve, 100));
  await new Promise((resolve, reject) => { const s = net.createServer(); s.on('error', reject); s.listen(port, '127.0.0.1', () => s.close(resolve)); });
});
test('SIGINT closes supervised services and exits 130', async t => {
  const f = fixture(t); const entry = path.join(f.base, 'runner.mjs');
  fs.writeFileSync(entry, `import {supervise} from ${JSON.stringify(new URL('../tools/workspace/core.mjs', import.meta.url).href)}; process.exitCode=await supervise([{file:process.execPath,args:['-e','setInterval(()=>{},1000)'],cwd:process.cwd(),label:'started'}],{services:true,graceMs:50});`);
  const p = spawn(process.execPath, [entry], {stdio: ['ignore', 'pipe', 'pipe']});
  const exit = new Promise(resolve => p.on('exit', resolve));
  await new Promise(resolve => p.stdout.once('data', () => setTimeout(resolve, 100)));
  p.kill('SIGINT'); assert.equal(await exit, 130);
});
test('CLI rejects unsupported full builds before executing anything', () => {
  assert.throws(() => execFileSync(process.execPath, [path.join(root, 'tools/workspace/cli.mjs'), 'build', 'full'], {stdio: 'pipe'}), /Usage/);
});
test('static server exposes public assets only, supports HEAD, rejects sources and symlink escape', async t => {
  const f = fixture(t); const publicDir = path.join(f.base, 'public'); fs.mkdirSync(publicDir);
  fs.writeFileSync(path.join(publicDir, 'testclient-new.html'), '<p>synthetic</p>');
  fs.writeFileSync(path.join(publicDir, 'app.js'), '/* synthetic */');
  fs.writeFileSync(path.join(publicDir, 'key.php'), 'secret');
  fs.writeFileSync(path.join(publicDir, '.hidden'), 'secret');
  fs.symlinkSync(path.join(f.data, 'package.json'), path.join(publicDir, 'escape.json'));
  const p = spawn(process.execPath, [path.join(root, 'tools/workspace/static.mjs'), publicDir, '0'], {stdio: ['ignore', 'pipe', 'pipe']});
  const exit = new Promise(resolve => p.once('exit', resolve));
  t.after(async () => { p.kill(); await exit; });
  const line = await new Promise((resolve, reject) => { p.stdout.once('data', data => resolve(String(data))); p.once('error', reject); });
  const url = `http://127.0.0.1:${line.match(/on (\d+)/)[1]}`;
  assert.equal(await (await fetch(url)).text(), '<p>synthetic</p>');
  assert.equal((await fetch(url + '/app.js')).headers.get('content-type'), 'text/javascript');
  assert.equal(await (await fetch(url, {method: 'HEAD'})).text(), '');
  for (const name of ['/key.php', '/.hidden', '/escape.json', '/%zz', '/missing']) assert.equal((await fetch(url + name)).status, 404);
  assert.equal((await fetch(url, {method: 'POST'})).status, 405);
});
test('readiness failure shuts down service group', async () => {
  const status = await supervise([{file: process.execPath, args: ['-e', 'setInterval(()=>{},1000)'], cwd: root, label: 'readiness fixture'}], {services: true, graceMs: 40, ready: async () => { throw Error('synthetic readiness failure'); }});
  assert.equal(status, 1);
});

test('workspace lock rejects concurrent operations and can be released', t => {
  const f = fixture(t);
  const release = lockWorkspace(f.data);
  assert.throws(() => lockWorkspace(f.data), /already locked/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.data, '.local/operation.lock'))).pid, process.pid);
  release();
  lockWorkspace(f.data)();
});
