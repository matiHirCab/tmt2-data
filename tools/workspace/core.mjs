import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync, spawn} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], {encoding: 'utf8'}).trim();
export function config(env = process.env, base = root) {
  const filename = env.TMT2_WORKSPACE_CONFIG && path.resolve(env.TMT2_WORKSPACE_CONFIG);
  const value = filename ? JSON.parse(fs.readFileSync(filename, 'utf8')) : {};
  if (!value || Array.isArray(value) || typeof value !== 'object') throw Error('Config must be an object');
  for (const key of Object.keys(value)) {
    if (!['server', 'client', 'serverPort', 'clientPort', 'dataset'].includes(key)) throw Error(`Unknown config key: ${key}`);
  }
  const result = {data: fs.realpathSync(base)};
  for (const [key, fallback] of [['server', '../Pokemon-Too-Many-Types-2'], ['client', '../Pokemon-Too-Many-Types-2-client']]) {
    const input = env[`TMT2_${key.toUpperCase()}_DIR`] ?? value[key] ?? fallback;
    if (typeof input !== 'string' || !input.trim()) throw Error(`Invalid ${key} path`);
    result[key] = fs.realpathSync(path.resolve(filename ? path.dirname(filename) : base, input));
  }
  if (new Set(Object.values(result)).size !== 3 || new Set(Object.values(result).map(p => path.dirname(p))).size !== 1) {
    throw Error('Three distinct sibling repositories are required');
  }
  for (const [key, expected] of [['data', 'tmt2-data'], ['server', 'pokemon-showdown'], ['client', 'pokemon-showdown-client']]) {
    const dir = result[key];
    if (fs.realpathSync(git(dir, 'rev-parse', '--show-toplevel')) !== dir) throw Error(`${key} must be a Git root`);
    if (JSON.parse(fs.readFileSync(path.join(dir, 'package.json'))).name !== expected) throw Error(`Wrong ${key} package`);
  }
  for (const [key, fallback] of [['serverPort', 8000], ['clientPort', 8080]]) {
    result[key] = value[key] ?? fallback;
    if (!Number.isInteger(result[key]) || result[key] < 1024 || result[key] > 65535) throw Error(`Invalid ${key}`);
  }
  if (result.serverPort === result.clientPort) throw Error('Ports must differ');
  if (value.dataset !== undefined) {
    if (typeof value.dataset !== 'string' || !value.dataset) throw Error('Invalid dataset path');
    result.dataset = path.resolve(filename ? path.dirname(filename) : base, value.dataset);
  }
  return result;
}
export function preflight(c) {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 18)) throw Error('Node >=22.18 required');
  for (const [repo, dependency] of [['data', 'typescript'], ['server', 'ts-chacha20'], ['client', '@babel/core']]) {
    if (!fs.existsSync(path.join(c[repo], 'node_modules', dependency, 'package.json'))) {
      throw Error(`${repo}: dependencies missing; run npm ci in that repository`);
    }
  }
}
export function datasetIdentity(c) {
  if (!c.dataset) return {status: 'absent', productionValidated: false};
  const bytes = fs.readFileSync(c.dataset);
  const d = JSON.parse(bytes);
  if (!d || !['test-fixture', 'production'].includes(d.kind) || typeof d.version !== 'string' || !d.version.trim()) {
    throw Error('Dataset identity requires kind (test-fixture|production) and nonempty version');
  }
  return {status: 'identified-unvalidated', kind: d.kind, version: d.version, sha256: hash(bytes), productionValidated: false};
}
export function manifest(c) {
  const repositories = {};
  for (const key of ['data', 'server', 'client']) {
    const cwd = c[key];
    // Hash the tracked working tree (including staged/unstaged edits), plus nonignored new files.
    const names = execFileSync('git', ['-C', cwd, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], {encoding: 'utf8'}).split('\0').filter(Boolean);
    const entries = [...new Set(names)].sort().map(name => {
      const p = path.join(cwd, name);
      try {
        const s = fs.lstatSync(p);
        return [name, s.isSymbolicLink() ? 'symlink' : (s.mode & 0o111 ? 'executable' : 'file'), hash(s.isSymbolicLink() ? fs.readlinkSync(p) : fs.readFileSync(p))];
      } catch (e) { if (e.code === 'ENOENT') return [name, 'deleted']; throw e; }
    });
    repositories[key] = {commit: git(cwd, 'rev-parse', 'HEAD'), dirty: Boolean(git(cwd, 'status', '--porcelain', '--untracked-files=all')), workingTreeSha256: hash(JSON.stringify(entries))};
  }
  return {schemaVersion: 1, purpose: 'workspace-snapshot-not-release-certification', repositories, dataset: datasetIdentity(c), protocolCompatibility: 'unverified'};
}

// POSIX process groups also include grandchildren started by npm and Showdown.
export async function supervise(commands, {services = false, graceMs = 2000, ready} = {}) {
  if (process.platform === 'win32') throw Error('Process supervision requires POSIX (use WSL on Windows)');
  const children = [];
  let stopping = false;
  let finish;
  const done = new Promise(resolve => { finish = resolve; });
  const signal = (child, sig) => { if (child.pid) { try { process.kill(-child.pid, sig); } catch (e) { if (e.code !== 'ESRCH') throw e; } } };
  const stop = code => {
    if (stopping) return;
    stopping = true;
    for (const child of children) signal(child, 'SIGTERM');
    setTimeout(() => {
      for (const child of children) signal(child, 'SIGKILL');
      finish(code);
    }, graceMs);
  };
  const interrupt = () => stop(130);
  const terminate = () => stop(143);
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', terminate);
  try {
    for (const command of commands) {
      if (stopping) break;
      console.log(`[workspace] ${command.label}`);
      const child = spawn(command.file, command.args, {cwd: command.cwd, stdio: 'inherit', detached: true});
      children.push(child);
      const ended = new Promise(resolve => {
        child.once('error', e => { console.error(e.message); stop(1); resolve(1); });
        child.once('exit', (code, sig) => { const status = sig ? 1 : code; if (services || status) stop(status || 1); resolve(status); });
      });
      if (!services && await ended) break;
    }
    if (!services && !stopping) stop(0);
    if (services && ready) void ready(() => stopping).catch(e => { console.error(e.message); stop(1); });
    return await done;
  } finally {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', terminate);
  }
}

export function lockWorkspace(base = root) {
  const file = path.join(localDirectory(base), 'operation.lock');
  let fd;
  try { fd = fs.openSync(file, 'wx'); }
  catch (e) {
    if (e.code === 'EEXIST') throw Error('Workspace operation already locked (.local/operation.lock). Stop the other command first; if it crashed, verify its PID is gone before removing the stale lock.');
    throw e;
  }
  try { fs.writeFileSync(fd, JSON.stringify({pid: process.pid}) + '\n'); }
  finally { fs.closeSync(fd); }
  const identity = fs.lstatSync(file);
  return () => {
    let current;
    try { current = fs.lstatSync(file); } catch (e) { if (e.code === 'ENOENT') return; throw e; }
    // Never remove a lock replaced by another operation or manual recovery.
    if (current.ino === identity.ino && current.dev === identity.dev) fs.unlinkSync(file);
  };
}

export function localDirectory(base = root) {
  const directory = path.join(base, '.local');
  fs.mkdirSync(directory, {recursive: true});
  if (fs.lstatSync(directory).isSymbolicLink()) throw Error('.local must not be a symlink');
  return directory;
}

export function writeSnapshot(content, base = root) {
  const directory = localDirectory(base);
  const temporary = path.join(directory, `compatibility.${randomUUID()}.tmp`);
  let created = false;
  try {
    // Exclusive creation never follows an existing temporary-file symlink.
    const fd = fs.openSync(temporary, 'wx', 0o600);
    created = true;
    try { fs.writeFileSync(fd, content); } finally { fs.closeSync(fd); }
    fs.renameSync(temporary, path.join(directory, 'compatibility.json'));
  } finally {
    if (created && fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

export function clientAssetStatus(c) {
  const required = ['data/text/en.js', 'data/pokedex.js', 'data/moves.js',
    'data/items.js', 'data/abilities.js', 'data/search-index.js',
    'data/teambuilder-tables.js', 'data/typechart.js', 'data/aliases.js',
    'data/graphics.js', 'data/commands.js', 'js/server/chat-formatter.js'];
  const missing = required.filter(file => !fs.existsSync(path.join(c.client, 'play.pokemonshowdown.com', file)));
  return {status: missing.length ? 'incomplete' : 'present-unvalidated', missing};
}
