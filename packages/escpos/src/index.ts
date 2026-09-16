export type Alignment = 'left' | 'center' | 'right';

export interface Column {
  text: string;
  width: number;
  align?: Alignment;
}

export class EscPosBuilder {
  private buffer: Buffer[] = [];
  
  constructor() {
    this.init();
  }

  init() {
    this.buffer.push(Buffer.from([0x1b, 0x40])); // ESC @
    return this;
  }

  text(str: string) {
    this.buffer.push(Buffer.from(str));
    return this;
  }

  textLine(str: string) {
    this.text(str);
    this.feed(1);
    return this;
  }

  feed(lines = 1) {
    this.buffer.push(Buffer.alloc(lines, 0x0a));
    return this;
  }

  align(align: Alignment) {
    const map = { left: 0, center: 1, right: 2 };
    this.buffer.push(Buffer.from([0x1b, 0x61, map[align]]));
    return this;
  }

  bold(on = true) {
    this.buffer.push(Buffer.from([0x1b, 0x45, on ? 1 : 0]));
    return this;
  }

  size(width: 1|2|3|4|5|6|7|8 = 1, height: 1|2|3|4|5|6|7|8 = 1) {
    const n = ((width - 1) << 4) | (height - 1);
    this.buffer.push(Buffer.from([0x1d, 0x21, n]));
    return this;
  }

  cut() {
    // Partial cut with feed
    this.buffer.push(Buffer.from([0x1d, 0x56, 0x42, 0x00]));
    return this;
  }

  barcode(data: string, type: 'UPCA' | 'UPCE' | 'EAN13' | 'EAN8' | 'CODE39' | 'ITF' | 'CODABAR' | 'CODE93' | 'CODE128' = 'CODE128') {
    const map: Record<string, number> = { UPCA: 65, UPCE: 66, EAN13: 67, EAN8: 68, CODE39: 69, ITF: 70, CODABAR: 71, CODE93: 72, CODE128: 73 };
    const m = map[type];
    
    // Set HRI characters position to below barcode
    this.buffer.push(Buffer.from([0x1d, 0x48, 0x02])); 
    
    const d = Buffer.from(data);
    this.buffer.push(Buffer.from([0x1d, 0x6b, m, d.length]));
    this.buffer.push(d);
    return this;
  }

  qrcode(data: string, size = 3) {
    // Model 2
    this.buffer.push(Buffer.from([0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));
    // Size
    this.buffer.push(Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size]));
    // Error correction (M)
    this.buffer.push(Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]));
    // Store data
    const d = Buffer.from(data);
    const pL = (d.length + 3) & 0xff;
    const pH = (d.length + 3) >> 8;
    this.buffer.push(Buffer.from([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]));
    this.buffer.push(d);
    // Print
    this.buffer.push(Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]));
    return this;
  }
  
  image(pixels: boolean[], width: number, height: number) {
    // Raster bit image mode (GS v 0)
    const xL = Math.ceil(width / 8) & 0xff;
    const xH = Math.ceil(width / 8) >> 8;
    const yL = height & 0xff;
    const yH = height >> 8;

    this.buffer.push(Buffer.from([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]));

    const data = Buffer.alloc(xL * height, 0);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (pixels[y * width + x]) {
          const byteIndex = y * xL + Math.floor(x / 8);
          const bitIndex = 7 - (x % 8);
          data[byteIndex] |= (1 << bitIndex);
        }
      }
    }
    this.buffer.push(data);
    return this;
  }

  columns(cols: Column[]) {
    // Helper to format text into columns
    let line = '';
    for (const col of cols) {
      let text = col.text.substring(0, col.width);
      if (col.align === 'center') {
        const pad = Math.max(0, col.width - text.length);
        const left = Math.floor(pad / 2);
        const right = pad - left;
        line += ' '.repeat(left) + text + ' '.repeat(right);
      } else if (col.align === 'right') {
        line += text.padStart(col.width, ' ');
      } else {
        line += text.padEnd(col.width, ' ');
      }
    }
    this.textLine(line);
    return this;
  }

  build(): Buffer {
    return Buffer.concat(this.buffer);
  }
}
