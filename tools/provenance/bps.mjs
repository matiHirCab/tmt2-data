import {createHash} from 'node:crypto';

// Read-only BPS1 structural inspector. Never allocates or reconstructs a ROM.
const crcTable = Array.from({length: 256}, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xEDB88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
export function crc32(bytes) {
  let value = 0xFFFFFFFF;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xFFFFFFFF) >>> 0;
}
const hex = value => value.toString(16).toUpperCase().padStart(8, '0');
export function inspectBps(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 19 || !bytes.subarray(0, 4).equals(Buffer.from('BPS1'))) throw Error('Invalid BPS1 header');
  const end = bytes.length - 12;
  const patchCrc32 = bytes.readUInt32LE(end + 8);
  if (crc32(bytes.subarray(0, end + 8)) !== patchCrc32) throw Error('Patch CRC32 mismatch');
  let cursor = 4;
  function integer() {
    let value = 0, scale = 1;
    for (;;) {
      if (cursor >= end) throw Error('Truncated BPS integer');
      const byte = bytes[cursor++];
      value += (byte & 127) * scale;
      if (!Number.isSafeInteger(value)) throw Error('BPS integer exceeds safe range');
      if (byte & 128) return value;
      scale *= 128;
      value += scale;
      if (!Number.isSafeInteger(value) || !Number.isSafeInteger(scale)) throw Error('BPS integer exceeds safe range');
    }
  }
  const sourceSizeBytes = integer(), targetSizeBytes = integer(), metadataSizeBytes = integer();
  if (metadataSizeBytes > end - cursor) throw Error('Truncated metadata');
  const metadataBytes = bytes.subarray(cursor, cursor + metadataSizeBytes);
  cursor += metadataSizeBytes;
  let output = 0, sourceRelative = 0, targetRelative = 0;
  const actions = {sourceRead: 0, targetRead: 0, sourceCopy: 0, targetCopy: 0};
  const names = Object.keys(actions);
  while (cursor < end) {
    const instruction = integer(), mode = instruction % 4, length = Math.floor(instruction / 4) + 1;
    if (length > targetSizeBytes - output) throw Error('Action exceeds target size');
    if (mode === 0 && length > sourceSizeBytes - output) throw Error('SourceRead exceeds source size');
    if (mode === 1) {
      if (length > end - cursor) throw Error('Truncated TargetRead');
      cursor += length;
    }
    if (mode >= 2) {
      const encoded = integer();
      const delta = Math.floor(encoded / 2) * (encoded % 2 ? -1 : 1);
      const position = (mode === 2 ? sourceRelative : targetRelative) + delta;
      if (!Number.isSafeInteger(position) || position < 0) throw Error('Invalid relative copy offset');
      if (mode === 2) {
        if (length > sourceSizeBytes - position) throw Error('SourceCopy exceeds source size');
        sourceRelative = position + length;
      } else {
        // Overlap is valid, but the first copied byte must already exist.
        if (position >= output) throw Error('TargetCopy reads unwritten output');
        targetRelative = position + length;
      }
    }
    output += length;
    actions[names[mode]]++;
  }
  if (cursor !== end || output !== targetSizeBytes) throw Error('Incomplete BPS action stream');
  return {
    format: 'BPS1', sizeBytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    patchCrc32: hex(patchCrc32), patchCrcVerified: true, structureVerified: true,
    metadata: {sizeBytes: metadataSizeBytes, sha256: createHash('sha256').update(metadataBytes).digest('hex')},
    sourceSizeBytes, sourceCrc32: hex(bytes.readUInt32LE(end)),
    targetSizeBytes, targetCrc32: hex(bytes.readUInt32LE(end + 4)), actions,
    applied: false, sourceRomVerified: false, targetRomVerified: false,
  };
}
