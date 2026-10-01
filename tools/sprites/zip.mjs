import fs from 'node:fs';
import {crc32} from '../provenance/bps.mjs';

// Portable, uncompressed ZIP; no shell, external executable or new dependency.
// Fixed DOS timestamp (1980-01-01) makes equal entries byte-identical.
export function writeZip(target, entries) {
  if (entries.length > 65535) throw Error('Too many ZIP entries');
  const names = new Set();
  for (const entry of entries) {
    if (!/^[a-zA-Z0-9._/-]+$/.test(entry.name) || entry.name.startsWith('/') ||
        entry.name.split('/').some(part => !part || part === '..' || part === '.') || names.has(entry.name)) {
      throw Error('Unsafe or duplicate ZIP entry');
    }
    names.add(entry.name);
  }
  const fd = fs.openSync(target, 'wx', 0o600);
  let offset = 0;
  const central = [];
  function write(bytes) {
    let written = 0;
    while (written < bytes.length) {
      const count = fs.writeSync(fd, bytes, written, bytes.length - written);
      if (!count) throw Error('ZIP write made no progress');
      written += count;
    }
    offset += bytes.length;
    if (offset > 0xFFFFFFFF) throw Error('ZIP64 archives are unsupported');
  }
  try {
    for (const entry of [...entries].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const bytes = fs.readFileSync(entry.file);
      const name = Buffer.from(entry.name);
      const crc = crc32(bytes);
      const localOffset = offset;
      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034B50, 0); local.writeUInt16LE(20, 4);
      local.writeUInt16LE(0x800, 6); local.writeUInt16LE(33, 12);
      local.writeUInt32LE(crc, 14); local.writeUInt32LE(bytes.length, 18);
      local.writeUInt32LE(bytes.length, 22); local.writeUInt16LE(name.length, 26);
      write(local); write(name); write(bytes);
      const record = Buffer.alloc(46);
      record.writeUInt32LE(0x02014B50, 0); record.writeUInt16LE(20, 4);
      record.writeUInt16LE(20, 6); record.writeUInt16LE(0x800, 8);
      record.writeUInt16LE(33, 14); record.writeUInt32LE(crc, 16);
      record.writeUInt32LE(bytes.length, 20); record.writeUInt32LE(bytes.length, 24);
      record.writeUInt16LE(name.length, 28); record.writeUInt32LE(localOffset, 42);
      central.push(record, name);
    }
    const start = offset;
    for (const record of central) write(record);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054B50, 0);
    end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(offset - start, 12); end.writeUInt32LE(start, 16);
    write(end);
  } finally { fs.closeSync(fd); }
}
