import fs from 'node:fs';
import path from 'node:path';
import {inspectBps} from './bps.mjs';
try {
  const files = process.argv.slice(2);
  if (!files.length) throw Error('Usage: npm run source:inspect -- <patch.bps> [patch.bps ...]');
  const records = files.map(file => {
    const stat = fs.statSync(file);
    if (!stat.isFile()) throw Error('Input must be a regular file');
    if (stat.size > 32 * 1024 * 1024) throw Error('Patch exceeds inspector limit (32 MiB)');
    return {filename: path.basename(file), ...inspectBps(fs.readFileSync(file))};
  });
  console.log(JSON.stringify(records, null, 2));
} catch (error) { console.error(`[bps] ${error.message}`); process.exitCode = 1; }
