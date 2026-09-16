import fs from 'fs';
import path from 'path';

export interface NodePrintConfig {
  port: number;
  security: {
    accessToken?: string;
    allowedOrigins: string[];
  };
  routes: Record<string, string>;
  queue: {
    retries: number;
  };
}

const defaultConfig: NodePrintConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 18181,
  security: {
    accessToken: process.env.ACCESS_TOKEN || undefined,
    allowedOrigins: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',') : ['*']
  },
  routes: {},
  queue: {
    retries: 3
  }
};

export function loadConfig(): NodePrintConfig {
  const cwd = process.cwd();
  
  const extensions = ['.js', '.json', '.ts'];
  for (const ext of extensions) {
    const configPath = path.join(cwd, `node-print.config${ext}`);
    if (fs.existsSync(configPath)) {
      try {
        if (ext === '.ts') {
          require('ts-node/register/transpile-only'); 
        }
        const userConfig = require(configPath);
        const resolved = userConfig.default || userConfig;
        
        return {
          port: resolved.port ?? defaultConfig.port,
          security: {
            accessToken: resolved.security?.accessToken ?? defaultConfig.security.accessToken,
            allowedOrigins: resolved.security?.allowedOrigins ?? defaultConfig.security.allowedOrigins
          },
          routes: { ...defaultConfig.routes, ...(resolved.routes || {}) },
          queue: {
            retries: resolved.queue?.retries ?? defaultConfig.queue.retries
          }
        };
      } catch (e: any) {
        console.warn(`[Node-Print] Failed to load config at ${configPath}:`, e.message);
      }
    }
  }

  return defaultConfig;
}

export const config = loadConfig();
