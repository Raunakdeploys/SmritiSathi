const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table for PNG chunk checksums
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createPNG(width, height, isMaskable = false) {
  // 1. Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // 2. IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = Buffer.concat([
    Buffer.from('IHDR'),
    ihdrData
  ]);
  const ihdrLen = Buffer.alloc(4);
  ihdrLen.writeUInt32BE(13, 0);
  const ihdrCrc = Buffer.alloc(4);
  ihdrCrc.writeUInt32BE(crc32(ihdrChunk), 0);

  // 3. Raw RGBA Scanlines
  // Each scanline: 1 byte filter (0) + width * 4 bytes RGBA
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const rCircle = width * (isMaskable ? 0.35 : 0.42);

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: SmritiSaathi Navy (#002045)
      let r = 0x00;
      let g = 0x20;
      let b = 0x45;
      let a = 0xff;

      // Outer accent ring: Saffron / Warm Orange (#FF6321)
      if (dist >= rCircle - 4 && dist <= rCircle + 4) {
        r = 0xff;
        g = 0x63;
        b = 0x21;
      }
      // Inner emblem: Lotus / Heart shape
      else if (dist < rCircle - 6) {
        // Subtle gradient towards center
        const t = dist / rCircle;
        if (dist < rCircle * 0.5) {
          // Warm vibrant center #FF6321
          r = Math.round(0xff * (1 - t * 0.4));
          g = Math.round(0x63 * (1 - t * 0.4));
          b = Math.round(0x21 * (1 - t * 0.4));
        } else {
          // Mid-gradient
          r = Math.round(0x00 + 0x20 * (1 - t));
          g = Math.round(0x30 + 0x30 * (1 - t));
          b = Math.round(0x65 + 0x20 * (1 - t));
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Deflate IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = Buffer.concat([
    Buffer.from('IDAT'),
    compressed
  ]);
  const idatLen = Buffer.alloc(4);
  idatLen.writeUInt32BE(compressed.length, 0);
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc32(idatChunk), 0);

  // 4. IEND
  const iendChunk = Buffer.from('IEND');
  const iendLen = Buffer.alloc(4);
  iendLen.writeUInt32BE(0, 0);
  const iendCrc = Buffer.alloc(4);
  iendCrc.writeUInt32BE(crc32(iendChunk), 0);

  return Buffer.concat([
    signature,
    ihdrLen, ihdrChunk, ihdrCrc,
    idatLen, idatChunk, idatCrc,
    iendLen, iendChunk, iendCrc
  ]);
}

const publicDir = path.join(__dirname, '..', 'public');

console.log('Generating PNG icons in:', publicDir);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, false));

console.log('Icons generated successfully!');
