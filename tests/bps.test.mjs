import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {crc32, inspectBps} from '../tools/provenance/bps.mjs';

// Entirely synthetic BPS fixtures: not ROM data or TMT2 facts.
function integer(value) {
  const bytes = [];
  for (;;) {
    const byte = value % 128;
    value = Math.floor(value / 128);
    if (!value) { bytes.push(byte | 128); return Buffer.from(bytes); }
    bytes.push(byte); value--;
  }
}
function fixture({source = 8, target = 4, metadata = Buffer.alloc(0), stream = Buffer.from([0x8D, 1, 2, 3, 4])} = {}) {
  const trailer = Buffer.alloc(12);
  trailer.writeUInt32LE(0x12345678, 0); trailer.writeUInt32LE(0x90ABCDEF, 4);
  const bytes = Buffer.concat([Buffer.from('BPS1'), integer(source), integer(target), integer(metadata.length), metadata, stream, trailer]);
  bytes.writeUInt32LE(crc32(bytes.subarray(0, -4)), bytes.length - 4);
  return bytes;
}
function action(mode, length) { return integer((length - 1) * 4 + mode); }

test('BPS inspector verifies CRC using known vector and deterministic metadata without applying', () => {
  assert.equal(crc32(Buffer.from('123456789')), 0xCBF43926);
  const patch = fixture({metadata: Buffer.from('synthetic')});
  const first = inspectBps(patch);
  assert.deepEqual(first, inspectBps(patch));
  assert.equal(first.metadata.sizeBytes, 9);
  assert.equal(first.sourceCrc32, '12345678');
  assert.equal(first.targetCrc32, '90ABCDEF');
  assert.equal(first.applied, false);
  assert.equal(first.sourceRomVerified, false);
  assert.equal(first.structureVerified, true);
});

test('BPS inspector handles all actions, signed offsets, multibyte integers and overlapping TargetCopy', () => {
  const stream = Buffer.concat([
    action(0, 2), action(1, 2), Buffer.from([7, 8]),
    action(2, 2), integer(6), // SourceCopy from offset 3, relative cursor becomes 5.
    action(2, 1), integer(9), // Move source cursor backwards by 4 to 1.
    action(3, 130), integer(0), // Copy from already written output, overlap permitted.
    action(3, 1), integer(259), // Move target cursor backwards by 129 to 1.
  ]);
  const result = inspectBps(fixture({target: 138, stream}));
  assert.deepEqual(result.actions, {sourceRead: 1, targetRead: 1, sourceCopy: 2, targetCopy: 2});
});

test('BPS inspector rejects corruption and truncation rather than emitting successful records', () => {
  const corrupt = fixture(); corrupt[8] ^= 1;
  assert.throws(() => inspectBps(corrupt), /CRC32/);
  assert.throws(() => inspectBps(Buffer.from('BPS1')), /header/);
  const highBitMagic = fixture(); highBitMagic[0] |= 128;
  assert.throws(() => inspectBps(highBitMagic), /header/);
  assert.throws(() => inspectBps(fixture({metadata: Buffer.alloc(0), stream: Buffer.from([0])})), /Truncated BPS integer/);
  assert.throws(() => inspectBps(fixture({stream: action(1, 4)})), /Truncated TargetRead/);
  assert.throws(() => inspectBps(fixture({stream: action(0, 3)})), /Incomplete/);
  assert.throws(() => inspectBps(fixture({stream: action(0, 5)})), /target size/);
  assert.throws(() => inspectBps(fixture({source: 1, stream: action(0, 4)})), /SourceRead/);
  assert.throws(() => inspectBps(fixture({stream: Buffer.concat([action(2, 4), integer(30)])})), /SourceCopy/);
  assert.throws(() => inspectBps(fixture({stream: Buffer.concat([action(2, 4), integer(3)])})), /relative copy/);
  assert.throws(() => inspectBps(fixture({stream: Buffer.concat([action(3, 4), integer(0)])})), /unwritten/);
  assert.throws(() => inspectBps(fixture({stream: Buffer.alloc(10, 127)})), /safe range/);
  const badMetadata = fixture(); badMetadata[6] = 0xFF;
  badMetadata.writeUInt32LE(crc32(badMetadata.subarray(0, -4)), badMetadata.length - 4);
  assert.throws(() => inspectBps(badMetadata), /Truncated metadata/);
});

test('BPS CLI fails for missing input or missing files', () => {
  for (const args of [[], ['/nonexistent/tmt2-test.bps']]) {
    const run = spawnSync(process.execPath, ['tools/provenance/inspect-bps.mjs', ...args], {encoding: 'utf8'});
    assert.equal(run.status, 1);
    assert.equal(run.stdout, '');
    assert.match(run.stderr, /\[bps\]/);
  }
});

test('source register binds selected bytes while keeping ROM and release authenticity unknown', async () => {
  const {readFile} = await import('node:fs/promises');
  const register = JSON.parse(await readFile(new URL('../provenance/sources.json', import.meta.url), 'utf8'));
  const selected = register.userPatch;
  assert.equal(register.selectedInput.sha256, selected.sha256);
  assert.equal(register.sources.find(source => source.id === selected.sourceId).snapshotSha256, selected.sha256);
  assert.equal(selected.structureVerified, true);
  assert.equal(selected.patchCrcVerified, true);
  assert.equal(selected.sourceRomVerified, false);
  assert.equal(selected.targetRomVerified, false);
  assert.equal(register.release.userPatchMatches, null);
  assert.equal(register.productionValidated, false);
  assert.equal(register.baseDescription.actualBaseRomVerified, false);
  assert.equal(new Set(register.comparisonPatches.map(patch => patch.sha256)).size, 2);
});
