import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {validatePins, loadPins, verifyPins} from '../tools/ci/pins.mjs';
import {coreGrep, networkGrep, networkTests} from '../tools/ci/policy.mjs';

test('CI pins reject floating versions, unapproved repositories and unsafe values', () => {
  const pins = loadPins(); assert.equal(validatePins(structuredClone(pins)).schemaVersion, 1);
  for (const mutate of [p => p.server.commit = 'master', p => p.client.repository = 'smogon/pokemon-showdown',
    p => p.node = '24.x', p => p.npm = '11.9.0\ncommand=x', p => p.extra = true, p => p.schemaVersion = 2]) {
    const bad = structuredClone(pins); mutate(bad); assert.throws(() => validatePins(bad));
  }
});
test('CI selection moves exactly the two known DNS cases, keeping unrelated IP and battle tests', () => {
  const core = new RegExp(coreGrep); const network = new RegExp(networkGrep);
  assert.equal(networkTests.length, 2);
  for (const name of networkTests) { assert.equal(core.test(name), false); assert.equal(network.test(name), true); }
  for (const name of ['IP tools should parse CIDR ranges', 'Move damage immunity', 'DNS should test a new feature',
    'IP tools should resolve unknown IPs correctly with new semantics']) {
    assert.equal(core.test(name), true); assert.equal(network.test(name), false);
  }
  assert.equal(core.test('Battle random (slow) case'), false);
});
test('CI pin mismatch and dirty sibling rejection leave files untouched', t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'tmt2-ci-'));
  t.after(() => fs.rmSync(base, {recursive: true, force: true}));
  const c = {}; const pins = structuredClone(loadPins());
  for (const role of ['server', 'client']) {
    c[role] = path.join(base, role); fs.mkdirSync(c[role]);
    fs.writeFileSync(path.join(c[role], 'source'), 'original');
    for (const args of [['init', '-q'], ['add', '.'], ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture']]) {
      execFileSync('git', args, {cwd: c[role]});
    }
    pins[role].commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: c[role], encoding: 'utf8'}).trim();
  }
  const versions = {node: pins.node, npm: pins.npm}; verifyPins(c, pins, versions);
  assert.throws(() => verifyPins(c, pins, {...versions, node: '22.18.0'}), /requires node/);
  const wrong = structuredClone(pins); wrong.server.commit = '0'.repeat(40);
  assert.throws(() => verifyPins(c, wrong, versions), /not at the CI pin/);
  fs.writeFileSync(path.join(c.server, 'source'), 'user edit');
  assert.throws(() => verifyPins(c, pins, versions), /dirty/);
  assert.equal(fs.readFileSync(path.join(c.server, 'source'), 'utf8'), 'user edit');
});

test('workflow action references use complete SHA-1 pins instead of malformed or floating refs', () => {
  const workflow = fs.readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const references = [...workflow.matchAll(/^\s+uses:\s+(\S+)/gm)].map(match => match[1]);
  assert.ok(references.length > 0, 'Workflow must contain action references');
  for (const reference of references) {
    assert.match(reference, /^actions\/(checkout|setup-node)@[a-f0-9]{40}$/);
  }
});
