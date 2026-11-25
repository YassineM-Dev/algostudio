import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SIZE = 256;
const rgba = Buffer.alloc(SIZE * SIZE * 4);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const idx = (y * SIZE + x) * 4;
  if (a === 255) {
    rgba[idx] = r;
    rgba[idx + 1] = g;
    rgba[idx + 2] = b;
    rgba[idx + 3] = 255;
  } else if (a > 0) {
    const srcA = a / 255;
    const dstA = rgba[idx + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA > 0) {
      rgba[idx] = Math.round((r * srcA + rgba[idx] * dstA * (1 - srcA)) / outA);
      rgba[idx + 1] = Math.round((g * srcA + rgba[idx + 1] * dstA * (1 - srcA)) / outA);
      rgba[idx + 2] = Math.round((b * srcA + rgba[idx + 2] * dstA * (1 - srcA)) / outA);
      rgba[idx + 3] = Math.round(outA * 255);
    }
  }
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

// Draw dark rounded square container + vibrant crimson inner badge + crisp white <> emblem
const outerMargin = 12;
const outerRadius = 54;
const innerMargin = 32;
const innerRadius = 40;

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    // Signed distance to outer rounded box
    const ox = Math.max(outerMargin + outerRadius - x, 0, x - (SIZE - outerMargin - outerRadius));
    const oy = Math.max(outerMargin + outerRadius - y, 0, y - (SIZE - outerMargin - outerRadius));
    const outerDist = Math.hypot(ox, oy) - outerRadius;

    if (outerDist <= 1) {
      const alpha = Math.max(0, Math.min(255, Math.round((1 - outerDist) * 255)));
      // Deep charcoal #0F0F16 with subtle border #2A2A3B
      if (outerDist > -4) {
        setPixel(x, y, 42, 42, 59, alpha);
      } else {
        setPixel(x, y, 14, 14, 21, alpha);
      }
    }

    // Inner crimson gradient rounded square
    const ix = Math.max(innerMargin + innerRadius - x, 0, x - (SIZE - innerMargin - innerRadius));
    const iy = Math.max(innerMargin + innerRadius - y, 0, y - (SIZE - innerMargin - innerRadius));
    const innerDist = Math.hypot(ix, iy) - innerRadius;

    if (innerDist <= 1) {
      const alpha = Math.max(0, Math.min(255, Math.round((1 - innerDist) * 255)));
      const t = (x + y) / (2 * SIZE);
      const r = Math.round(229 + (255 - 229) * t);
      const g = Math.round(9 + (42 - 9) * t);
      const b = Math.round(20 + (42 - 20) * t);
      setPixel(x, y, r, g, b, alpha);
    }

    // Crisp white <> brackets (anti-aliased thick strokes)
    const stroke = 11.5;
    const d1 = distToSegment(x, y, 110, 82, 66, 128);
    const d2 = distToSegment(x, y, 66, 128, 110, 174);
    const d3 = distToSegment(x, y, 146, 82, 190, 128);
    const d4 = distToSegment(x, y, 190, 128, 146, 174);
    const dMin = Math.min(d1, d2, d3, d4);
    if (dMin <= stroke + 1.2) {
      const a = Math.max(0, Math.min(255, Math.round((stroke + 1.2 - dMin) * 180)));
      setPixel(x, y, 255, 255, 255, a);
    }
  }
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(width, height, rgbaBuf) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter None
    rgbaBuf.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Wrap 256x256 PNG into a valid Windows ICO container
function encodeIco(pngBuf) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type ICO
  header.writeUInt16LE(1, 4); // 1 image

  const entry = Buffer.alloc(16);
  entry[0] = 0; // 0 means 256px
  entry[1] = 0; // 0 means 256px
  entry[2] = 0; // color palette
  entry[3] = 0; // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(pngBuf.length, 8); // size
  entry.writeUInt32LE(22, 12); // offset (6 + 16)

  return Buffer.concat([header, entry, pngBuf]);
}

const buildDir = path.resolve('build');
fs.mkdirSync(buildDir, { recursive: true });
const png = encodePng(SIZE, SIZE, rgba);
const ico = encodeIco(png);

fs.writeFileSync(path.join(buildDir, 'icon.png'), png);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);
console.log(`Generated build/icon.png (${png.length} bytes) and build/icon.ico (${ico.length} bytes)`);
