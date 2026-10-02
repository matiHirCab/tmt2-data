import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {writeZip} from './zip.mjs';
import {validatePNG, pngLimits} from './png.mjs';

export const seedIDs = ['rattata', 'eevee', 'froakie', 'nosepass', 'floragato', 'pidgeot'];
export const uiAssetPaths = Object.freeze(['sprites/trainers/rosa.png', 'sprites/trainers/lyra.png',
  'sprites/pokemonicons-sheet.png', 'sprites/pokemonicons-pokeball-sheet.png']);
export const limits = Object.freeze({maxIDs: 32, maxFileBytes: 8 * 1024 * 1024,
  maxTotalBytes: 128 * 1024 * 1024, maxInputBytes: 32768, runTimeoutMs: 600000});
const repo = fileURLToPath(new URL('../../', import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
class DownloadError extends Error {
  constructor(code, message, retryable = false) { super(message); this.code = code; this.retryable = retryable; }
}
export function validateIDs(value) {
  if (!Array.isArray(value) || !value.length || value.length > limits.maxIDs) {
    throw Error(`Provide 1-${limits.maxIDs} exact sprite IDs`);
  }
  const seen = new Set();
  return value.map(id => {
    if (typeof id !== 'string' || id.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      throw Error('Use exact lowercase sprite filename IDs, e.g. pidgeot-mega; no URLs, paths or name guessing');
    }
    if (seen.has(id)) throw Error(`Duplicate sprite ID: ${id}`);
    seen.add(id); return id;
  });
}
export function IDsFromFile(filename) {
  const stat = fs.statSync(filename);
  if (!stat.isFile() || stat.size > limits.maxInputBytes) throw Error('Sprite list must be a regular file of at most 32 KiB');
  const bytes = fs.readFileSync(filename);
  if (bytes.length > limits.maxInputBytes) throw Error('Sprite list exceeds 32 KiB');
  const content = new TextDecoder('utf-8', {fatal: true}).decode(bytes).trim();
  if (content.startsWith('[') || path.extname(filename).toLowerCase() === '.json') {
    return validateIDs(JSON.parse(content));
  }
  return validateIDs(content.split(/\r?\n/).filter(line => !line.trim().startsWith('#'))
    .join(',').split(',').map(id => id.trim()).filter(Boolean));
}
export function parseArgs(args) {
  const result = {ids: seedIDs, timeoutMs: 15000, retries: 1, withUI: false};
  let selector = false;
  const seen = new Set();
  for (let at = 0; at < args.length; at++) {
    const arg = args[at];
    if (arg === '--help' || arg === '-h') { result.help = true; continue; }
    if (!['--pokemon', '--file', '--timeout-ms', '--retries', '--with-ui'].includes(arg) || seen.has(arg)) throw Error(`Unknown or repeated option: ${arg}`);
    seen.add(arg);
    if (arg === '--with-ui') { result.withUI = true; continue; }
    const value = args[++at];
    if (!value || value.startsWith('--')) throw Error(`Missing value for ${arg}`);
    if (arg === '--pokemon' || arg === '--file') {
      if (selector) throw Error('Choose --pokemon or --file, not both');
      selector = true;
      result.ids = arg === '--file' ? IDsFromFile(path.resolve(value)) : validateIDs(value.split(',').map(id => id.trim()));
    } else {
      if (!/^\d+$/.test(value)) throw Error(`Invalid integer for ${arg}`);
      result[arg === '--retries' ? 'retries' : 'timeoutMs'] = Number(value);
    }
  }
  validateOptions(result);
  return result;
}
function validateOptions(options) {
  validateIDs(options.ids);
  if (typeof options.withUI !== 'boolean') throw Error('withUI must be a boolean');
  if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 100 || options.timeoutMs > 30000) throw Error('timeout-ms must be 100-30000');
  if (!Number.isInteger(options.retries) || options.retries < 0 || options.retries > 2) throw Error('retries must be 0-2');
}
export function validateGIF(bytes) {
  const invalid = () => { throw new DownloadError('invalid-gif', 'Invalid, truncated or oversized GIF'); };
  if (bytes.length < 14 || bytes.length > limits.maxFileBytes || !/^GIF8[79]a$/.test(bytes.subarray(0, 6).toString('ascii'))) invalid();
  const width = bytes.readUInt16LE(6), height = bytes.readUInt16LE(8);
  if (!width || !height || width > 4096 || height > 4096) invalid();
  let cursor = 13 + ((bytes[10] & 0x80) ? 3 * (2 ** ((bytes[10] & 7) + 1)) : 0);
  let frames = 0;
  function subblocks() {
    let total = 0;
    for (;;) {
      if (cursor >= bytes.length) invalid();
      const size = bytes[cursor++];
      if (!size) return total;
      if (cursor + size > bytes.length) invalid();
      total += size; cursor += size;
    }
  }
  while (cursor < bytes.length) {
    const marker = bytes[cursor++];
    if (marker === 0x3B) {
      if (!frames || cursor !== bytes.length) invalid();
      return {width, height, frames};
    }
    if (marker === 0x21) {
      if (cursor >= bytes.length) invalid();
      cursor++; subblocks();
    } else if (marker === 0x2C) {
      if (cursor + 9 > bytes.length || !bytes.readUInt16LE(cursor + 4) || !bytes.readUInt16LE(cursor + 6)) invalid();
      const packed = bytes[cursor + 8]; cursor += 9;
      if (packed & 0x80) cursor += 3 * (2 ** ((packed & 7) + 1));
      if (cursor >= bytes.length || bytes[cursor] < 2 || bytes[cursor] > 8) invalid();
      cursor++;
      if (!subblocks()) invalid();
      frames++;
    } else invalid();
  }
  invalid();
}
function safeDirectory(base) {
  const absolute = path.resolve(base);
  let at = path.parse(absolute).root;
  for (const part of absolute.slice(at.length).split(path.sep).filter(Boolean)) {
    at = path.join(at, part);
    const stat = fs.lstatSync(at, {throwIfNoEntry: false});
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) throw Error('Sprite output must use real directories, not symlinks');
    if (!stat) fs.mkdirSync(at, {mode: 0o700});
  }
  return absolute;
}
async function readResponse(response, signal) {
  const length = response.headers.get('content-length');
  if (length && /^\d+$/.test(length) && Number(length) > limits.maxFileBytes) {
    await response.body?.cancel().catch(() => {});
    throw new DownloadError('too-large', 'Image exceeds 8 MiB');
  }
  if (!response.body) throw new DownloadError('empty-response', 'Missing response body');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      signal.throwIfAborted();
      const next = await reader.read();
      if (next.done) break;
      size += next.value.length;
      if (size > limits.maxFileBytes) throw new DownloadError('too-large', 'Image exceeds 8 MiB');
      chunks.push(Buffer.from(next.value));
    }
    return Buffer.concat(chunks);
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
async function download(url, format, options, fetchImpl, signal) {
  let attempts = 0;
  for (;;) {
    attempts++;
    const timeout = AbortSignal.timeout(options.timeoutMs);
    const requestSignal = AbortSignal.any([signal, timeout]);
    try {
      requestSignal.throwIfAborted();
      const response = await fetchImpl(url, {method: 'GET', redirect: 'manual', credentials: 'omit', signal: requestSignal,
        headers: {Accept: `image/${format}`}});
      if (response.status !== 200) {
        await response.body?.cancel().catch(() => {});
        throw new DownloadError(`http-${response.status}`, `Official source returned HTTP ${response.status}; redirects are not followed`,
          [408, 429, 500, 502, 503, 504].includes(response.status));
      }
      const bytes = await readResponse(response, requestSignal);
      if (format === 'gif') return {bytes, metadata: {gif: validateGIF(bytes)}, attempts};
      try { return {bytes, metadata: {png: validatePNG(bytes, limits.maxFileBytes)}, attempts}; }
      catch { throw new DownloadError('invalid-png', 'Invalid, truncated, corrupt or oversized PNG'); }
    } catch (error) {
      const failure = signal.aborted ? new DownloadError('cancelled', 'Run cancelled or exceeded its 10-minute budget') :
        error instanceof DownloadError ? error : timeout.aborted ? new DownloadError('timeout', 'Request timed out', true) :
        new DownloadError('network', 'Network request failed; check connectivity without disabling security', true);
      if (!failure.retryable || attempts > options.retries) return {error: failure, attempts};
      try { await delay(200 * attempts, undefined, {signal}); }
      catch { return {error: new DownloadError('cancelled', 'Run cancelled'), attempts}; }
    }
  }
}
// fetchImpl/outputBase injection is internal test support, never a CLI host override.
export async function runDownload(options = {}, {fetchImpl = globalThis.fetch,
  outputBase = path.join(repo, '.local/sprites'), signal = new AbortController().signal} = {}) {
  options = {ids: seedIDs, timeoutMs: 15000, retries: 1, withUI: false, ...options};
  validateOptions(options);
  const startedAt = new Date().toISOString();
  const folder = fs.mkdtempSync(path.join(safeDirectory(outputBase), 'download-'));
  const runSignal = AbortSignal.any([signal, AbortSignal.timeout(limits.runTimeoutMs)]);
  const files = [], failures = [];
  let total = 0;
  const requests = options.ids.flatMap(id => ['ani', 'ani-back'].map(facing =>
    ({id, facing, path: `sprites/${facing}/${id}.gif`, format: 'gif'})));
  if (options.withUI) requests.push(...uiAssetPaths.map(asset => ({asset, path: asset, format: 'png'})));
  for (const {path: relativePath, format, ...identity} of requests) {
    const sourceUrl = `https://play.pokemonshowdown.com/${relativePath}`;
    const result = await download(sourceUrl, format, options, fetchImpl, runSignal);
    if (result.error) {
      failures.push({...identity, sourceUrl, attempts: result.attempts, code: result.error.code, message: result.error.message});
      continue;
    }
    if (total + result.bytes.length > limits.maxTotalBytes) {
      failures.push({...identity, sourceUrl, attempts: result.attempts, code: 'run-too-large', message: 'Run exceeds 128 MiB'}); continue;
    }
    const target = path.join(folder, relativePath);
    try {
      fs.mkdirSync(path.dirname(target), {recursive: true, mode: 0o700});
      fs.writeFileSync(target, result.bytes, {flag: 'wx', mode: 0o600});
      total += result.bytes.length;
      files.push({...identity, sourceUrl, path: relativePath, sizeBytes: result.bytes.length,
        sha256: sha256(result.bytes), ...result.metadata, attempts: result.attempts});
    } catch { failures.push({...identity, sourceUrl, attempts: result.attempts, code: 'write', message: 'Could not preserve downloaded original'}); }
  }
  const manifest = {schemaVersion: 1, kind: 'official-showdown-sprites-local-evaluation', requestedIDs: options.ids,
    requestedUIAssets: options.withUI ? [...uiAssetPaths] : [],
    startedAt, finishedAt: new Date().toISOString(), complete: !failures.length,
    source: {origin: 'https://play.pokemonshowdown.com', indexes: ['https://play.pokemonshowdown.com/sprites/ani/',
      'https://play.pokemonshowdown.com/sprites/ani-back/'], credits: 'https://pokemonshowdown.com/credits'},
    redistributionRights: 'not-verified; public availability and code license do not establish asset redistribution rights',
    policy: {...limits, pngLimits, timeoutMs: options.timeoutMs, retries: options.retries, redirects: 'refused'}, files};
  fs.writeFileSync(path.join(folder, 'manifest.json'), json(manifest), {flag: 'wx', mode: 0o600});
  let archive = null;
  if (!failures.length) {
    const temporary = path.join(folder, 'sprites.zip.tmp');
    try {
      writeZip(temporary, [...files.map(file => ({name: file.path, file: path.join(folder, file.path)})),
        {name: 'manifest.json', file: path.join(folder, 'manifest.json')}]);
      fs.renameSync(temporary, path.join(folder, 'sprites.zip'));
      const bytes = fs.readFileSync(path.join(folder, 'sprites.zip'));
      archive = {path: 'sprites.zip', sizeBytes: bytes.length, sha256: sha256(bytes)};
    } catch {
      fs.rmSync(temporary, {force: true});
      fs.rmSync(path.join(folder, 'sprites.zip'), {force: true});
      failures.push({code: 'archive', message: 'ZIP creation failed; originals and manifest preserved'});
    }
  }
  const report = {schemaVersion: 1, complete: !failures.length, requestedFiles: requests.length,
    downloadedFiles: files.length, failures, archive};
  fs.writeFileSync(path.join(folder, 'report.json'), json(report), {flag: 'wx', mode: 0o600});
  return {folder, manifest, report};
}
const help = `Usage: npm run sprites:download -- [--pokemon rattata,eevee,pidgeot-mega | --file ids.txt] [--with-ui]\n  Default: ${seedIDs.join(',')}\n  --with-ui: also download rosa/lyra trainer PNGs and Pokemon/Pokeball icon sheets.\n  Files: UTF-8 IDs (one per line/comma, # comment lines), or a JSON array.\n  --timeout-ms 100..30000 (default15000); --retries 0..2 (default1).\n  Exact lowercase sprite filename IDs; forms retain hyphens. No alias/name lookup.\n  Outputs: unique ignored .local/sprites/download-*/ folder, manifest.json, report.json; ZIP only on full success.\n  Local evaluation only; redistribution rights are not established.\n`;
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const controller = new AbortController();
  let interrupted = 0;
  const onINT = () => { interrupted = 130; controller.abort(); };
  const onTERM = () => { interrupted = 143; controller.abort(); };
  process.once('SIGINT', onINT); process.once('SIGTERM', onTERM);
  try {
    const [major, minor] = process.versions.node.split('.').map(Number);
    if (major < 22 || (major === 22 && minor < 18)) throw Error('Node >=22.18 is required');
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log(help);
    else {
      const {folder, report} = await runDownload(options, {signal: controller.signal});
      console.log(`Saved ${report.downloadedFiles}/${report.requestedFiles} valid ${options.withUI ? 'images (GIF/PNG)' : 'GIFs'}: ${folder}`);
      console.log(report.complete ? 'Complete: sprites.zip contains originals and manifest.json' : 'Incomplete: no ZIP; inspect report.json for failures');
      process.exitCode = interrupted || (report.complete ? 0 : 1);
    }
  } catch (error) { console.error(`[sprites] ${error.message}`); process.exitCode = interrupted || 1; }
  finally { process.removeListener('SIGINT', onINT); process.removeListener('SIGTERM', onTERM); }
}
