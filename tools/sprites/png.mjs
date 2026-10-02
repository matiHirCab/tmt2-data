import {crc32} from '../provenance/bps.mjs';

export const pngLimits = Object.freeze({maxDimension: 16384, maxPixels: 16 * 1024 * 1024});
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
// Structural validation only: compressed pixels are neither decoded nor executed.
export function validatePNG(bytes, maxBytes = 8 * 1024 * 1024) {
  const invalid = () => { throw Error('Invalid, truncated, corrupt or oversized PNG'); };
  if (bytes.length < 57 || bytes.length > maxBytes || !bytes.subarray(0, 8).equals(signature)) invalid();
  let cursor = 8, width, height, bitDepth, colorType, palette = false, idat = false, data = false, dataEnded = false;
  while (cursor < bytes.length) {
    if (cursor + 12 > bytes.length) invalid();
    const length = bytes.readUInt32BE(cursor);
    if (length > bytes.length - cursor - 12) invalid();
    const type = bytes.subarray(cursor + 4, cursor + 8).toString('latin1');
    if (!/^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(type)) invalid();
    const end = cursor + 8 + length;
    if (crc32(bytes.subarray(cursor + 4, end)) !== bytes.readUInt32BE(end)) invalid();
    if (cursor === 8 && type !== 'IHDR') invalid();
    if (idat && type !== 'IDAT') dataEnded = true;
    if (type === 'IHDR') {
      if (cursor !== 8 || length !== 13) invalid();
      width = bytes.readUInt32BE(cursor + 8); height = bytes.readUInt32BE(cursor + 12);
      bitDepth = bytes[cursor + 16]; colorType = bytes[cursor + 17];
      const depths = {0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16]};
      if (!width || !height || width > pngLimits.maxDimension || height > pngLimits.maxDimension ||
          width * height > pngLimits.maxPixels || !depths[colorType]?.includes(bitDepth) ||
          bytes[cursor + 18] !== 0 || bytes[cursor + 19] !== 0 || bytes[cursor + 20] > 1) invalid();
    } else if (type === 'PLTE') {
      if (palette || idat || !length || length % 3 || length > 768 || [0, 4].includes(colorType) ||
          (colorType === 3 && length / 3 > 2 ** bitDepth)) invalid();
      palette = true;
    } else if (type === 'IDAT') {
      if (dataEnded || (colorType === 3 && !palette)) invalid();
      idat = true;
      // Empty IDAT chunks are legal, but the complete stream must contain data.
      if (length) data = true;
    } else if (type === 'IEND') {
      if (length || !data || end + 4 !== bytes.length) invalid();
      return {width, height};
    } else if (type[0] === type[0].toUpperCase()) invalid(); // Unknown critical chunk.
    cursor = end + 4;
  }
  invalid();
}
