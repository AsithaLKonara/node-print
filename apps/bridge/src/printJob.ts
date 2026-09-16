import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function printRawData(printerName: string, dataBuffer: Buffer): Promise<void> {
  const platform = os.platform();
  const tempFile = path.join(os.tmpdir(), `node-print-${Date.now()}.bin`);
  
  try {
    fs.writeFileSync(tempFile, dataBuffer);
    
    if (platform === 'win32') {
      // Note: On Windows, raw printing via CMD typically requires the printer to be shared.
      const cmd = `print /d:"\\\\localhost\\${printerName}" "${tempFile}"`;
      await execAsync(cmd);
    } else {
      // Unix/macOS raw printing
      const cmd = `lp -d "${printerName}" -o raw "${tempFile}"`;
      await execAsync(cmd);
    }
  } catch (error) {
    console.error('Error printing raw data:', error);
    throw error;
  } finally {
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (e) {
      // Ignore cleanup error
    }
  }
}
