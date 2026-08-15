import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, '.generated');
const SIZE = 1024;
const SCALE = 2;
const W = SIZE * SCALE;
const H = SIZE * SCALE;
const pixels = new Uint8Array(W * H * 4);

function clamp(v, min = 0, max = 1) { return Math.max(min, Math.min(max, v)); }
function gradient(x, y) {
  const t = clamp((x / W) * 0.72 + (1 - y / H) * 0.28);
  const a = [39, 29, 139];
  const b = [28, 160, 244];
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}
function put(x, y, color) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (Math.floor(y) * W + Math.floor(x)) * 4;
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = 255;
}
function circle(cx, cy, r, colorFn = gradient) {
  const minX = Math.max(0, Math.floor(cx - r));
  const maxX = Math.min(W - 1, Math.ceil(cx + r));
  const minY = Math.max(0, Math.floor(cy - r));
  const maxY = Math.min(H - 1, Math.ceil(cy + r));
  const rr = r * r;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= rr) put(x, y, colorFn(x, y));
    }
  }
}
function stroke(points, width, colorFn = gradient) {
  const radius = width / 2;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const d = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.ceil(d / Math.max(2, radius * 0.28)));
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      circle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, radius, colorFn);
    }
  }
}
function ring(cx, cy, radius, width) {
  const points = [];
  for (let i = 0; i <= 260; i += 1) {
    const a = (i / 260) * Math.PI * 2;
    points.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
  }
  stroke(points, width);
}
function arc(cx, cy, radius, fromDeg, toDeg, width) {
  const points = [];
  for (let i = 0; i <= 100; i += 1) {
    const a = (fromDeg + (toDeg - fromDeg) * (i / 100)) * Math.PI / 180;
    points.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
  }
  stroke(points, width);
}
function roundedRect(x, y, w, h, radius, color) {
  const colorFn = () => color;
  for (let yy = y + radius; yy < y + h - radius; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) put(xx, yy, color);
  }
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x + radius; xx < x + w - radius; xx += 1) put(xx, yy, color);
  }
  circle(x + radius, y + radius, radius, colorFn);
  circle(x + w - radius, y + radius, radius, colorFn);
  circle(x + radius, y + h - radius, radius, colorFn);
  circle(x + w - radius, y + h - radius, radius, colorFn);
}

const s = SCALE;
// Approved Solfedjio symbol: circular piano body + note + sound waves.
ring(405 * s, 675 * s, 150 * s, 34 * s);
stroke([[500 * s, 245 * s], [500 * s, 675 * s]], 46 * s);
const flag = [];
for (let i = 0; i <= 120; i += 1) {
  const t = i / 120;
  const mt = 1 - t;
  const x = mt * mt * 500 + 2 * mt * t * 710 + t * t * 630;
  const y = mt * mt * 245 + 2 * mt * t * 290 + t * t * 455;
  flag.push([x * s, y * s]);
}
stroke(flag, 45 * s);
const dark = [35, 29, 127];
roundedRect(345 * s, 585 * s, 34 * s, 145 * s, 15 * s, dark);
roundedRect(412 * s, 585 * s, 34 * s, 145 * s, 15 * s, dark);
stroke([[362 * s, 715 * s], [362 * s, 806 * s]], 5 * s, () => dark);
stroke([[429 * s, 715 * s], [429 * s, 815 * s]], 5 * s, () => dark);
arc(555 * s, 680 * s, 78 * s, -53, 53, 24 * s);
arc(555 * s, 680 * s, 128 * s, -53, 53, 25 * s);
arc(555 * s, 680 * s, 182 * s, -53, 53, 27 * s);

// Downsample 2x, retaining a transparent anti-aliased mark.
const mark = new Uint8Array(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    let alphaSamples = 0;
    const rgb = [0, 0, 0];
    for (let oy = 0; oy < SCALE; oy += 1) {
      for (let ox = 0; ox < SCALE; ox += 1) {
        const i = (((y * SCALE + oy) * W) + (x * SCALE + ox)) * 4;
        if (pixels[i + 3] > 0) {
          alphaSamples += 1;
          rgb[0] += pixels[i];
          rgb[1] += pixels[i + 1];
          rgb[2] += pixels[i + 2];
        }
      }
    }
    const o = (y * SIZE + x) * 4;
    if (alphaSamples > 0) {
      mark[o] = Math.round(rgb[0] / alphaSamples);
      mark[o + 1] = Math.round(rgb[1] / alphaSamples);
      mark[o + 2] = Math.round(rgb[2] / alphaSamples);
      mark[o + 3] = Math.round(255 * alphaSamples / (SCALE * SCALE));
    }
  }
}

function onWhite(source) {
  const result = new Uint8Array(source.length);
  for (let i = 0; i < source.length; i += 4) {
    const a = source[i + 3] / 255;
    result[i] = Math.round(source[i] * a + 255 * (1 - a));
    result[i + 1] = Math.round(source[i + 1] * a + 255 * (1 - a));
    result[i + 2] = Math.round(source[i + 2] * a + 255 * (1 - a));
    result[i + 3] = 255;
  }
  return result;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function pngBuffer(rgba) {
  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
  for (let y = 0; y < SIZE; y += 1) {
    const row = y * (SIZE * 4 + 1);
    raw[row] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * SIZE * 4, SIZE * 4).copy(raw, row + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
const transparentPng = pngBuffer(mark);
const whitePng = pngBuffer(onWhite(mark));
writeFileSync(resolve(OUT, 'mark.png'), transparentPng);
writeFileSync(resolve(OUT, 'adaptive-icon.png'), transparentPng);
writeFileSync(resolve(OUT, 'splash-icon.png'), transparentPng);
writeFileSync(resolve(OUT, 'icon.png'), whitePng);
console.log(`[brand] generated approved Solfedjio mark (${transparentPng.length} bytes)`);
