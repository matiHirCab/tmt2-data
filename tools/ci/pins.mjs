import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {config, git, root} from '../workspace/core.mjs';

export function validatePins(pins) {
  const keys = (value, expected) => {
    if (!value || Array.isArray(value) || typeof value !== 'object' ||
        Object.keys(value).sort().join() !== expected.sort().join()) throw Error('Invalid CI pin keys');
  };
  keys(pins, ['schemaVersion', 'node', 'npm', 'server', 'client']);
  if (pins.schemaVersion !== 1) throw Error('Unsupported CI pin schema');
  for (const tool of ['node', 'npm']) {
    if (typeof pins[tool] !== 'string' || !/^\d+\.\d+\.\d+$/.test(pins[tool])) throw Error(`Pin an exact ${tool} version`);
  }
  for (const role of ['server', 'client']) {
    keys(pins[role], ['repository', 'commit']);
    const expected = `matiHirCab/Pokemon-Too-Many-Types-2${role === 'client' ? '-client' : ''}`;
    if (pins[role].repository !== expected || typeof pins[role].commit !== 'string' || !/^[a-f0-9]{40}$/.test(pins[role].commit)) throw Error(`Invalid ${role} repository/commit pin`);
  }
  return pins;
}
export const loadPins = () => validatePins(JSON.parse(fs.readFileSync(path.join(root, 'ci/pins.json'), 'utf8')));
export function verifyPins(c, pins = loadPins(), versions = {
  node: process.versions.node, npm: execFileSync('npm', ['--version'], {encoding: 'utf8'}).trim(),
}) {
  for (const tool of ['node', 'npm']) {
    if (versions[tool] !== pins[tool]) throw Error(`CI requires ${tool} ${pins[tool]}, found ${versions[tool]}`);
  }
  for (const role of ['server', 'client']) {
    if (git(c[role], 'rev-parse', 'HEAD') !== pins[role].commit) throw Error(`${role} is not at the CI pin; checkout it explicitly, never auto-reset`);
    if (git(c[role], 'status', '--porcelain', '--untracked-files=all')) throw Error(`${role} source tree is dirty; preserve edits and use a clean checkout for CI`);
  }
  return pins;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const pins = loadPins();
    if (process.argv.length !== 3) throw Error('Usage: pins.mjs outputs|verify');
    if (process.argv[2] === 'outputs') {
      if (!process.env.GITHUB_OUTPUT) throw Error('GITHUB_OUTPUT is required');
      fs.appendFileSync(process.env.GITHUB_OUTPUT,
        `node=${pins.node}\nnpm=${pins.npm}\nserver_sha=${pins.server.commit}\nclient_sha=${pins.client.commit}\n`);
    } else if (process.argv[2] === 'verify') {
      verifyPins(config(), pins);
      console.log('Exact CI tool/repository pins verified');
    } else throw Error('Usage: pins.mjs outputs|verify');
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
