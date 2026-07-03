import fs from 'fs';
import path from 'path';

// Uncompressed PNG writer in pure JS
function generatePng(width, height, getPixel) {
  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method
  const ihdr = makeChunk('IHDR', ihdrData);
  
  // IDAT data (pixels)
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixel = getPixel(x, y, width, height);
      rawData[pos++] = pixel.r;
      rawData[pos++] = pixel.g;
      rawData[pos++] = pixel.b;
      rawData[pos++] = pixel.a;
    }
  }
  
  // Simple Deflate uncompressed formatting
  const idatContent = deflateUncompressed(rawData);
  const idat = makeChunk('IDAT', idatContent);
  
  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function deflateUncompressed(data) {
  const chunks = [];
  let offset = 0;
  while (offset < data.length) {
    const chunkLength = Math.min(65535, data.length - offset);
    const isFinal = offset + chunkLength >= data.length;
    const header = Buffer.alloc(5);
    header[0] = isFinal ? 0x01 : 0x00; // BFINAL, BTYPE=0
    header.writeUInt16LE(chunkLength, 1);
    header.writeUInt16LE(~chunkLength & 0xFFFF, 3);
    chunks.push(header);
    chunks.push(data.subarray(offset, offset + chunkLength));
    offset += chunkLength;
  }
  
  const zlibHeader = Buffer.from([0x78, 0x01]);
  const adler = adler32(data);
  const adlerBuf = Buffer.alloc(4);
  adlerBuf.writeUInt32BE(adler, 0);
  
  return Buffer.concat([zlibHeader, ...chunks, adlerBuf]);
}

function adler32(data) {
  let s1 = 1;
  let s2 = 0;
  for (let i = 0; i < data.length; i++) {
    s1 = (s1 + data[i]) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  return ((s2 << 16) | s1) >>> 0;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return ~crc >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  
  const crcContent = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcContent);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  
  return Buffer.concat([lengthBuf, crcContent, crcBuf]);
}

function getLogoPixel(x, y, w, h) {
  const border = w * 0.12;
  const gap = w * 0.06;
  const sqSize = (w - 2 * border - gap) / 2;
  
  const bg = { r: 0x15, g: 0x0F, b: 0x38, a: 255 };
  const transparent = { r: 0, g: 0, b: 0, a: 0 };
  
  const r = w * 0.22;
  
  const isInsideBg = (px, py) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return false;
    if (px < r && py < r) return Math.hypot(px - r, py - r) <= r;
    if (px >= w - r && py < r) return Math.hypot(px - (w - r), py - r) <= r;
    if (px < r && py >= h - r) return Math.hypot(px - r, py - (h - r)) <= r;
    if (px >= w - r && py >= h - r) return Math.hypot(px - (w - r), py - (h - r)) <= r;
    return true;
  };
  
  if (!isInsideBg(x, y)) return transparent;
  
  const tlX = border;
  const tlY = border;
  if (x >= tlX && x < tlX + sqSize && y >= tlY && y < tlY + sqSize) {
    return { r: 0xF4, g: 0x72, b: 0xB6, a: 255 };
  }
  
  const trX = border + sqSize + gap;
  const trY = border;
  if (x >= trX && x < trX + sqSize && y >= trY && y < trY + sqSize) {
    return { r: 0x38, g: 0xBD, b: 0xF8, a: 255 };
  }
  
  const blX = border;
  const blY = border + sqSize + gap;
  if (x >= blX && x < blX + sqSize && y >= blY && y < blY + sqSize) {
    return { r: 0x34, g: 0xD3, b: 0x99, a: 255 };
  }
  
  const brX = border + sqSize + gap;
  const brY = border + sqSize + gap;
  if (x >= brX && x < brX + sqSize && y >= brY && y < brY + sqSize) {
    return { r: 0xFB, g: 0xBF, b: 0x24, a: 255 };
  }
  
  return bg;
}

const publicDir = './public';
if (!fs.existsSync(publicDir)){
    fs.mkdirSync(publicDir);
}

const png192 = generatePng(192, 192, getLogoPixel);
fs.writeFileSync(path.join(publicDir, 'logo.png'), png192);

const png32 = generatePng(32, 32, getLogoPixel);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), png32);

const icoHeader = Buffer.from([
  0x00, 0x00,
  0x01, 0x00,
  0x01, 0x00
]);

const icoEntry = Buffer.alloc(16);
icoEntry[0] = 32;
icoEntry[1] = 32;
icoEntry[2] = 0;
icoEntry[3] = 0;
icoEntry.writeUInt16LE(1, 4);
icoEntry.writeUInt16LE(32, 6);
icoEntry.writeUInt32LE(png32.length, 8);
icoEntry.writeUInt32LE(22, 12);

const icoFile = Buffer.concat([icoHeader, icoEntry, png32]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile);

console.log('Successfully generated logo.png, favicon.png, and favicon.ico!');
