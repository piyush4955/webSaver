// Simple pure JS script to generate valid PNG icon files for Chrome Extension without external dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size, primaryColor, borderColor, accentColor) {
  // Width and height: size x size
  const width = size;
  const height = size;

  // RGBA buffer: 4 bytes per pixel, plus 1 filter byte per scanline
  const rawData = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      const borderThickness = Math.max(1, Math.floor(size / 16));
      const isBorder = (
        x < borderThickness || 
        x >= width - borderThickness || 
        y < borderThickness || 
        y >= height - borderThickness
      );

      // Bookmark / card icon shape inside
      const pad = Math.floor(size * 0.22);
      const isGlyph = (
        x >= pad && x < width - pad &&
        y >= pad && y < height - pad &&
        !(y > height - pad - Math.floor(size * 0.2) && Math.abs(x - width / 2) < Math.floor(size * 0.15))
      );

      const isShadow = (
        x >= width - borderThickness - Math.floor(size * 0.1) &&
        y >= height - borderThickness - Math.floor(size * 0.1)
      );

      if (isBorder) {
        rawData[pixelOffset] = borderColor[0];
        rawData[pixelOffset + 1] = borderColor[1];
        rawData[pixelOffset + 2] = borderColor[2];
        rawData[pixelOffset + 3] = 255;
      } else if (isGlyph) {
        rawData[pixelOffset] = accentColor[0];
        rawData[pixelOffset + 1] = accentColor[1];
        rawData[pixelOffset + 2] = accentColor[2];
        rawData[pixelOffset + 3] = 255;
      } else if (isShadow) {
        rawData[pixelOffset] = 200;
        rawData[pixelOffset + 1] = 180;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 255;
      } else {
        rawData[pixelOffset] = primaryColor[0];
        rawData[pixelOffset + 1] = primaryColor[1];
        rawData[pixelOffset + 2] = primaryColor[2];
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression method
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace method

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    
    // CRC calculation
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Quick CRC32 table & function
  function crc32(buf) {
    let table = crc32.table;
    if (!table) {
      table = crc32.table = new Int32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
          c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
      }
    }
    let c = -1;
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ -1) >>> 0;
  }

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Neobrutalist palette: Vivid Gold (#FFE600), Black (#0E0E0E), Cyan Accent (#00F0FF)
const yellow = [255, 230, 0];
const black = [14, 14, 14];
const cyan = [0, 240, 255];

[16, 32, 48, 128].forEach(size => {
  const iconBuffer = createPNG(size, yellow, black, cyan);
  const filePath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filePath, iconBuffer);
  console.log(`Generated: icon${size}.png (${size}x${size})`);
});
