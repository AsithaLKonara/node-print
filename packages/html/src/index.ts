import puppeteer from 'puppeteer';
import { PNG } from 'pngjs';
import { EscPosBuilder } from '@asithakonara/escpos';

export interface HtmlPrintOptions {
  widthMm?: 58 | 80;
}

export async function htmlToEscPos(html: string, options?: HtmlPrintOptions): Promise<Buffer> {
  // Thermal printers are typically 203dpi (8 dots/mm).
  // 80mm = ~576 dots (pixels). 58mm = ~384 dots (pixels).
  const is58mm = options?.widthMm === 58;
  const widthPx = is58mm ? 384 : 576;

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: widthPx, height: 100, deviceScaleFactor: 1 });
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  // Add base CSS to remove margins and enforce width
  await page.addStyleTag({
    content: `
      body { margin: 0; padding: 0; width: ${widthPx}px; overflow-x: hidden; font-family: sans-serif; background-color: white; }
      * { box-sizing: border-box; }
    `
  });

  const screenshot = await page.screenshot({ type: 'png', fullPage: true });
  await browser.close();

  // Convert PNG to 1-bit monochrome boolean array for EscPosBuilder
  const png = PNG.sync.read(Buffer.from(screenshot));
  const pixels: boolean[] = [];

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];

      // Luminance formula
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
      
      // If transparent or light color, it's white (false). If dark, it's black (true).
      const isBlack = a > 128 && luminance < 128;
      pixels.push(isBlack);
    }
  }

  const builder = new EscPosBuilder();
  builder.image(pixels, png.width, png.height);
  builder.feed(3);
  builder.cut();

  return builder.build();
}
