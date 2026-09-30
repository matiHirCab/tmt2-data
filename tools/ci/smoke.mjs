import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawn, spawnSync} from 'node:child_process';
import {config, root} from '../workspace/core.mjs';
const c = config();
const child = spawn(process.execPath, ['tools/workspace/cli.mjs', 'dev'], {
  cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
});
const ended = new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
const timeout = (promise, ms, message) => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error(message)), ms); })])
    .finally(() => clearTimeout(timer));
};
let output = '';
child.stderr.on('data', bytes => process.stderr.write(bytes));
try {
  await timeout(new Promise((resolve, reject) => {
    child.stdout.on('data', bytes => {
      process.stdout.write(bytes); output = (output + bytes).slice(-4096);
      if (output.includes('[workspace] READY ')) resolve();
    });
    child.once('error', reject);
    child.once('exit', code => reject(Error(`dev exited before READY: ${code}`)));
  }), 240000, 'dev startup timed out (including offline index generation)');
  for (const url of [`http://127.0.0.1:${c.clientPort}/testclient-new.html`, `http://127.0.0.1:${c.serverPort}/showdown/info`]) {
    assert.equal((await fetch(url, {signal: AbortSignal.timeout(5000)})).status, 200);
  }
  let ws;
  try {
    await timeout(new Promise((resolve, reject) => {
      ws = new WebSocket(`ws://127.0.0.1:${c.serverPort}/showdown/websocket`);
      ws.onmessage = event => { if (String(event.data).includes('|updateuser|')) resolve(); };
      ws.onerror = () => reject(Error('WebSocket failed'));
    }), 5000, 'WebSocket protocol timed out');
  } finally { ws?.close(); }
  for (const command of ['build', 'manifest:write', 'manifest:check']) {
    const result = spawnSync(process.execPath, ['tools/workspace/cli.mjs', command], {cwd: root, encoding: 'utf8', timeout: 10000});
    assert.equal(result.status, 1); assert.match(result.stderr, /already locked/);
  }
  child.kill('SIGTERM');
  assert.equal(await timeout(ended, 10000, 'shutdown timed out'), 143);
  assert.equal(fs.existsSync(path.join(root, '.local/operation.lock')), false);
  for (const port of [c.serverPort, c.clientPort]) {
    await new Promise((resolve, reject) => {
      const server = net.createServer(); server.once('error', reject);
      server.listen(port, '127.0.0.1', () => server.close(resolve));
    });
  }
  console.log('Lifecycle passed: HTTP/WS, concurrent-operation rejection, SIGTERM 143, lock removal, ports released. No TMT2 battle certified.');
} catch (e) { console.error(e.message); process.exitCode = 1; }
finally {
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    try { await timeout(ended, 10000, 'cleanup timed out'); }
    catch (e) { console.error(e.message); child.kill('SIGKILL'); process.exitCode = 1; }
  }
}
