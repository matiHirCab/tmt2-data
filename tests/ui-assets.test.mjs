import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {parseArgs, runDownload, uiAssetPaths, limits} from '../tools/sprites/download.mjs';
import {validatePNG, pngLimits} from '../tools/sprites/png.mjs';
import {crc32} from '../tools/provenance/bps.mjs';

// Code-generated unit fixtures, never official artwork or selected production assets.
const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function chunk(type, bytes = Buffer.alloc(0)) {
  const entry = Buffer.alloc(bytes.length + 12);
  entry.writeUInt32BE(bytes.length); entry.write(type, 4, 'latin1'); bytes.copy(entry, 8);
  entry.writeUInt32BE(crc32(entry.subarray(4, bytes.length + 8)), bytes.length + 8);
  return entry;
}
function png({width = 1, height = 1} = {}) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([signature, chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.alloc((1 + width * 4) * height))), chunk('IEND')]);
}
const image = png();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const options = {ids: ['rattata'], withUI: true, timeoutMs: 100, retries: 0};
const expectedUI = ['sprites/trainers/rosa.png', 'sprites/trainers/lyra.png',
  'sprites/pokemonicons-sheet.png', 'sprites/pokemonicons-pokeball-sheet.png'];
function temp(t) {
  const base = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'tmt2 UI assets '));
  t.after(() => fs.rmSync(base, {recursive: true, force: true}));
  return base;
}
test('UI flag composes with default/custom Pokemon lists and never accepts arbitrary paths', async t => {
  assert.equal(parseArgs([]).withUI, false);
  assert.equal(parseArgs(['--with-ui']).withUI, true);
  assert.deepEqual(uiAssetPaths, expectedUI); assert.ok(Object.isFrozen(uiAssetPaths));
  const base = temp(t), file = path.join(base, 'ids.txt'); fs.writeFileSync(file, 'pidgeot-mega\n');
  assert.deepEqual(parseArgs(['--with-ui', '--file', file]).ids, ['pidgeot-mega']);
  assert.deepEqual(parseArgs(['--pokemon', 'eevee', '--with-ui']).ids, ['eevee']);
  for (const args of [['--with-ui', '--with-ui'], ['--with-ui', 'https://other.test/x'],
    ['--with-ui=../x'], ['--with-ui', '--ui-path', 'sprites/other.png']]) assert.throws(() => parseArgs(args));
  await assert.rejects(runDownload({...options, withUI: 'yes'}, {outputBase: base}), /boolean/);
  assert.deepEqual(fs.readdirSync(base), ['ids.txt']);
  assert.match(execFileSync(process.execPath, ['tools/sprites/download.mjs', '--help'], {encoding: 'utf8'}), /--with-ui/);
});
test('PNG structure validates CRCs, bounded dimensions, chunk ordering and required image data', () => {
  assert.deepEqual(validatePNG(image), {width: 1, height: 1});
  assert.deepEqual(validatePNG(png({height: 6000})), {width: 1, height: 6000}); // Icon sheets can exceed GIF height limits.
  const corrupt = Buffer.from(image); corrupt[42] ^= 1;
  for (const bytes of [gif, Buffer.from('<html>403</html>'), image.subarray(0, -1),
    Buffer.concat([image, Buffer.from('trailing')]), corrupt, Buffer.alloc(limits.maxFileBytes + 1)]) {
    assert.throws(() => validatePNG(bytes), /PNG/);
  }
  const originalHeader = image.subarray(16, 29);
  for (const [at, value] of [[0, 0], [0, pngLimits.maxDimension + 1], [8, 3], [9, 1], [10, 1], [11, 1], [12, 2]]) {
    const header = Buffer.from(originalHeader);
    if (at === 0) header.writeUInt32BE(value); else header[at] = value;
    assert.throws(() => validatePNG(Buffer.concat([signature, chunk('IHDR', header), image.subarray(33)])));
  }
  const header = Buffer.from(originalHeader); header.writeUInt32BE(8192); header.writeUInt32BE(8192, 4);
  assert.throws(() => validatePNG(Buffer.concat([signature, chunk('IHDR', header), image.subarray(33)])));
  const ihdr = image.subarray(8, 33), idat = image.subarray(33, -12), end = chunk('IEND');
  for (const chunks of [[idat, ihdr, end], [ihdr, ihdr, idat, end], [ihdr, end],
    [ihdr, chunk('IDAT'), end], [ihdr, idat, chunk('tEXt'), idat, end],
    [ihdr, chunk('BADX'), idat, end], [ihdr, idat, chunk('IEND', Buffer.from('bad'))]]) {
    assert.throws(() => validatePNG(Buffer.concat([signature, ...chunks])));
  }
  assert.deepEqual(validatePNG(Buffer.concat([signature, ihdr, chunk('IDAT'), idat, end])), {width: 1, height: 1});
});
test('default UI bundle preserves exactly twelve GIFs/four PNGs with trusted URLs and a complete ZIP', async t => {
  const base = temp(t), requests = [];
  const result = await runDownload({withUI: true, timeoutMs: 100, retries: 0}, {
    outputBase: base, fetchImpl: async (url, opts) => {
      requests.push(url); assert.equal(opts.redirect, 'manual'); assert.equal(opts.credentials, 'omit');
      assert.equal(new URL(url).origin, 'https://play.pokemonshowdown.com');
      const format = url.endsWith('.png') ? 'png' : 'gif'; assert.equal(opts.headers.Accept, `image/${format}`);
      return new Response(format === 'png' ? image : gif);
    },
  });
  assert.equal(requests.length, 16); assert.deepEqual(requests.slice(-4), expectedUI.map(p => `https://play.pokemonshowdown.com/${p}`));
  assert.equal(result.report.complete, true); assert.equal(result.manifest.complete, true);
  assert.equal(result.report.requestedFiles, 16); assert.equal(result.report.downloadedFiles, 16);
  assert.deepEqual(result.manifest.requestedUIAssets, expectedUI);
  assert.equal(result.manifest.files.filter(f => f.gif).length, 12);
  for (const file of result.manifest.files) {
    const original = file.png ? image : gif;
    assert.equal(file.sha256, hash(original)); assert.equal(file.sizeBytes, original.length);
    assert.deepEqual(fs.readFileSync(path.join(result.folder, file.path)), original);
    if (file.png) assert.deepEqual(file.png, {width: 1, height: 1});
  }
  const archive = fs.readFileSync(path.join(result.folder, 'sprites.zip'));
  assert.equal(archive.readUInt32LE(archive.length - 22), 0x06054B50);
  assert.equal(archive.readUInt16LE(archive.length - 12), 17); // Sixteen originals plus manifest.
  assert.equal(result.report.archive.sha256, hash(archive));
  const again = await runDownload(options, {outputBase: base, fetchImpl: async u => new Response(u.endsWith('.png') ? image : gif)});
  assert.notEqual(again.folder, result.folder); assert.equal(again.report.downloadedFiles, 6);
});
test('UI asset 403/redirect/corrupt PNG are terminal, preserve successful originals and withhold ZIP', async t => {
  const base = temp(t);
  for (const [response, code] of [[() => new Response('forbidden', {status: 403}), 'http-403'],
    [() => new Response('redirect', {status: 302, headers: {location: 'https://other.test/art'}}), 'http-302'],
    [() => new Response(gif), 'invalid-png']]) {
    let calls = 0;
    const result = await runDownload({...options, retries: 2}, {outputBase: base, fetchImpl: async u => {
      calls++; return u.endsWith('/lyra.png') ? response() : new Response(u.endsWith('.png') ? image : gif);
    }});
    assert.equal(calls, 6); assert.equal(result.report.downloadedFiles, 5); assert.equal(result.report.complete, false);
    assert.equal(result.manifest.complete, false); assert.equal(result.report.archive, null);
    assert.equal(result.report.failures.length, 1); assert.equal(result.report.failures[0].code, code);
    assert.equal(result.report.failures[0].asset, 'sprites/trainers/lyra.png');
    assert.equal(result.report.failures[0].attempts, 1);
    assert.equal(fs.existsSync(path.join(result.folder, 'sprites.zip')), false);
    assert.equal(fs.existsSync(path.join(result.folder, 'sprites/trainers/lyra.png')), false);
    assert.deepEqual(fs.readFileSync(path.join(result.folder, 'sprites/trainers/rosa.png')), image);
  }
});
test('UI assets share bounded transient retries, byte limits and cancellation reporting', async t => {
  const base = temp(t); let failures = 0;
  const retried = await runDownload({...options, retries: 1}, {outputBase: base, fetchImpl: async u => {
    if (u.endsWith('/rosa.png') && !failures++) return new Response('retry', {status: 503});
    return new Response(u.endsWith('.png') ? image : gif);
  }});
  assert.equal(retried.report.complete, true);
  assert.equal(retried.manifest.files.find(f => f.asset?.endsWith('rosa.png')).attempts, 2);
  const large = await runDownload(options, {outputBase: base, fetchImpl: async u => u.endsWith('.png') ?
    new Response(image, {headers: {'content-length': String(limits.maxFileBytes + 1)}}) : new Response(gif)});
  assert.equal(large.report.downloadedFiles, 2); assert.equal(large.report.archive, null);
  assert.ok(large.report.failures.every(f => f.code === 'too-large'));
  const controller = new AbortController();
  const stopped = await runDownload(options, {outputBase: base, signal: controller.signal, fetchImpl: async u => {
    if (u.endsWith('/rosa.png')) controller.abort();
    return new Response(u.endsWith('.png') ? image : gif);
  }});
  assert.equal(stopped.report.complete, false); assert.equal(stopped.report.downloadedFiles, 2);
  assert.ok(stopped.report.failures.every(f => f.code === 'cancelled'));
});
