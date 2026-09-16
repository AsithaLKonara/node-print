import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { Printer } from '@asithakonara/types';

const execAsync = promisify(exec);

export async function getPrinters(): Promise<Printer[]> {
  const platform = os.platform();
  
  try {
    if (platform === 'win32') {
      return await getWindowsPrinters();
    } else {
      return await getUnixPrinters();
    }
  } catch (err) {
    console.error('Error fetching printers:', err);
    return [];
  }
}

async function getWindowsPrinters(): Promise<Printer[]> {
  const { stdout } = await execAsync('powershell -Command "Get-Printer | Select-Object Name, PrinterStatus, Type, PortName, Default | ConvertTo-Json"');
  if (!stdout.trim()) return [];
  
  const printers = JSON.parse(stdout);
  const printerList = Array.isArray(printers) ? printers : [printers];
  
  return printerList.map((p: any) => ({
    id: p.Name,
    name: p.Name,
    status: p.PrinterStatus === 3 ? 'online' : 'unknown',
    type: 'unknown',
    connection: 'system',
    isDefault: p.Default === true
  }));
}

async function getUnixPrinters(): Promise<Printer[]> {
  const { stdout } = await execAsync('lpstat -p');
  const lines = stdout.split('\n');
  const printers: Printer[] = [];
  
  for (const line of lines) {
    if (line.startsWith('printer ')) {
      const match = line.match(/^printer\s+([^\s]+)\s+(.+)$/);
      if (match) {
        const id = match[1];
        const statusStr = match[2];
        const status = statusStr.includes('idle') || statusStr.includes('printing') ? 'online' : 'offline';
        printers.push({
          id,
          name: id.replace(/_/g, ' '),
          status,
          type: 'unknown',
          connection: 'system',
          isDefault: false
        });
      }
    }
  }
  
  try {
    const { stdout: defaultStdout } = await execAsync('lpstat -d');
    const defaultMatch = defaultStdout.match(/system default destination:\s+(.+)/);
    if (defaultMatch && defaultMatch[1]) {
      const defaultId = defaultMatch[1];
      const defaultPrinter = printers.find(p => p.id === defaultId);
      if (defaultPrinter) {
        defaultPrinter.isDefault = true;
      }
    }
  } catch (e) {
    // ignore
  }
  
  return printers;
}
